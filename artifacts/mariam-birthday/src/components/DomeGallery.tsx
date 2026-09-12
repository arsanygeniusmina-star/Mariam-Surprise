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
    return rows.map((y) => ({ x, y, sizeX: 2, sizeY: 2, column }));
  });

  const normalized = images.map((image) =>
    typeof image === 'string'
      ? { src: image, alt: '' }
      : { src: image.src, alt: image.alt ?? '' },
  );

  if (normalized.length === 0) {
    return coordinates.map(({ column: _column, ...coordinate }) => ({
      ...coordinate,
      src: '',
      alt: '',
    }));
  }

  return coordinates.map(({ column: _column, ...coordinate }, index) => {
    const current = normalized[index % normalized.length];
    const previous = normalized[(index - 1 + normalized.length) % normalized.length];
    const alternate =
      current.src === previous.src
        ? normalized[(index + 1) % normalized.length]
        : current;

    return { ...coordinate, src: alternate.src, alt: alternate.alt };
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
        <div
          className={`viewer ${opened !== null ? 'is-open' : ''}`}
          ref={viewerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged shared memory"
          aria-hidden={opened === null}
        >
          <button
            type="button"
            className="scrim"
            aria-label="Close enlarged memory"
            onClick={() => setOpened(null)}
          />
          <div className="frame" ref={frameRef} />
          {opened !== null && (
            <figure
              className="enlarge"
              style={{
                width: openedImageWidth,
                height: openedImageHeight,
                transitionDuration: `${enlargeTransitionMs}ms`,
              }}
            >
               <img
                src={items[opened % items.length]?.src}
                alt={items[opened % items.length]?.alt || 'A shared memory'}
              />
              <button
                type="button"
                className="enlarge-close"
                 ref={closeButtonRef}
                aria-label="Close enlarged memory"
                onClick={() => setOpened(null)}
              >
                Close
              </button>
            </figure>
          )}
        </div>
      </main>
    </div>
  );
}