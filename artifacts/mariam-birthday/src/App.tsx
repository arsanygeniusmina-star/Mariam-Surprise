import { type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import DomeGallery from '@/components/DomeGallery';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

const accordionImages = [
  ['WhatsApp Image 2026-08-20 at 12.11.23 AM.jpeg', 'The little things', 'A quiet kind of magic'],
  ['WhatsApp Image 2026-09-12 at 6.42.46 PM.jpeg', 'In her element', 'Always unmistakably Mariam'],
  ['WhatsApp Image 2026-09-12 at 6.47.11 PM (2).jpeg', 'Soft light', 'A moment worth keeping'],
  ['WhatsApp Image 2026-09-12 at 6.48.32 PM (2).jpeg', 'The good days', 'They look good on you'],
  ['WhatsApp Image 2026-09-12 at 6.49.25 PM (1).jpeg', 'That smile', 'The room changes with it'],
  ['WhatsApp Image 2026-09-12 at 6.49.25 PM.jpeg', 'Just Mariam', 'No explanation needed'],
];

const sharedImages = [
  ['WhatsApp Image 2026-08-20 at 12.09.33 AM.jpeg', 'A shared little world'],
  ['WhatsApp Image 2026-08-20 at 12.10.56 AM.jpeg', 'Somewhere in between'],
  ['WhatsApp Image 2026-08-20 at 12.11.23 AM.jpeg', 'The familiar kind of happy'],
  ['WhatsApp Image 2026-08-20 at 12.12.29 AM.jpeg', 'A day that stayed'],
  ['WhatsApp Image 2026-08-20 at 12.17.18 AM.jpeg', 'The long way home'],
  ['WhatsApp Image 2026-09-12 at 6.41.38 PM.jpeg', 'Unplanned, perfect'],
  ['WhatsApp Image 2026-09-12 at 6.42.11 PM.jpeg', 'A good reason to laugh'],
  ['WhatsApp Image 2026-09-12 at 6.42.46 PM.jpeg', 'This exact second'],
  ['WhatsApp Image 2026-09-12 at 6.43.34 PM.jpeg', 'The view from here'],
  ['WhatsApp Image 2026-09-12 at 6.47.10 PM (1).jpeg', 'All the small adventures'],
  ['WhatsApp Image 2026-09-12 at 6.47.10 PM (2).jpeg', 'Still one of my favourites'],
  ['WhatsApp Image 2026-09-12 at 6.47.10 PM.jpeg', 'A little more time'],
  ['WhatsApp Image 2026-09-12 at 6.47.11 PM (1).jpeg', 'Us, in a frame'],
  ['WhatsApp Image 2026-09-12 at 6.47.11 PM (2).jpeg', 'The easy kind of joy'],
  ['WhatsApp Image 2026-09-12 at 6.47.11 PM.jpeg', 'A memory with good light'],
  ['WhatsApp Image 2026-09-12 at 6.48.31 PM (1).jpeg', 'The ones we keep'],
  ['WhatsApp Image 2026-09-12 at 6.48.31 PM.jpeg', 'A little bit golden'],
  ['WhatsApp Image 2026-09-12 at 6.48.32 PM (1).jpeg', 'Nothing ordinary here'],
  ['WhatsApp Image 2026-09-12 at 6.48.32 PM.jpeg', 'A room full of light'],
  ['WhatsApp Image 2026-09-12 at 6.48.32 PM (3).jpeg', 'The story continues'],
  ['WhatsApp Image 2026-09-12 at 6.49.25 PM (2).jpeg', 'A soft place to land'],
  ['WhatsApp Image 2026-09-12 at 6.56.27 PM (1).jpeg', 'A very good day'],
  ['WhatsApp Image 2026-09-12 at 6.56.27 PM (2).jpeg', 'One for the archive'],
  ['WhatsApp Image 2026-09-12 at 6.56.27 PM.jpeg', 'A little sparkle'],
  ['WhatsApp Image 2026-09-12 at 6.56.28 PM (1).jpeg', 'The best kind of ordinary'],
  ['WhatsApp Image 2026-09-12 at 6.56.28 PM (2).jpeg', 'The light between us'],
  ['WhatsApp Image 2026-09-12 at 6.56.28 PM.jpeg', 'Another one to keep'],
  ['WhatsApp Image 2026-09-12 at 6.56.52 PM.jpeg', 'A beautiful ending'],
  ['WhatsApp Image 2026-09-12 at 6.56.53 PM.jpeg', 'Still celebrating'],
];

const accordionPath = (name: string) => `/assets/accordion/${name}`;
const domePath = (name: string) => `/assets/dome/${name}`;

function useReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -8% 0px' },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

function useScrollMotion() {
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const scrollY = window.scrollY;
      document.documentElement.style.setProperty('--page-scroll', `${scrollY}px`);
      document.documentElement.style.setProperty('--hero-shift', `${Math.min(scrollY * 0.08, 72)}px`);
      document.documentElement.style.setProperty('--hero-shift-small', `${Math.min(scrollY * 0.035, 28)}px`);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
}

function Intro({ onEnter }: { onEnter: () => void }) {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setGone(true);
      onEnter();
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [onEnter]);
  return (
    <div className={`intro-screen ${gone ? 'is-gone' : ''}`} aria-hidden={gone}>
      <div className="intro-orb" />
      <div className="intro-copy">
        <div className="eyebrow intro-note">A small world, for one person</div>
        <div className="serif">Mariam</div>
        <button className="intro-action" data-testid="button-enter-experience" onClick={() => { setGone(true); onEnter(); }}>
          Step inside
        </button>
      </div>
    </div>
  );
}

function AccordionInstallation() {
  const [active, setActive] = useState(0);
  return (
    <div className="accordion-gallery" role="list" aria-label="Mariam's photo installation">
      {accordionImages.map(([image, title], index) => (
        <button
          className={`accordion-panel ${active === index ? 'active' : ''}`}
          key={image}
          type="button"
          role="listitem"
          aria-label={`Open memory: ${title}`}
          aria-pressed={active === index}
          data-testid={`button-mariam-memory-${index}`}
          onClick={() => setActive(index)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') setActive((index + 1) % accordionImages.length);
            if (event.key === 'ArrowLeft') setActive((index - 1 + accordionImages.length) % accordionImages.length);
          }}
        >
          <img src={accordionPath(image)} alt={`Mariam — ${title}`} loading={index === 0 ? 'eager' : 'lazy'} />
        </button>
      ))}
    </div>
  );
}

function WishScene({ wished, onWish }: { wished: boolean; onWish: () => void }) {
  return (
    <section className={`wish-scene ${wished ? 'wished' : ''}`} id="wish" aria-labelledby="wish-heading">
      <div className="wish-copy reveal">
        <div className="eyebrow">A pause for the future</div>
        <h2 className="display" id="wish-heading">Make<br />a wish.</h2>
        <p>Close your eyes for a second, think of something wonderful,<br />then tap the candles.</p>
        <div className="cake" aria-label={wished ? 'The candles have been blown out' : 'A birthday cake with three candles'}>
          <div className="candles">
            {[0, 1, 2].map((candle) => (
              <button className="candle" key={candle} type="button" aria-label={`Blow out candle ${candle + 1}`} data-testid={`button-candle-${candle + 1}`} onClick={onWish}>
                <span className="flame" />
              </button>
            ))}
          </div>
          <div className="cake-body" />
          <div className="cake-plate" />
        </div>
        <button className="wish-button" type="button" data-testid="button-make-wish" onClick={onWish}>
          {wished ? 'Wish sent into the world' : 'Tap the candles'}
        </button>
        <p className="wish-after">May this be your gentlest, brightest year yet.</p>
      </div>
    </section>
  );
}

function ConfettiField() {
  const pieces = Array.from({ length: 36 }, (_, index) => ({
    index,
    left: `${(index * 29) % 103 - 2}%`,
    delay: `${(index % 9) * 0.21}s`,
    duration: `${4.8 + (index % 5) * 0.65}s`,
    size: `${0.28 + (index % 4) * 0.12}rem`,
    hue: index % 3,
  }));

  return (
    <div className="confetti-field" aria-hidden="true">
      {pieces.map((piece) => (
        <span
          className={`confetti-piece hue-${piece.hue}`}
          key={piece.index}
          style={{
            left: piece.left,
            width: piece.size,
            height: `${Number.parseFloat(piece.size) * (piece.index % 2 ? 1.8 : 0.7)}rem`,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
          }}
        />
      ))}
    </div>
  );
}

function Home() {
  const [introVisible, setIntroVisible] = useState(true);
  const [wished, setWished] = useState(false);
  const [secret, setSecret] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  useReveal();
  useScrollMotion();
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? window.scrollY / max : 0;
      const line = document.querySelector<HTMLElement>('.progress-line');
      if (line) line.style.transform = `scaleX(${progress})`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className={`birthday-shell grain ${galleryOpen ? 'gallery-is-open' : ''}`}>
      {introVisible && <Intro onEnter={() => setIntroVisible(false)} />}
      <div className="progress-rail" aria-hidden="true"><div className="progress-line" /></div>
      <header className="top-mark">
        <span className="top-mark-symbol" aria-hidden="true">M</span>
        <span>For Mariam</span>
        <span className="top-mark-state">A private celebration</span>
      </header>

      <main>
        <section className="hero" id="begin" aria-labelledby="hero-heading">
          <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
          <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
          <div className="hero-side-note mono" aria-hidden="true">A letter in light<br />and little moments</div>
          <div className="hero-copy">
            <div className="eyebrow hero-kicker reveal">A birthday letter, in scenes</div>
            <h1 className="display reveal" id="hero-heading">Happy<br /><span>Birthday</span></h1>
            <p className="hero-sub reveal">Mariam, today the whole day gets to be about you. Keep going — there is a little world waiting further down.</p>
          </div>
          <div className="scroll-cue"><i /> Keep going</div>
        </section>

        <section className="about soft-scene" aria-labelledby="about-heading">
          <div className="about-inner">
            <div className="eyebrow section-number reveal">01 / The reason for all this</div>
            <h2 className="display reveal" id="about-heading">Today is<br /><em>about you.</em></h2>
            <p className="reveal">A little corner of the internet, made for one very particular person — the one who makes ordinary days feel like they have better lighting.</p>
          </div>
        </section>

        <section className="letter-scene" aria-labelledby="letter-heading">
          <div className="letter-wrap">
            <div className="letter-heading reveal">
              <div>
                <div className="eyebrow section-number">02 / Read slowly</div>
                <h2 className="display" id="letter-heading">A little<br /><em>something</em><br />for you.</h2>
              </div>
              <p>For the parts of you that deserve to be celebrated out loud.</p>
            </div>
            <article className="letter-paper reveal" data-testid="text-birthday-letter">
              <p>Mariam,</p>
              <p>There are people who bring their own weather with them. You bring warmth. The kind that makes a room kinder and a hard day feel possible.</p>
              <p>I hope you know how much of a difference your way of seeing things makes. I hope this next chapter gives back some of the joy you hand out so naturally.</p>
              <p>For today, let yourself be looked after. Let the good things find you easily. You have earned a year that feels like a yes.</p>
              <p className="letter-sign">With all my love,<br />someone who is very glad you exist.</p>
            </article>
          </div>
        </section>

        <section className="memories-scene" aria-labelledby="memories-heading">
          <div className="memories-intro reveal">
            <div className="eyebrow section-number">03 / A portrait in moments</div>
            <h2 id="memories-heading">Her<br /><em>memories.</em></h2>
            <p>A small collection of moments that deserve to be remembered. Just Mariam, exactly as she is.</p>
          </div>
          <AccordionInstallation />
          <div className="gallery-hint">Select a photograph to let it fill the room</div>
        </section>

        <section className="bridge-scene" aria-label="A transition">
          <div className="bridge-line reveal">But birthdays are not only about looking back…</div>
          <div className="bridge-line bridge-second reveal">They are about making another memory.</div>
        </section>

        <WishScene wished={wished} onWish={() => setWished(true)} />

          <section className="celebrate" aria-labelledby="celebrate-heading">
            <ConfettiField />
          <span className="spark" /><span className="spark" /><span className="spark" /><span className="spark" />
          <div className="eyebrow reveal">04 / A toast to what comes next</div>
            <h2 className="display reveal" id="celebrate-heading">Celebrate<br /><em>your year.</em></h2>
            <p className="reveal">More late-night laughter. More doors opening. More tiny, perfect moments you did not plan for. This whole little celebration is yours.</p>
        </section>

        <section className="qualities-scene" aria-labelledby="qualities-heading">
          <div className="qualities-inner reveal">
            <div className="eyebrow qualities-eyebrow">What you are</div>
            <h2 className="qualities-heading" id="qualities-heading">
              You are<br /><em>everything.</em>
            </h2>
            <div className="qualities-list">
              {[
                { word: 'Beautiful', hero: true },
                { word: 'Kind', hero: false },
                { word: 'Lovely', hero: false },
                { word: 'Intelligent', hero: true },
                { word: 'Caring', hero: false },
                { word: 'Radiant', hero: false },
                { word: 'Thoughtful', hero: true },
                { word: 'Strong', hero: false },
                { word: 'Joyful', hero: false },
                { word: 'Gentle', hero: true },
                { word: 'Funny', hero: false },
                { word: 'Warm', hero: false },
                { word: 'Inspiring', hero: false },
                { word: 'Graceful', hero: true },
                { word: 'Wonderful', hero: false },
                { word: 'Bright', hero: false },
              ].map(({ word, hero }) => (
                <span key={word} className={`quality-word${hero ? ' quality-hero' : ''}`}>
                  {word}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="shared-intro" aria-labelledby="shared-heading">
          <div className="eyebrow reveal">05 / Kept together</div>
          <h2 className="display reveal" id="shared-heading">You <em>+</em><br />Mariam.</h2>
          <p className="reveal">Some moments are special because of the people in them. Here are a few I would choose again.</p>
        </section>
           <section className="dome-scene" aria-label="Shared memory gallery">
            <DomeGallery
              images={sharedImages.map(([image, label]) => ({
                src: domePath(image),
                alt: `Mariam and me — ${label}`,
              }))}
              fit={0.5}
              fitBasis="auto"
              minRadius={520}
              padFactor={0.2}
              overlayBlurColor="#120f17"
              maxVerticalRotationDeg={5}
              dragSensitivity={20}
              enlargeTransitionMs={350}
              segments={35}
              dragDampening={0.7}
              openedImageWidth="min(82vw, 500px)"
              openedImageHeight="min(82vw, 500px)"
              imageBorderRadius="24px"
              openedImageBorderRadius="28px"
              grayscale={false}
               onOpenChange={setGalleryOpen}
            />
             <div className="dome-help"><span>Drag or swipe to move through the memories</span><i aria-hidden="true" /><span>Tap a photograph to enlarge</span></div>
        </section>

        <section className="final-scene" aria-labelledby="final-heading">
          <div className="eyebrow reveal">06 / The last page</div>
          <h2 className="display reveal" id="final-heading">Happy<br /><em>Birthday,</em><br />Mariam.</h2>
          <p className="reveal">May this year bring you countless beautiful moments, reasons to smile for no particular reason, and memories you will always want to keep.</p>
          <button className="last-thing" type="button" data-testid="button-last-surprise" aria-expanded={secret} onClick={() => setSecret((value) => !value)}>
            {secret ? 'Keep this part forever' : 'There might be one more thing…'}
          </button>
          <div className={`secret ${secret ? 'revealed' : ''}`} aria-hidden={!secret}>
            <div className="secret-rule" />
            <h3>You are<br /><em>the good part.</em></h3>
            <p>That is the secret. That has always been the secret.</p>
            <div className="secret-rule" />
            <div className="eyebrow">Happy birthday, Mariam</div>
          </div>
          <div className="footer-note">Made slowly · With love · For Mariam</div>
        </section>
      </main>
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;