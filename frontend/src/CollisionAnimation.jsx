
import { useEffect, useRef } from 'react';

const CollisionAnimation = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const ballsRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Set canvas size with High DPI support
    const resize = () => {
      const parent = canvas.parentElement;
      const dpr = window.devicePixelRatio || 1;

      canvas.style.width = `${parent.offsetWidth}px`;
      canvas.style.height = `${parent.offsetHeight}px`;

      canvas.width = parent.offsetWidth * dpr;
      canvas.height = parent.offsetHeight * dpr;

      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    // Ball class
    class Ball {
      constructor(x, y, radius, color, vx, vy) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.vx = vx;
        this.vy = vy;
        this.mass = radius; // Mass proportional to radius
        this.collisionFlash = 0; // For collision visual effect
      }

      draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

        // Use solid color instead of gradient
        if (this.collisionFlash > 0) {
          const flashIntensity = this.collisionFlash;
          ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * flashIntensity})`;
          this.collisionFlash -= 0.05;
        } else {
          ctx.fillStyle = this.color;
        }

        ctx.fill();

        // Add glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Add highlight
        ctx.beginPath();
        ctx.arc(
          this.x - this.radius * 0.25,
          this.y - this.radius * 0.25,
          this.radius * 0.2,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
      }

      lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
        const B = Math.min(255, (num & 0x0000ff) + amt);
        return `rgb(${R}, ${G}, ${B})`;
      }

      darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
        const B = Math.max(0, (num & 0x0000ff) - amt);
        return `rgb(${R}, ${G}, ${B})`;
      }

      update(width, height, padding) {
        this.x += this.vx;
        this.y += this.vy;

        // Collision with walls
        const boxLeft = padding;
        const boxRight = width - padding;
        const boxTop = padding;
        const boxBottom = height - padding;

        if (this.x - this.radius < boxLeft) {
          this.x = boxLeft + this.radius;
          this.vx = -this.vx * 0.98; // Slight energy loss
          this.collisionFlash = 1;
        }
        if (this.x + this.radius > boxRight) {
          this.x = boxRight - this.radius;
          this.vx = -this.vx * 0.98;
          this.collisionFlash = 1;
        }
        if (this.y - this.radius < boxTop) {
          this.y = boxTop + this.radius;
          this.vy = -this.vy * 0.98;
          this.collisionFlash = 1;
        }
        if (this.y + this.radius > boxBottom) {
          this.y = boxBottom - this.radius;
          this.vy = -this.vy * 0.98;
          this.collisionFlash = 1;
        }
      }
    }

    // Check and resolve collision between two balls using proper 2D elastic collision
    const handleBallCollision = (ball1, ball2) => {
      const dx = ball2.x - ball1.x;
      const dy = ball2.y - ball1.y;
      const distSq = dx * dx + dy * dy;
      const minDist = ball1.radius + ball2.radius;

      // Check if balls are overlapping
      if (distSq >= minDist * minDist) return false;

      const distance = Math.sqrt(distSq);

      // Prevent division by zero - if balls are at same position, push them apart
      if (distance === 0) {
        ball1.x -= 1;
        ball2.x += 1;
        return true;
      }

      // Unit normal vector from ball1 to ball2
      const nx = dx / distance;
      const ny = dy / distance;

      // Unit tangent vector (perpendicular to normal)
      const tx = -ny;
      const ty = nx;

      // Project velocities onto normal and tangent
      const v1n = ball1.vx * nx + ball1.vy * ny; // ball1 velocity along normal
      const v1t = ball1.vx * tx + ball1.vy * ty; // ball1 velocity along tangent
      const v2n = ball2.vx * nx + ball2.vy * ny; // ball2 velocity along normal
      const v2t = ball2.vx * tx + ball2.vy * ty; // ball2 velocity along tangent

      // Tangential velocities don't change (no friction)
      // Normal velocities change according to 1D elastic collision formula
      const m1 = ball1.mass;
      const m2 = ball2.mass;

      // New normal velocities (1D elastic collision equations)
      const v1nNew = (v1n * (m1 - m2) + 2 * m2 * v2n) / (m1 + m2);
      const v2nNew = (v2n * (m2 - m1) + 2 * m1 * v1n) / (m1 + m2);

      // Convert scalar normal and tangent velocities back to vectors
      ball1.vx = v1nNew * nx + v1t * tx;
      ball1.vy = v1nNew * ny + v1t * ty;
      ball2.vx = v2nNew * nx + v2t * tx;
      ball2.vy = v2nNew * ny + v2t * ty;

      // Separate balls so they don't overlap (push apart along normal)
      const overlap = minDist - distance;
      const separationRatio1 = m2 / (m1 + m2);
      const separationRatio2 = m1 / (m1 + m2);

      ball1.x -= overlap * nx * separationRatio1;
      ball1.y -= overlap * ny * separationRatio1;
      ball2.x += overlap * nx * separationRatio2;
      ball2.y += overlap * ny * separationRatio2;

      // Visual feedback
      ball1.collisionFlash = 1;
      ball2.collisionFlash = 1;

      return true;
    };

    // Initialize balls - all same color (cyan)
    const BALL_COLOR = '#06b6d4';

    const initBalls = () => {
      const width = canvas.parentElement.offsetWidth;
      const height = canvas.parentElement.offsetHeight;
      const padding = 40;
      const balls = [];
      const numBalls = 12;

      for (let i = 0; i < numBalls; i++) {
        const radius = Math.random() * 20 + 15; // 15-35px radius
        const x = padding + radius + Math.random() * (width - 2 * padding - 2 * radius);
        const y = padding + radius + Math.random() * (height - 2 * padding - 2 * radius);
        const speed = 15;
        const angle = Math.random() * Math.PI * 2;
        const vx = Math.cos(angle) * speed * (Math.random() + 0.5);
        const vy = Math.sin(angle) * speed * (Math.random() + 0.5);

        balls.push(new Ball(x, y, radius, BALL_COLOR, vx, vy));
      }

      return balls;
    };

    if (!ballsRef.current) {
      ballsRef.current = initBalls();
    }

    // Collision particles for effects
    const particles = [];
    let cycleStart = Date.now();

    const createCollisionParticles = (x, y) => {
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const speed = Math.random() * 3 + 2;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 3 + 1,
          color: BALL_COLOR,
          life: 1,
        });
      }
    };

    const animate = () => {
      const elapsed = Date.now() - cycleStart;
      const CYCLE_TIME = 350; // Complete collision cycle in 350ms for instant note switching

      // Auto-reset cycle
      if (elapsed > CYCLE_TIME) {
        cycleStart = Date.now();
        ballsRef.current = initBalls(); // Reinitialize balls for fresh pattern
      }

      const width = canvas.parentElement.offsetWidth;
      const height = canvas.parentElement.offsetHeight;
      const padding = 40;

      // Clear canvas
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Draw box border with glow
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 20;

      // Draw rounded rectangle for the box
      const boxX = padding;
      const boxY = padding;
      const boxW = width - 2 * padding;
      const boxH = height - 2 * padding;
      const cornerRadius = 15;

      ctx.beginPath();
      ctx.moveTo(boxX + cornerRadius, boxY);
      ctx.lineTo(boxX + boxW - cornerRadius, boxY);
      ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + cornerRadius);
      ctx.lineTo(boxX + boxW, boxY + boxH - cornerRadius);
      ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - cornerRadius, boxY + boxH);
      ctx.lineTo(boxX + cornerRadius, boxY + boxH);
      ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - cornerRadius);
      ctx.lineTo(boxX, boxY + cornerRadius);
      ctx.quadraticCurveTo(boxX, boxY, boxX + cornerRadius, boxY);
      ctx.closePath();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw inner glow on box
      ctx.fillStyle = 'rgba(6, 182, 212, 0.05)';
      ctx.fill();

      // Update ball positions - SUPER FAST: 5 updates per frame
      const balls = ballsRef.current;

      for (let i = 0; i < balls.length; i++) {
        for (let u = 0; u < 10; u++) {
          balls[i].update(width, height, padding);
        }
      }

      // Check and resolve collisions (multiple iterations for stability)
      const collisionIterations = 3;
      for (let iter = 0; iter < collisionIterations; iter++) {
        for (let i = 0; i < balls.length; i++) {
          for (let j = i + 1; j < balls.length; j++) {
            const collided = handleBallCollision(balls[i], balls[j]);

            // Only create particles on first iteration to avoid spam
            if (collided && iter === 0) {
              const midX = (balls[i].x + balls[j].x) / 2;
              const midY = (balls[i].y + balls[j].y) / 2;
              createCollisionParticles(midX, midY);
            }
          }
        }
      }

      // Update and draw particles - SUPER FAST fade
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.2;  // was 0.08, now much faster
        p.vx *= 0.98;
        p.vy *= 0.98;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Draw balls
      for (const ball of balls) {
        ball.draw(ctx);
      }

      // Draw velocity trails (subtle)
      ctx.globalAlpha = 0.3;
      for (const ball of balls) {
        const trailLength = 5;
        for (let i = 1; i <= trailLength; i++) {
          const alpha = (1 - i / trailLength) * 0.3;
          const trailX = ball.x - ball.vx * i * 2;
          const trailY = ball.y - ball.vy * i * 2;
          const trailRadius = ball.radius * (1 - i / trailLength * 0.5);

          ctx.beginPath();
          ctx.arc(trailX, trailY, trailRadius, 0, Math.PI * 2);
          ctx.fillStyle = ball.color;
          ctx.globalAlpha = alpha;
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="w-full h-full bg-slate-950 relative overflow-hidden flex flex-col">
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h2 className="text-xl font-bold text-slate-200">Collision Physics</h2>
        <p className="text-sm text-slate-500">Elastic ball collisions</p>
      </div>
      <canvas ref={canvasRef} className="block" style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default CollisionAnimation;
