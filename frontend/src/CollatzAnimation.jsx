
import { useEffect, useRef } from 'react';

const CollatzAnimation = () => {
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

    // Collatz sequence generator
    const getCollatzSequence = (n) => {
      const sequence = [n];
      while (n !== 1) {
        if (n % 2 === 0) {
          n = n / 2;
        } else {
          n = 3 * n + 1;
        }
        sequence.push(n);
      }
      return sequence;
    };

    // State
    let currentNumber = Math.floor(Math.random() * 50) + 1;
    let sequence = getCollatzSequence(currentNumber);
    let currentStep = 0;
    let animationProgress = 0;
    let displayedPoints = [];
    let maxValue = Math.max(...sequence);
    let waitingForNext = false;
    let waitStartTime = 0;

    // Pick new random number
    const pickNewNumber = () => {
      currentNumber = Math.floor(Math.random() * 50) + 1;
      sequence = getCollatzSequence(currentNumber);
      currentStep = 0;
      animationProgress = 0;
      displayedPoints = [];
      maxValue = Math.max(...sequence);
      waitingForNext = false;
    };

    // Color based on value
    const getColor = (value, maxVal) => {
      const t = value / maxVal;
      // Cyan to purple to pink
      if (t < 0.5) {
        const p = t * 2;
        const r = Math.floor(6 + (168 - 6) * p);
        const g = Math.floor(182 + (85 - 182) * p);
        const b = Math.floor(212 + (247 - 212) * p);
        return `rgb(${r}, ${g}, ${b})`;
      } else {
        const p = (t - 0.5) * 2;
        const r = Math.floor(168 + (236 - 168) * p);
        const g = Math.floor(85 + (72 - 85) * p);
        const b = Math.floor(247 + (153 - 247) * p);
        return `rgb(${r}, ${g}, ${b})`;
      }
    };

    const animate = () => {
      // Clear with dark background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      const padding = 50;
      const graphWidth = width - padding * 2;
      const graphHeight = height - padding * 2 - 40; // Extra space for title

      // Draw axes
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, padding + 40);
      ctx.lineTo(padding, height - padding);
      ctx.lineTo(width - padding, height - padding);
      ctx.stroke();

      // Draw grid lines
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.1)';
      for (let i = 0; i <= 4; i++) {
        const y = padding + 40 + (graphHeight * i) / 4;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
      }

      // Handle waiting state
      if (waitingForNext) {
        const now = Date.now();
        if (now - waitStartTime > 2000) {
          pickNewNumber();
        }
      } else {
        // Animate adding points
        animationProgress += 0.05;
        if (animationProgress >= 1 && currentStep < sequence.length - 1) {
          displayedPoints.push({
            step: currentStep,
            value: sequence[currentStep],
            x: padding + (currentStep / Math.max(sequence.length - 1, 1)) * graphWidth,
            y: padding + 40 + graphHeight - (sequence[currentStep] / maxValue) * graphHeight * 0.9
          });
          currentStep++;
          animationProgress = 0;
        }

        // Add final point
        if (currentStep === sequence.length - 1 && displayedPoints.length < sequence.length) {
          displayedPoints.push({
            step: currentStep,
            value: sequence[currentStep],
            x: padding + (currentStep / Math.max(sequence.length - 1, 1)) * graphWidth,
            y: padding + 40 + graphHeight - (sequence[currentStep] / maxValue) * graphHeight * 0.9
          });
          waitingForNext = true;
          waitStartTime = Date.now();
        }
      }

      // Draw connecting lines with gradient
      if (displayedPoints.length > 1) {
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 0; i < displayedPoints.length - 1; i++) {
          const p1 = displayedPoints[i];
          const p2 = displayedPoints[i + 1];

          const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
          gradient.addColorStop(0, getColor(p1.value, maxValue));
          gradient.addColorStop(1, getColor(p2.value, maxValue));

          ctx.strokeStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }

      // Draw points with glow
      for (let i = 0; i < displayedPoints.length; i++) {
        const point = displayedPoints[i];
        const color = getColor(point.value, maxValue);

        // Glow
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
      }

      // Draw current animating point
      if (!waitingForNext && currentStep < sequence.length && displayedPoints.length > 0) {
        const lastPoint = displayedPoints[displayedPoints.length - 1];
        const nextStep = currentStep;
        if (nextStep < sequence.length) {
          const nextX = padding + (nextStep / Math.max(sequence.length - 1, 1)) * graphWidth;
          const nextY = padding + 40 + graphHeight - (sequence[nextStep] / maxValue) * graphHeight * 0.9;

          const currentX = lastPoint.x + (nextX - lastPoint.x) * animationProgress;
          const currentY = lastPoint.y + (nextY - lastPoint.y) * animationProgress;

          const color = getColor(sequence[nextStep], maxValue);

          // Animated line
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(lastPoint.x, lastPoint.y);
          ctx.lineTo(currentX, currentY);
          ctx.stroke();

          // Animated point with larger glow
          ctx.shadowColor = color;
          ctx.shadowBlur = 15;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(currentX, currentY, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Draw starting number (large, centered at top)
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`n = ${currentNumber}`, width / 2, padding + 20);

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
        <h2 className="text-xl font-bold text-slate-200">Collatz Conjecture</h2>
        <p className="text-sm text-slate-500">3n+1 sequence</p>
      </div>
      <canvas ref={canvasRef} className="block" style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default CollatzAnimation;
