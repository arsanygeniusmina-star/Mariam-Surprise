import { useState, useEffect } from 'react';
import { playChime } from '@/lib/sound';

export interface TraitItem {
  id: string;
  name: string;
  phonetic: string;
  tag: string;
  headline: string;
  highlight: string;
  reflection: string;
  vibe: string;
  metricLabel: string;
  metricValue: string;
  fillPercent: number;
  colorHex: string;
  glowColor: string;
}

export const traitsList: TraitItem[] = [
  {
    id: 'beautiful',
    name: 'Beautiful',
    phonetic: '/ˈbjuː.tɪ.fəl/',
    tag: 'Grace & Elegance',
    headline: 'Beauty that moves',
    highlight: 'beyond the surface.',
    reflection:
      'Not merely the breathtaking kind that commands a room the second you enter, but the quiet, poise-filled grace in how you carry yourself. The warmth in your eyes, your gentle smile, and the way every space feels softer and brighter simply because you are there.',
    vibe: 'An effortless elegance that never needs to shout.',
    metricLabel: 'Radiance & Presence',
    metricValue: '99.9%',
    fillPercent: 100,
    colorHex: '#FBB3BF',
    glowColor: 'rgba(251, 179, 191, 0.45)',
  },
  {
    id: 'kind',
    name: 'Kind',
    phonetic: '/kaɪnd/',
    tag: 'The Rare Intuition',
    headline: 'Kindness as an',
    highlight: 'instinct, never an effort.',
    reflection:
      'Your kindness is an unspoken radar. You notice when someone is quiet, you remember what others overlook, and you offer reassurance without seeking recognition. In a noisy world, having your gentleness nearby is an irreplaceable treasure.',
    vibe: 'Making the world a noticeably softer place.',
    metricLabel: 'Instinctive Empathy',
    metricValue: '100%',
    fillPercent: 100,
    colorHex: '#FFD4B2',
    glowColor: 'rgba(255, 212, 178, 0.45)',
  },
  {
    id: 'lovely',
    name: 'Lovely',
    phonetic: '/ˈlʌv.li/',
    tag: 'Unforgettable Spark',
    headline: 'Delightful in every',
    highlight: 'unscripted moment.',
    reflection:
      'In the sheer delight of your laugh, your expressive humor, and how easy you make it to talk about everything or nothing at all. You have this magical ability to turn the simplest mundane moments into golden memories.',
    vibe: 'A golden hour that never sets.',
    metricLabel: 'Contagious Joy',
    metricValue: 'Infinite',
    fillPercent: 100,
    colorHex: '#F2EEB6',
    glowColor: 'rgba(242, 238, 182, 0.5)',
  },
  {
    id: 'intelligent',
    name: 'Intelligent',
    phonetic: '/ɪnˈtel.ɪ.dʒənt/',
    tag: 'Sharp & Perceptive',
    headline: 'Brilliance guided by',
    highlight: 'clarity and depth.',
    reflection:
      'Quick-witted, intuitive, and deeply thoughtful. You have a razor-sharp mind that cuts right through ambiguity, asking the questions that get to the heart of what matters, paired with wisdom well beyond ordinary measure.',
    vibe: 'A mind that dances with clarity and purpose.',
    metricLabel: 'Wit & Perception',
    metricValue: '99.8%',
    fillPercent: 100,
    colorHex: '#FBE1D5',
    glowColor: 'rgba(251, 225, 213, 0.55)',
  },
  {
    id: 'caring',
    name: 'Caring',
    phonetic: '/ˈkeə.rɪŋ/',
    tag: 'Fierce & Devoted',
    headline: 'A heart that holds',
    highlight: 'endless room for others.',
    reflection:
      'You love with devotion and stand by people with fierce protection. When Mariam cares about you, you have an unwavering ally in your corner. Your thoughtfulness is generous, dependable, and deeply grounding.',
    vibe: 'A safe haven in human form.',
    metricLabel: 'Heart & Loyalty',
    metricValue: '100%',
    fillPercent: 100,
    colorHex: '#EDA5A7',
    glowColor: 'rgba(237, 165, 167, 0.5)',
  },
  {
    id: 'radiant',
    name: 'Radiant',
    phonetic: '/ˈreɪ.di.ənt/',
    tag: 'Pure Magic',
    headline: 'An aura that lights',
    highlight: 'the entire universe.',
    reflection:
      'Some people simply bring sunshine with them wherever they step. Your vitality, your spirit, and your electric enthusiasm make life feel celebrated every single second. Today, all of that radiance is reflected back onto you.',
    vibe: 'Sunlight wrapped in a heartbeat.',
    metricLabel: 'Magnetic Charm',
    metricValue: 'Celestial',
    fillPercent: 100,
    colorHex: '#FFD4B2',
    glowColor: 'rgba(255, 212, 178, 0.5)',
  },
];

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
  color: string;
}

export function YouTraitsSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [loveCount, setLoveCount] = useState(128);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const currentTrait = traitsList[activeIdx];

  const handleSelectTrait = (index: number) => {
    setActiveIdx(index);
    playChime(index);
  };

  const handleSendLove = (e: React.MouseEvent<HTMLButtonElement>) => {
    setLoveCount((prev) => prev + 1);
    playChime((activeIdx + 2) % 6);

    const rect = e.currentTarget.getBoundingClientRect();
    const newHeart: FloatingHeart = {
      id: Date.now() + Math.random(),
      x: e.clientX - rect.left + (Math.random() * 40 - 20),
      y: e.clientY - rect.top,
      color: currentTrait.colorHex,
    };
    setHearts((prev) => [...prev.slice(-12), newHeart]);
  };

  useEffect(() => {
    if (hearts.length === 0) return;
    const timer = setTimeout(() => {
      setHearts((prev) => prev.slice(1));
    }, 1800);
    return () => clearTimeout(timer);
  }, [hearts]);

  return (
    <section className="traits-scene" id="you" aria-labelledby="you-heading">
      {/* Infinite Awwwards Marquee Ribbon */}
      <div className="traits-marquee-wrap" aria-hidden="true">
        <div className="traits-marquee">
          {Array.from({ length: 4 }).flatMap((_, loopIdx) =>
            traitsList.map((t) => (
              <span key={`${loopIdx}-${t.id}`}>
                You: <em>{t.name}</em>
                <span className="traits-marquee-dot" />
              </span>
            ))
          )}
        </div>
      </div>

      {/* Section Header */}
      <div className="traits-header reveal">
        <div className="eyebrow section-number">03 / An Honest Portrait</div>
        <div className="traits-title-row">
          <h2 className="display" id="you-heading">You :</h2>
          <div className="traits-word-cycle" style={{ color: currentTrait.colorHex }}>
            {currentTrait.name}.
          </div>
        </div>
        <p className="traits-subtext">
          If someone asked to describe you in a few words, here is what they would discover.
          Select each trait to read what makes you so completely irreplaceable.
        </p>
      </div>

      {/* Interactive Trait Pills Navigation */}
      <div className="trait-pills-bar reveal" role="tablist" aria-label="Mariam traits">
        {traitsList.map((trait, index) => {
          const isActive = activeIdx === index;
          return (
            <button
              key={trait.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`trait-panel-${trait.id}`}
              id={`trait-tab-${trait.id}`}
              type="button"
              className={`trait-pill ${isActive ? 'is-active' : ''}`}
              style={{
                borderColor: isActive ? trait.colorHex : undefined,
              }}
              data-testid={`trait-button-${trait.id}`}
              onClick={() => handleSelectTrait(index)}
            >
              <span className="trait-pill-star" style={{ background: trait.colorHex }} />
              <span>{trait.name}</span>
            </button>
          );
        })}
      </div>

      {/* Trait Showcase Card */}
      <div
        className="trait-card reveal"
        id={`trait-panel-${currentTrait.id}`}
        role="tabpanel"
        aria-labelledby={`trait-tab-${currentTrait.id}`}
      >
        <div
          className="trait-card-glow"
          style={{ background: currentTrait.glowColor }}
          aria-hidden="true"
        />

        {/* Main Editorial Text */}
        <div className="trait-card-main">
          <div className="trait-meta-row">
            <span className="trait-index-badge">{currentTrait.tag}</span>
            <span className="trait-phonetic">{currentTrait.phonetic}</span>
          </div>

          <h3 className="trait-headline">
            {currentTrait.headline}
            <span style={{ color: currentTrait.colorHex }}>{currentTrait.highlight}</span>
          </h3>

          <p className="trait-reflection">{currentTrait.reflection}</p>

          <div className="trait-vibe-box">
            <span style={{ color: currentTrait.colorHex }}>✦</span>
            <span>{currentTrait.vibe}</span>
          </div>
        </div>

        {/* Side Metrics & Interactive Appreciation */}
        <div className="trait-card-aside">
          <div className="trait-metric-block">
            <div className="trait-metric-label">{currentTrait.metricLabel}</div>
            <div className="trait-metric-val">{currentTrait.metricValue}</div>
            <div className="trait-metric-bar">
              <div
                className="trait-metric-fill"
                style={{ width: `${currentTrait.fillPercent}%` }}
              />
            </div>
          </div>

          <div className="trait-metric-block">
            <div className="trait-metric-label">Observation Record</div>
            <div className="text-sm font-medium opacity-90 leading-relaxed text-[#4A2433]">
              Consistently verified across every memory, laughter, and moment shared together.
            </div>
          </div>

          <button
            type="button"
            className="trait-heart-btn relative overflow-hidden"
            data-testid="button-send-love"
            onClick={handleSendLove}
            style={{
              background: `linear-gradient(135deg, ${currentTrait.colorHex}, #FBE1D5)`,
            }}
          >
            <div className="trait-heart-left">
              <span className="trait-heart-icon" aria-hidden="true">♥</span>
              <div>
                <div className="trait-heart-title">Celebrate This</div>
                <div className="trait-heart-desc">Tap to send birthday love</div>
              </div>
            </div>
            <div className="trait-heart-count">{loveCount}</div>

            {/* Floating Particle Hearts */}
            {hearts.map((h) => (
              <span
                key={h.id}
                className="absolute pointer-events-none text-xl select-none animate-ping"
                style={{
                  left: h.x,
                  top: h.y,
                  color: h.color,
                }}
              >
                ♥
              </span>
            ))}
          </button>
        </div>
      </div>
    </section>
  );
}
