import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useGesture } from '@use-gesture/react';

import './DomeGallery.css';

export type DomeGalleryImage = string | { src: string; alt?: string };

type DomeGalleryProps = {
  images: DomeGalleryImage[];
  fit?: number;
  fitBasis?: 'auto' | 'min' | 'max' | 'width' | 'height';
  minRadius?: number;
  maxRadius?: number;
  padFactor?: number;
  overlayBlurColor?: string;
  maxVerticalRotationDeg?: number;
  dragSensitivity?: number;
  enlargeTransitionMs?: number;
  segments?: number;
  dragDampening?: number;
  openedImageWidth?: string;
  openedImageHeight?: string;
  imageBorderRadius?: string;
  openedImageBorderRadius?: string;
  grayscale?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type Tile = {
  x: number;
  y: number;
  sizeX: number;
  sizeY: number;
  src: string;
  alt: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const wrapAngle = (degrees: number) => {
  const angle = ((degrees + 180) % 360 + 360) % 360;
  return angle - 180;
};

function buildItems(images: DomeGalleryImage[], segments: number): Tile[] {
  const columns = Array.from({ length: segments }, (_, index) => -37 + index * 2);
  const coordinates = columns.flatMap((x, column) => {
    const rows = column % 2 === 0 ? [-4, -2, 0, 2, 4] : [-3, -1, 1, 3, 5];
    return rows.map((y, rowIdx) => ({ x, y, sizeX: 2, sizeY: 2, column, row: rowIdx }));
  });

  const normalized = images.map((image) =>
    typeof image === 'string'
      ? { src: image, alt: '' }
      : { src: image.src, alt: image.alt ?? '' },
  );

  if (normalized.length === 0) {
    return coordinates.map(({ column: _column, row: _row, ...coordinate }) => ({
      ...coordinate,
      src: '',
      alt: '',
    }));
  }

  // Smart spatial distribution: ensure NO adjacent tile (column ±1 or row ±1) has the same image
  const total = normalized.length;
  const gridAssignments: Map<string, number> = new Map();

  return coordinates.map(({ column, row, ...coordinate }) => {
    // Collect forbidden indices from previously assigned neighboring tiles
    const forbidden = new Set<number>();
    for (let dc = -2; dc <= 0; dc++) {
      for (let dr = -2; dr <= 2; dr++) {
        if (dc === 0 && dr >= 0) continue;
        const key = `${column + dc}:${row + dr}`;
        if (gridAssignments.has(key)) {
          forbidden.add(gridAssignments.get(key)!);
        }
      }
    }

    // Ideal coprime stride to scatter photos evenly across 2D space
    let candidate = ((column * 7) + (row * 13) + ((column % 3) * 5)) % total;
    if (candidate < 0) candidate += total;

    // If candidate is too close to a neighbor, step to the next clean slot
    let tries = 0;
    while (forbidden.has(candidate) && tries < total) {
      candidate = (candidate + 1) % total;
      tries++;
    }

    gridAssignments.set(`${column}:${row}`, candidate);
    const chosen = normalized[candidate];
    return { ...coordinate, src: chosen.src, alt: chosen.alt };
  });
}

function getNumber(element: HTMLElement, name: string, fallback: number) {
  const value = Number(element.dataset[name]);
  return Number.isFinite(value) ? value : fallback;
}

export default function DomeGallery({
  images,
  fit = 0.5,
  fitBasis = 'auto',
  minRadius = 600,
  maxRadius = Infinity,
  padFactor = 0.2,
  overlayBlurColor = '#120f17',
  maxVerticalRotationDeg = 5,
  dragSensitivity = 20,
  enlargeTransitionMs = 350,
  segments = 35,
  dragDampening = 0.7,
  openedImageWidth = 'min(82vw, 500px)',
  openedImageHeight = 'min(82vw, 500px)',
  imageBorderRadius = '24px',
  openedImageBorderRadius = '28px',
  grayscale = false,
  onOpenChange,
}: DomeGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const sphereRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const focusedTileRef = useRef<HTMLButtonElement | null>(null);
  const inertiaRef = useRef<number | null>(null);
  const rotationRef = useRef({ x: 0, y: 0 });
  const lastDragRef = useRef(0);
  const openingRef = useRef(false);
  const [opened, setOpened] = useState<number | null>(null);

  const items = useMemo(() => buildItems(images, segments), [images, segments]);

  const applyTransform = useCallback((x: number, y: number) => {
    if (sphereRef.current) {
      sphereRef.current.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${x}deg) rotateY(${y}deg)`;
    }
  }, []);

  const stopInertia = useCallback(() => {
    if (inertiaRef.current !== null) {
      cancelAnimationFrame(inertiaRef.current);
      inertiaRef.current = null;
    }
  }, []);

  const startInertia = useCallback(
    (velocityX: number, velocityY: number) => {
      stopInertia();
      let xVelocity = clamp(velocityX, -1.4, 1.4) * 80;
      let yVelocity = clamp(velocityY, -1.4, 1.4) * 80;
      let frameCount = 0;
      const friction = 0.94 + 0.055 * clamp(dragDampening, 0, 1);

      const tick = () => {
        xVelocity *= friction;
        yVelocity *= friction;
        frameCount += 1;
        if (
          frameCount > 300 ||
          (Math.abs(xVelocity) < 0.015 && Math.abs(yVelocity) < 0.015)
        ) {
          inertiaRef.current = null;
          return;
        }

        const nextX = clamp(
          rotationRef.current.x - yVelocity / 200,
          -maxVerticalRotationDeg,
          maxVerticalRotationDeg,
        );
        const nextY = wrapAngle(rotationRef.current.y + xVelocity / 200);
        rotationRef.current = { x: nextX, y: nextY };
        applyTransform(nextX, nextY);
        inertiaRef.current = requestAnimationFrame(tick);
      };

      inertiaRef.current = requestAnimationFrame(tick);
    },
    [applyTransform, dragDampening, maxVerticalRotationDeg, stopInertia],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const minDimension = Math.max(1, Math.min(width, height));
      const aspect = width / Math.max(1, height);
      const basis =
        fitBasis === 'width'
          ? width
          : fitBasis === 'height'
            ? height
            : fitBasis === 'max'
              ? Math.max(width, height)
              : fitBasis === 'min'
                ? minDimension
                : aspect >= 1.3
                  ? width
                  : minDimension;

      const radius = clamp(
        Math.min(basis * fit, height * 1.35),
        minRadius,
        maxRadius,
      );
      root.style.setProperty('--radius', `${Math.round(radius)}px`);
      root.style.setProperty('--viewer-pad', `${Math.max(8, minDimension * padFactor)}px`);
      root.style.setProperty('--overlay-blur-color', overlayBlurColor);
      root.style.setProperty('--tile-radius', imageBorderRadius);
      root.style.setProperty('--enlarge-radius', openedImageBorderRadius);
      root.style.setProperty('--image-filter', grayscale ? 'grayscale(1)' : 'none');
      applyTransform(rotationRef.current.x, rotationRef.current.y);
    });

    resizeObserver.observe(root);
    return () => resizeObserver.disconnect();
  }, [
    applyTransform,
    fit,
    fitBasis,
    grayscale,
    imageBorderRadius,
    maxRadius,
    minRadius,
    openedImageBorderRadius,
    overlayBlurColor,
    padFactor,
  ]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpened(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      document.body.classList.remove('dg-scroll-lock');
      stopInertia();
    };
  }, [stopInertia]);

  useEffect(() => {
    if (opened !== null) {
      document.body.classList.add('dg-scroll-lock');
      window.setTimeout(() => closeButtonRef.current?.focus(), 30);
    } else {
      document.body.classList.remove('dg-scroll-lock');
    focusedTileRef.current?.focus();
    }
    onOpenChange?.(opened !== null);
  }, [onOpenChange, opened]);

  useGesture(
    {
      onDrag: ({
        movement,
        last,
        velocity = [0, 0],
        direction = [0, 0],
      }: {
        movement: [number, number];
        last: boolean;
        velocity?: [number, number];
        direction?: [number, number];
      }) => {
        if (opened !== null) return;
        const [moveX, moveY] = movement;
        const nextX = clamp(
          -moveY / dragSensitivity,
          -maxVerticalRotationDeg,
          maxVerticalRotationDeg,
        );
        const nextY = wrapAngle(moveX / dragSensitivity);
        rotationRef.current = { x: nextX, y: nextY };
        applyTransform(nextX, nextY);
        if (last) {
          lastDragRef.current = performance.now();
          startInertia(
            velocity[0] * direction[0],
            velocity[1] * direction[1],
          );
        }
      },
    },
    {
      target: mainRef,
      eventOptions: { passive: true },
      drag: { filterTaps: true },
    },
  );

  const openImage = (index: number) => {
    if (openingRef.current || performance.now() - lastDragRef.current < 100) return;
    openingRef.current = true;
    focusedTileRef.current = document.querySelector<HTMLButtonElement>(
      `[data-dome-index="${index}"] .item__image`,
    );
    setOpened(index);
    window.setTimeout(() => {
      openingRef.current = false;
    }, enlargeTransitionMs);
  };

  const currentItem = opened !== null ? items[opened % items.length] : null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (opened === null) return;
    setOpened((prev) => (prev! - 1 + items.length) % items.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (opened === null) return;
    setOpened((prev) => (prev! + 1) % items.length);
  };

  useEffect(() => {
    const handleKeyNav = (event: KeyboardEvent) => {
      if (opened === null) return;
      if (event.key === 'ArrowLeft') {
        setOpened((prev) => (prev! - 1 + items.length) % items.length);
      } else if (event.key === 'ArrowRight') {
        setOpened((prev) => (prev! + 1) % items.length);
      }
    };
    window.addEventListener('keydown', handleKeyNav);
    return () => window.removeEventListener('keydown', handleKeyNav);
  }, [opened, items.length]);

  return (
    <div
      ref={rootRef}
      className={`sphere-root ${opened !== null ? 'is-open' : ''}`}
      style={
        {
          '--segments-x': segments,
          '--segments-y': segments,
          '--overlay-blur-color': overlayBlurColor,
          '--tile-radius': imageBorderRadius,
          '--enlarge-radius': openedImageBorderRadius,
          '--image-filter': grayscale ? 'grayscale(1)' : 'none',
        } as CSSProperties
      }
    >
      <main ref={mainRef} className="sphere-main" aria-label="Shared memories">
        <div className="stage">
          <div ref={sphereRef} className="sphere">
            {items.map((item, index) => (
              <div
                key={`${item.src}-${index}`}
                className="item"
                data-dome-index={index}
                style={
                  {
                    '--offset-x': item.x,
                    '--offset-y': item.y,
                    '--item-size-x': item.sizeX,
                    '--item-size-y': item.sizeY,
                    '--float-delay': `${(index % 8) * 0.45}s`,
                  } as React.CSSProperties
                }
              >
                <button
                  type="button"
                  className="item__image"
                  aria-label={item.alt || `Open shared memory ${index + 1}`}
                  onClick={() => openImage(index)}
                >
                  <img src={item.src} alt={item.alt || 'A shared memory'} draggable={false} loading="lazy" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="overlay" />
        <div className="overlay overlay--blur" />
        <div className="edge-fade edge-fade--top" />
        <div className="edge-fade edge-fade--bottom" />
      </main>

      {/* Crystal-Clear Full-Screen Modal Lightbox */}
      {opened !== null && currentItem && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300"
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged memory photo"
        >
          {/* Frosted Scrim Backdrop */}
          <div
            className="absolute inset-0 bg-[#200D18]/85 backdrop-blur-xl transition-opacity"
            onClick={() => setOpened(null)}
            aria-hidden="true"
          />

          {/* Lightbox Container */}
          <div className="relative z-10 max-w-3xl w-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
            {/* Top Bar with Counter and Close Button */}
            <div className="w-full flex items-center justify-between mb-3 px-2 text-[#FFD4B2]">
              <span className="font-mono text-xs tracking-widest uppercase opacity-90">
                ✦ Memory {((opened % items.length) + 1)} / {items.length}
              </span>
              <button
                type="button"
                ref={closeButtonRef}
                onClick={() => setOpened(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#3B1B2A]/90 hover:bg-[#FFD4B2] hover:text-[#27141E] border border-[#FBB3BF]/30 text-xs font-mono tracking-wider uppercase transition-all shadow-lg"
                aria-label="Close enlarged memory"
              >
                <span>✕</span>
                <span>Close</span>
              </button>
            </div>

            {/* Crisp High-Res Image Frame */}
            <div className="relative group max-h-[76vh] flex items-center justify-center overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-[#FFD4B2]/40 bg-[#1A0A13] shadow-2xl shadow-black/80">
              <img
                src={currentItem.src}
                alt={currentItem.alt || 'Mariam shared memory'}
                className="w-auto h-auto max-h-[74vh] max-w-[88vw] sm:max-w-2xl object-contain block rounded-2xl select-none"
              />

              {/* Navigation Arrows */}
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous memory"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#27141E]/80 hover:bg-[#FFD4B2] hover:text-[#27141E] text-white border border-[#FBB3BF]/40 flex items-center justify-center text-lg transition-all shadow-xl opacity-80 hover:opacity-100 hover:scale-105"
              >
                ←
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next memory"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#27141E]/80 hover:bg-[#FFD4B2] hover:text-[#27141E] text-white border border-[#FBB3BF]/40 flex items-center justify-center text-lg transition-all shadow-xl opacity-80 hover:opacity-100 hover:scale-105"
              >
                →
              </button>
            </div>

            {/* Bottom Caption Pill */}
            {currentItem.alt && (
              <div className="mt-3 px-5 py-2 rounded-full bg-[#361928]/80 border border-[#FBB3BF]/30 text-[#FBE1D5] font-serif text-lg tracking-wide shadow-md text-center max-w-xl">
                {currentItem.alt}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}