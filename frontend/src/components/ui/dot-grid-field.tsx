// DotGridField — interactive dot-grid particle background.
//
// Pure visual background layer adapted from the DotGridHero ParticleField
// reference: particles sit on a jittered grid and spring back toward their
// origin as the cursor (or touch) repels them. Used ONLY as a background
// behind the existing landing-page hero content — no DOM layout, no copy.
//
// Interaction is scoped to the hero area: pointer tracking and the
// enter/leave "active" state live on the container the canvas fills, so
// particles only react while the cursor actually hovers the hero and spring
// smoothly home once it leaves (no window-wide tracking).
//
// Colors reuse the existing "Mossy Hollow" design tokens verbatim
// (src/styles/theme.css + tailwind.config.js) — no new hex values.
import { useEffect, useRef } from 'react';

const THEME_DOT_COLORS = [
  { rgb: '99, 107, 47', alphas: [0.14, 0.24, 0.38] },  // moss-primary  #636b2f
  { rgb: '61, 65, 39', alphas: [0.12, 0.2, 0.32] },    // moss-deep     #3d4127
  { rgb: '186, 192, 149', alphas: [0.16, 0.28, 0.42] }, // moss-sage    #bac095
];

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  color: string;
  size: number;
  vx: number;
  vy: number;
}

interface DotGridFieldProps {
  dotGap?: number;
  interactionRadius?: number;
  repulsionStrength?: number;
  springK?: number;
  damping?: number;
  className?: string;
}

const DotGridField = ({
  dotGap = 72,
  interactionRadius = 120,
  repulsionStrength = 7,
  springK = 0.065,
  damping = 0.8,
  className,
}: DotGridFieldProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const activeRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);
  const inViewRef = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    reducedMotionRef.current = reducedMotion;

    const pickColor = (): string => {
      const color = THEME_DOT_COLORS[Math.floor(Math.random() * THEME_DOT_COLORS.length)];
      const alpha = color.alphas[Math.floor(Math.random() * color.alphas.length)];
      return `rgba(${color.rgb}, ${alpha})`;
    };

    const initParticles = (width: number, height: number) => {
      particlesRef.current = [];
      // Sparse the grid on narrow viewports so mobile stays calm and fast.
      const gap = width < 640 ? dotGap * 1.6 : width < 1024 ? dotGap * 1.2 : dotGap;
      const cols = Math.max(1, Math.floor(width / gap));
      const rows = Math.max(1, Math.floor(height / gap));

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const originX = gap / 2 + i * gap + (Math.random() - 0.5) * gap * 0.35;
          const originY = gap / 2 + j * gap + (Math.random() - 0.5) * gap * 0.35;
          const particle: Particle = {
            x: originX,
            y: originY,
            originX,
            originY,
            color: pickColor(),
            size: Math.random() < 0.5 ? 1.5 : 2,
            vx: 0,
            vy: 0,
          };
          if (reducedMotion) {
            particle.x = originX;
            particle.y = originY;
          }
          particlesRef.current.push(particle);
        }
      }
    };

    const setupCanvas = () => {
      const cssWidth = canvas.clientWidth || 0;
      const cssHeight = canvas.clientHeight || 0;
      if (cssWidth === 0 || cssHeight === 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles(cssWidth, cssHeight);
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
      for (const particle of particlesRef.current) {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const update = () => {
      const mouse = mouseRef.current;
      for (const particle of particlesRef.current) {
        if (mouse && activeRef.current) {
          const dx = particle.x - mouse.x;
          const dy = particle.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < interactionRadius && dist > 0) {
            const force = (interactionRadius - dist) / interactionRadius;
            particle.vx += (dx / dist) * force * repulsionStrength;
            particle.vy += (dy / dist) * force * repulsionStrength;
          }
        }
        particle.vx *= damping;
        particle.vy *= damping;
        particle.x += particle.vx + (particle.originX - particle.x) * springK;
        particle.y += particle.vy + (particle.originY - particle.y) * springK;
      }
    };

    const animate = () => {
      rafRef.current = null;
      if (reducedMotionRef.current || !inViewRef.current) return;
      update();
      draw();
      rafRef.current = requestAnimationFrame(animate);
    };

    const resume = () => {
      if (rafRef.current == null && !reducedMotionRef.current && inViewRef.current) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    // --- Interaction scoped to this container (the hero area) ---
    const handleMouseEnter = () => {
      activeRef.current = true;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!activeRef.current) return;
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      activeRef.current = false;
      mouseRef.current = null;
    };

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      activeRef.current = true;
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!activeRef.current) return;
      const touch = event.touches[0];
      if (!touch) return;
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    };

    const handleTouchEnd = () => {
      activeRef.current = false;
      mouseRef.current = null;
    };

    const handleResize = () => {
      setupCanvas();
      if (reducedMotionRef.current) draw();
      else resume();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      inViewRef.current = entry.isIntersecting;
      if (entry.isIntersecting) resume();
    });
    intersectionObserver.observe(canvas);

    const handleVisibility = () => {
      inViewRef.current = !document.hidden;
      if (!document.hidden) resume();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleReducedMotionChange = (event: MediaQueryListEvent) => {
      reducedMotionRef.current = event.matches;
      if (event.matches) {
        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        draw();
      } else {
        resume();
      }
    };
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    setupCanvas();
    if (reducedMotionRef.current) draw();
    else resume();

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
      particlesRef.current = [];
    };
  }, [dotGap, interactionRadius, repulsionStrength, springK, damping]);

  return (
    <div ref={containerRef} className={className}>
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 h-full w-full"
        style={{ pointerEvents: 'none' }}
      />
    </div>
  );
};

export default DotGridField;