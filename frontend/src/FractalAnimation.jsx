
import { useEffect, useRef } from 'react';

const FractalAnimation = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;

    const resize = () => {
      const parent = canvas.parentElement;
      const dpr = window.devicePixelRatio || 1;

      canvas.style.width = `${parent.offsetWidth}px`;
      canvas.style.height = `${parent.offsetHeight}px`;

      canvas.width = parent.offsetWidth * dpr;
      canvas.height = parent.offsetHeight * dpr;

      width = parent.offsetWidth;
      height = parent.offsetHeight;

      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    // Fractal flame parameters
    const particles = [];
    const maxParticles = 5000;
    const trailCanvas = document.createElement('canvas');
    const trailCtx = trailCanvas.getContext('2d');

    const initTrailCanvas = () => {
      trailCanvas.width = canvas.width;
      trailCanvas.height = canvas.height;
      trailCtx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
      trailCtx.fillStyle = '#0f172a';
      trailCtx.fillRect(0, 0, width, height);
    };
    initTrailCanvas();

    // Variation functions for fractal flames
    const variations = [
      // Linear
      (x, y) => ({ x, y }),
      // Sinusoidal
      (x, y) => ({ x: Math.sin(x), y: Math.sin(y) }),
      // Spherical
      (x, y) => {
        const r2 = x * x + y * y + 0.0001;
        return { x: x / r2, y: y / r2 };
      },
      // Swirl
      (x, y) => {
        const r2 = x * x + y * y;
        const sinr = Math.sin(r2);
        const cosr = Math.cos(r2);
        return { x: x * sinr - y * cosr, y: x * cosr + y * sinr };
      },
      // Horseshoe
      (x, y) => {
        const r = Math.sqrt(x * x + y * y) + 0.0001;
        return { x: (x - y) * (x + y) / r, y: 2 * x * y / r };
      },
      // Polar
      (x, y) => {
        const r = Math.sqrt(x * x + y * y);
        const theta = Math.atan2(y, x);
        return { x: theta / Math.PI, y: r - 1 };
      },
      // Heart
      (x, y) => {
        const r = Math.sqrt(x * x + y * y);
        const theta = Math.atan2(y, x);
        return { x: r * Math.sin(theta * r), y: -r * Math.cos(theta * r) };
      },
      // Disc
      (x, y) => {
        const r = Math.sqrt(x * x + y * y) * Math.PI;
        const theta = Math.atan2(y, x) / Math.PI;
        return { x: theta * Math.sin(r), y: theta * Math.cos(r) };
      },
    ];

    // Color palette - cyan to purple to pink
    const getColor = (t, alpha) => {
      t = ((t % 1) + 1) % 1;
      let r, g, b;
      if (t < 0.33) {
        const p = t / 0.33;
        r = Math.floor(6 + (168 - 6) * p);
        g = Math.floor(182 + (85 - 182) * p);
        b = Math.floor(212 + (247 - 212) * p);
      } else if (t < 0.66) {
        const p = (t - 0.33) / 0.33;
        r = Math.floor(168 + (236 - 168) * p);
        g = Math.floor(85 + (72 - 85) * p);
        b = Math.floor(247 + (153 - 247) * p);
      } else {
        const p = (t - 0.66) / 0.34;
        r = Math.floor(236 + (6 - 236) * p);
        g = Math.floor(72 + (182 - 72) * p);
        b = Math.floor(153 + (212 - 153) * p);
      }
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // Initialize particles
    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = (Math.random() - 0.5) * 4;
        this.y = (Math.random() - 0.5) * 4;
        this.color = Math.random();
        this.life = 0;
      }

      update(time) {
        // Apply random variation
        const varIndex = Math.floor(Math.random() * variations.length);
        const variation = variations[varIndex];

        // Add time-based rotation for animation
        const angle = time * 0.0005;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const rx = this.x * cos - this.y * sin;
        const ry = this.x * sin + this.y * cos;

        const result = variation(rx, ry);
        this.x = result.x;
        this.y = result.y;

        // Slowly shift color
        this.color += 0.001;
        this.life++;

        // Reset if out of bounds or too old
        if (Math.abs(this.x) > 10 || Math.abs(this.y) > 10 || this.life > 500) {
          this.reset();
        }
      }

      draw(ctx, width, height) {
        // Map to screen coordinates
        const scale = Math.min(width, height) * 0.2;
        const screenX = width / 2 + this.x * scale;
        const screenY = height / 2 + this.y * scale;

        if (screenX < 0 || screenX > width || screenY < 0 || screenY > height) return;

        // Fade in based on life
        const alpha = Math.min(this.life / 20, 0.6);
        ctx.fillStyle = getColor(this.color, alpha);
        ctx.fillRect(screenX, screenY, 1.5, 1.5);
      }
    }

    // Create particles
    for (let i = 0; i < maxParticles; i++) {
      particles.push(new Particle());
    }

    let time = 0;

    const animate = () => {
      time++;

      // Fade trail canvas
      trailCtx.fillStyle = 'rgba(15, 23, 42, 0.03)';
      trailCtx.fillRect(0, 0, width, height);

      // Update and draw particles on trail canvas
      for (const particle of particles) {
        particle.update(time);
        particle.draw(trailCtx, width, height);
      }

      // Copy trail to main canvas
      ctx.drawImage(trailCanvas, 0, 0, width, height);

      // Add glow effect in center
      const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.min(width, height) * 0.4
      );
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0.05)');
      gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.02)');
      gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="w-full h-full bg-slate-950 relative overflow-hidden flex flex-col">
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h2 className="text-xl font-bold text-slate-200">Fractal Flames</h2>
        <p className="text-sm text-slate-500">Iterated function system</p>
      </div>
      <canvas ref={canvasRef} className="block" style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default FractalAnimation;
