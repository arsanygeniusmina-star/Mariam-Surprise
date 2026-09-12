import { useState, useEffect, useRef } from 'react';
import {
  playPuff,
  playChime,
  playCelebrationChord,
  playLighterFlick,
  playFlameIgnite,
  startBirthdayMusic,
  stopBirthdayMusic,
  getIsMusicPlaying,
} from '@/lib/sound';

interface BirthdayCakeSectionProps {
  wished: boolean;
  onWish: () => void;
  onRelight: () => void;
  triggerGlobalConfetti?: () => void;
}

export function BirthdayCakeSection({
  wished,
  onWish,
  onRelight,
  triggerGlobalConfetti,
}: BirthdayCakeSectionProps) {
  // Independent candle flame states: [candle0, candle1, candle2]
  // true = lit flame, false = blown out
  const [candleLit, setCandleLit] = useState<[boolean, boolean, boolean]>([true, true, true]);
  const [smokingCandles, setSmokingCandles] = useState<Set<number>>(new Set());

  // Lighter animation state machine
  const [isRelighting, setIsRelighting] = useState(false);
  const [lighterState, setLighterState] = useState<{
    visible: boolean;
    xPercent: number; // percentage across cake container
    yOffset: number; // px from top
    capOpen: boolean;
    flameLit: boolean;
    rotation: number;
  }>({
    visible: false,
    xPercent: 110,
    yOffset: 30,
    capOpen: false,
    flameLit: false,
    rotation: 0,
  });

  // Music state
  const [isMusicOn, setIsMusicOn] = useState(getIsMusicPlaying());
  const cakeRef = useRef<HTMLDivElement>(null);

  // Sync music state
  useEffect(() => {
    setIsMusicOn(getIsMusicPlaying());
  }, []);

  const toggleMusic = () => {
    if (isMusicOn) {
      stopBirthdayMusic();
      setIsMusicOn(false);
    } else {
      startBirthdayMusic();
      setIsMusicOn(true);
    }
  };

  const allCandlesOut = !candleLit[0] && !candleLit[1] && !candleLit[2];

  // Click individual candle to blow it out
  const handleCandleClick = (candleIndex: number) => {
    if (isRelighting) return;
    if (!candleLit[candleIndex]) return;

    playPuff();
    playChime(candleIndex * 2);

    // Smoke effect
    setSmokingCandles((prev) => new Set(prev).add(candleIndex));
    setTimeout(() => {
      setSmokingCandles((prev) => {
        const next = new Set(prev);
        next.delete(candleIndex);
        return next;
      });
    }, 2000);

    setCandleLit((prev) => {
      const updated: [boolean, boolean, boolean] = [...prev];
      updated[candleIndex] = false;

      // If all three are now out, celebrate wish!
      if (!updated[0] && !updated[1] && !updated[2]) {
        setTimeout(() => {
          playCelebrationChord();
          triggerGlobalConfetti?.();
          onWish();
        }, 300);
      }
      return updated;
    });
  };

  // Blow all candles at once
  const handleBlowAll = () => {
    if (isRelighting || allCandlesOut) return;
    playPuff();
    playCelebrationChord();
    setSmokingCandles(new Set([0, 1, 2]));
    setTimeout(() => setSmokingCandles(new Set()), 2000);
    setCandleLit([false, false, false]);
    triggerGlobalConfetti?.();
    onWish();
  };

  // Lighter animation: Lights each candle strictly ONE BY ONE
  const handleLightAgainWithLighter = () => {
    if (isRelighting) return;
    setIsRelighting(true);

    // Candle horizontal positions in percentage of cake container width (320px)
    // Left candle: ~37%, Center candle: ~50%, Right candle: ~63%
    const candlePositions = [37, 50, 63];

    // Step 1: Lighter appears in view from right margin
    setLighterState({
      visible: true,
      xPercent: 96,
      yOffset: 45,
      capOpen: false,
      flameLit: false,
      rotation: 8,
    });

    // Step 2: Open cap with flick sound
    setTimeout(() => {
      playLighterFlick();
      setLighterState((prev) => ({
        ...prev,
        capOpen: true,
        xPercent: 88,
        yOffset: 40,
      }));
    }, 350);

    // Step 3: Lighter flame ignites
    setTimeout(() => {
      playFlameIgnite();
      setLighterState((prev) => ({
        ...prev,
        flameLit: true,
        rotation: 0,
      }));
    }, 600);

    // Step 4: Glide over to Candle 0 (left)
    setTimeout(() => {
      setLighterState((prev) => ({
        ...prev,
        xPercent: candlePositions[0] + 5,
        yOffset: 34,
        rotation: -6,
      }));
    }, 850);

    // Step 5: Touch Candle 0 -> Light ONLY Candle 0
    setTimeout(() => {
      playFlameIgnite();
      playChime(0);
      setCandleLit((prev) => [true, prev[1], prev[2]]); // ONLY candle 0 lit
    }, 1350);

    // Step 6: Glide over to Candle 1 (center)
    setTimeout(() => {
      setLighterState((prev) => ({
        ...prev,
        xPercent: candlePositions[1] + 5,
        yOffset: 34,
        rotation: -2,
      }));
    }, 1750);

    // Step 7: Touch Candle 1 -> Light ONLY Candle 1 (now 0 & 1 are lit, 2 is still out)
    setTimeout(() => {
      playFlameIgnite();
      playChime(2);
      setCandleLit((prev) => [true, true, prev[2]]); // Candles 0 & 1 lit
    }, 2250);

    // Step 8: Glide over to Candle 2 (right)
    setTimeout(() => {
      setLighterState((prev) => ({
        ...prev,
        xPercent: candlePositions[2] + 5,
        yOffset: 34,
        rotation: 2,
      }));
    }, 2650);

    // Step 9: Touch Candle 2 -> Light Candle 2 (ALL 3 ARE NOW LIT!)
    setTimeout(() => {
      playFlameIgnite();
      playCelebrationChord();
      setCandleLit([true, true, true]); // All 3 lit
      triggerGlobalConfetti?.();
      onRelight();
    }, 3150);

    // Step 10: Extinguish lighter flame, close cap, glide off screen
    setTimeout(() => {
      setLighterState((prev) => ({
        ...prev,
        flameLit: false,
        capOpen: false,
        xPercent: 105,
        yOffset: 55,
        rotation: 12,
      }));
    }, 3650);

    setTimeout(() => {
      setLighterState((prev) => ({
        ...prev,
        visible: false,
        xPercent: 120,
      }));
      setIsRelighting(false);
    }, 4200);
  };

  return (
    <section
      className={`wish-scene relative py-16 sm:py-24 px-4 transition-colors duration-700 ${
        allCandlesOut ? 'bg-[#351523]' : 'bg-[#24101B]'
      }`}
      id="wish"
      aria-labelledby="wish-heading"
    >
      {/* Background Ambient Glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: allCandlesOut
            ? 'radial-gradient(circle at 50% 50%, rgba(255,212,178,0.15) 0%, rgba(251,179,191,0.08) 45%, transparent 70%)'
            : 'radial-gradient(circle at 50% 45%, rgba(255,180,120,0.25) 0%, rgba(251,179,191,0.12) 40%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="wish-copy relative z-10 max-w-xl mx-auto text-center">
        {/* Section Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FBB3BF]/15 border border-[#FBB3BF]/30 text-[#FFD4B2] font-mono text-[11px] tracking-widest uppercase mb-3 shadow-xs">
          <span>✦</span>
          <span>05 / A pause for the future</span>
        </div>

        <h2 className="font-serif text-4xl sm:text-6xl md:text-7xl text-[#FFF5EB] leading-[0.9] tracking-tight mb-3">
          Make <br />
          <span className="italic text-[#FFD4B2]">a wish.</span>
        </h2>

        <p className="text-[#FBE1D5]/85 text-sm sm:text-base max-w-sm mx-auto mb-5 font-light leading-relaxed">
          Close your eyes, think of something wonderful, then blow out the candles.
        </p>

        {/* Music Box Controller Button */}
        <div className="flex justify-center mb-6">
          <button
            type="button"
            onClick={toggleMusic}
            className={`group inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-xs font-mono tracking-wider uppercase ${
              isMusicOn
                ? 'bg-[#FFD4B2] text-[#24101B] border-[#FFD4B2] shadow-md font-semibold'
                : 'bg-[#351523]/90 text-[#FFD4B2] border-[#FBB3BF]/30 hover:bg-[#FBB3BF]/20'
            }`}
            aria-label={isMusicOn ? 'Pause birthday music' : 'Play birthday music'}
          >
            <span>🎵</span>
            <span>{isMusicOn ? 'Melody Playing' : 'Play Birthday Music'}</span>
          </button>
        </div>

        {/* ARTISAN CAKE STAGE - Candles are planted directly ON TOP of the cake */}
        <div
          ref={cakeRef}
          className="relative w-72 sm:w-80 h-72 mx-auto my-4 select-none"
          aria-label={
            allCandlesOut
              ? 'The candles have been blown out'
              : 'A birthday cake with glowing candles'
          }
        >
          {/* Gold Pedestal Stand */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-68 sm:w-74 h-5 rounded-full bg-gradient-to-r from-[#C27F52] via-[#FFD4B2] to-[#C27F52] border border-[#FFF5EB]/30 shadow-xl"
            style={{ bottom: '0px' }}
          >
            <div className="absolute inset-x-4 top-0.5 h-1 rounded-full bg-[#FFF5EB]/40 blur-[0.5px]" />
          </div>

          {/* CAKE TIER 1 (Bottom Velvet Layer) */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-60 sm:w-66 rounded-2xl bg-gradient-to-r from-[#942C4B] via-[#BD446A] to-[#942C4B] border-t border-[#FFD4B2]/40 shadow-lg overflow-hidden"
            style={{ bottom: '16px', height: '68px' }}
          >
            {/* Scalloped Buttercream Frosting */}
            <div className="absolute top-0 inset-x-0 h-3 flex justify-between px-1">
              {Array.from({ length: 13 }).map((_, i) => (
                <div
                  key={`t1-scallop-${i}`}
                  className="w-4 h-3 rounded-b-full bg-[#FFF5EB] shadow-xs -mt-0.5"
                />
              ))}
            </div>
            {/* Gold Sugar Pearls */}
            <div className="absolute bottom-2 inset-x-3 flex justify-around">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={`t1-pearl-${i}`}
                  className="w-1.5 h-1.5 rounded-full bg-[#FFD4B2] border border-[#FFF5EB]/60"
                />
              ))}
            </div>
          </div>

          {/* CAKE TIER 2 (Middle Peach Layer) */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-48 sm:w-52 rounded-2xl bg-gradient-to-r from-[#D67462] via-[#FBB3BF] to-[#D67462] border-t border-[#FFF5EB]/50 shadow-md overflow-hidden"
            style={{ bottom: '78px', height: '54px' }}
          >
            {/* Buttercream drops */}
            <div className="absolute top-0 inset-x-0 h-2.5 flex justify-between px-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={`t2-drop-${i}`}
                  className="w-3.5 h-2.5 rounded-b-full bg-[#FFF5EB] shadow-xs -mt-0.5"
                />
              ))}
            </div>
            <div className="absolute bottom-1.5 inset-x-5 h-px border-b border-dashed border-[#FFF5EB]/50" />
          </div>

          {/* CAKE TIER 3 (Top Pastel Butter Layer) */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-36 sm:w-40 rounded-xl bg-gradient-to-r from-[#EFEAA8] via-[#FFF9DC] to-[#EFEAA8] border-t border-white shadow-md"
            style={{ bottom: '126px', height: '46px' }}
          >
            {/* Strawberry Rosettes on the top surface */}
            <div className="absolute top-0 inset-x-0 h-2 flex justify-around px-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={`t3-rose-${i}`}
                  className="w-2.5 h-2 rounded-full bg-[#EDA5A7] shadow-xs -mt-0.5"
                />
              ))}
            </div>
          </div>

          {/* CANDLES - Planted directly into top of Cake Tier 3 (seated at bottom: 168px) */}
          <div
            className="absolute inset-x-0 flex justify-center items-end gap-9 z-20 pointer-events-auto"
            style={{ bottom: '168px' }}
          >
            {[0, 1, 2].map((candleIndex) => {
              const isLit = candleLit[candleIndex];
              const isSmoking = smokingCandles.has(candleIndex);

              return (
                <div
                  key={`candle-${candleIndex}`}
                  className="relative flex flex-col items-center cursor-pointer group"
                  onClick={() => handleCandleClick(candleIndex)}
                  title={isLit ? 'Tap to blow out this candle' : 'Candle is extinguished'}
                >
                  {/* ANIMATED TEARDROP FLAME */}
                  {isLit && (
                    <div className="relative w-4 h-6 -mb-0.5 flex items-center justify-center">
                      {/* Ambient Glow */}
                      <div className="absolute inset-0 rounded-full bg-[#FFA834]/30 blur-sm animate-pulse scale-125" />

                      {/* Flame body */}
                      <div
                        className="w-3 h-5 rounded-full bg-gradient-to-t from-[#FF7A2F] via-[#FFD4B2] to-[#FFFBE6] shadow-[0_0_12px_#FFA834] animate-[flicker_1.2s_ease-in-out_infinite_alternate]"
                        style={{
                          borderRadius: '50% 50% 35% 35% / 60% 60% 40% 40%',
                          animationDelay: `${candleIndex * 0.25}s`,
                        }}
                      >
                        {/* Blue Core */}
                        <div className="w-1 h-1.5 mx-auto mt-2.5 rounded-full bg-[#FFF] shadow-[0_0_4px_#7ED4FD]" />
                      </div>
                    </div>
                  )}

                  {/* SMOKE WISP WHEN EXTINGUISHED */}
                  {isSmoking && (
                    <div className="absolute -top-8 flex flex-col items-center pointer-events-none">
                      <div className="w-1.5 h-5 rounded-full bg-gradient-to-t from-gray-300/60 to-transparent blur-[1px] animate-[smoke-rise_1.5s_ease-out_forwards]" />
                    </div>
                  )}

                  {/* Candle Wick */}
                  <div className="w-0.5 h-1.5 bg-[#3B1F27]" />

                  {/* Candle Body */}
                  <div
                    className="w-3 h-10 rounded-t-xs shadow-xs transition-transform group-hover:scale-105"
                    style={{
                      background:
                        candleIndex === 1
                          ? 'repeating-linear-gradient(135deg, #FFF 0 4px, #FBB3BF 4px 8px, #FFD4B2 8px 12px)'
                          : 'repeating-linear-gradient(135deg, #F2EEB6 0 4px, #EDA5A7 4px 8px, #FFF 8px 12px)',
                    }}
                  />

                  {/* Buttercream frosting anchor base (anchors candle into cake surface) */}
                  <div className="w-4 h-1 rounded-full bg-[#FFF9DC] -mt-0.5 shadow-xs" />
                </div>
              );
            })}
          </div>

          {/* VINTAGE LIGHTER COMPONENT */}
          {lighterState.visible && (
            <div
              className="absolute z-40 transition-all duration-300 ease-out pointer-events-none select-none"
              style={{
                left: `${lighterState.xPercent}%`,
                top: `${lighterState.yOffset}px`,
                transform: `translateX(-50%) rotate(${lighterState.rotation}deg)`,
              }}
            >
              <div className="relative w-10 h-18 filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.5)]">
                {/* Lighter Flame */}
                {lighterState.flameLit && (
                  <div className="absolute -top-6 left-2.5 w-3.5 h-7 flex flex-col items-center animate-pulse">
                    <div className="w-3 h-6 rounded-full bg-gradient-to-t from-[#FFA834] via-[#FFE2B0] to-white shadow-[0_0_18px_#FFA834]" />
                    <div className="w-1 h-1.5 rounded-full bg-blue-300 -mt-1.5" />
                  </div>
                )}

                {/* Chimney */}
                <div className="absolute top-0 left-1.5 w-4 h-3.5 bg-gradient-to-r from-[#D6A26E] via-[#FBE1D5] to-[#B37945] rounded-t border border-white/40 flex items-center justify-around px-0.5">
                  <span className="w-1 h-1 rounded-full bg-[#3B1F13]" />
                  <span className="w-1 h-1 rounded-full bg-[#3B1F13]" />
                </div>

                {/* Flint Wheel */}
                <div className="absolute top-1 right-1.5 w-3 h-3 rounded-full bg-[#523A28] border border-[#DE9B75]" />

                {/* Flip Cap */}
                <div
                  className="absolute top-0 left-0 w-7 h-3.5 bg-gradient-to-r from-[#C27F52] via-[#E8B688] to-[#995C33] rounded-t origin-left transition-transform duration-250 border border-white/30"
                  style={{
                    transform: lighterState.capOpen ? 'rotate(-65deg)' : 'rotate(0deg)',
                  }}
                />

                {/* Metallic Body */}
                <div className="absolute top-3.5 left-0 w-7 h-13 rounded-b bg-gradient-to-b from-[#E8B688] via-[#C27F52] to-[#8C4F2B] border border-white/30 shadow-inner flex flex-col items-center justify-center">
                  <span className="font-serif italic font-bold text-[#FFF5EB] text-xs leading-none">
                    M
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* INTERACTION BUTTONS - Clean, mobile-friendly spacing */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-5">
          {!allCandlesOut ? (
            <button
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FFD4B2] to-[#FBB3BF] text-[#24101B] font-mono text-xs font-semibold tracking-widest uppercase hover:scale-102 active:scale-98 transition-transform shadow-md"
              type="button"
              data-testid="button-make-wish"
              onClick={handleBlowAll}
            >
              ✦ Tap to blow out candles
            </button>
          ) : (
            <button
              className={`px-6 py-3 rounded-full bg-gradient-to-r from-[#F2EEB6] via-[#FFD4B2] to-[#FBB3BF] text-[#24101B] font-mono text-xs font-bold tracking-widest uppercase hover:scale-102 active:scale-98 transition-transform shadow-lg flex items-center gap-2 ${
                isRelighting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              type="button"
              data-testid="button-make-wish"
              disabled={isRelighting}
              onClick={handleLightAgainWithLighter}
            >
              <span>🔥</span>
              <span>
                {isRelighting ? 'Lighting each candle…' : 'Light again ✦ Bring the lighter'}
              </span>
            </button>
          )}
        </div>

        {/* Celebratory Note */}
        <p
          className={`mt-4 text-lg sm:text-xl font-serif text-[#FFD4B2] transition-all duration-500 ${
            allCandlesOut ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
        >
          May this be your gentlest, brightest year yet.
        </p>
      </div>
    </section>
  );
}
