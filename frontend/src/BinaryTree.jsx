
import { useEffect, useRef } from 'react';

const BinaryTree = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const progressRef = useRef(1);
  const treeDataRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Set canvas size with High DPI support
    const resize = () => {
      const parent = canvas.parentElement;
      const dpr = window.devicePixelRatio || 1;

      // Set display size (css properties)
      canvas.style.width = `${parent.offsetWidth}px`;
      canvas.style.height = `${parent.offsetHeight}px`;

      // Set actual size in memory (scaled to account for extra pixel density)
      canvas.width = parent.offsetWidth * dpr;
      canvas.height = parent.offsetHeight * dpr;

      // Normalize coordinate system to use css pixels
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    // Tree constants
    const MAX_DEPTH = 4; // Reduced to 4 as requested
    // Removed fixed ROOT_VALUE

    // Generate random 6-digit number
    const generateRootValue = () => Math.floor(Math.random() * 900000) + 100000;

    // Generate tree data with random children
    const generateTreeData = (depth, val) => {
      if (depth === 0) return null;
      return {
        value: val,
        left: generateTreeData(depth - 1, Math.floor(Math.random() * 999999)),
        right: generateTreeData(depth - 1, Math.floor(Math.random() * 999999))
      };
    };

    // Initialize tree data
    if (!treeDataRef.current) {
      treeDataRef.current = generateTreeData(MAX_DEPTH, generateRootValue());
    }

    const drawNode = (node, x, y, level, maxLevel, currentProgress, scale, baseSpread, verticalStep) => {
      if (!node) return;

      if (level > currentProgress) return;

      // Calculate spread for children
      const spreadMultiplier = Math.pow(2, maxLevel - level - 1);
      const currentSpread = spreadMultiplier * baseSpread;

      const growth = Math.min(1, Math.max(0, currentProgress - level));
      const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);
      const smoothedGrowth = easeOutQuart(growth);

      // Draw connections
      if (node.left) {
        const nextX = x - currentSpread;
        const nextY = y + verticalStep;

        const currentEndX = x + (nextX - x) * smoothedGrowth;
        const currentEndY = y + (nextY - y) * smoothedGrowth;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(currentEndX, currentEndY);
        ctx.strokeStyle = `rgba(148, 163, 184, ${0.8 * smoothedGrowth})`;
        ctx.lineWidth = 3 * scale; // Thicker lines for better visibility
        ctx.stroke();

        if (growth > 0.01) {
          drawNode(node.left, nextX, nextY, level + 1, maxLevel, currentProgress, scale, baseSpread, verticalStep);
        }
      }
      if (node.right) {
        const nextX = x + currentSpread;
        const nextY = y + verticalStep;

        const currentEndX = x + (nextX - x) * smoothedGrowth;
        const currentEndY = y + (nextY - y) * smoothedGrowth;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(currentEndX, currentEndY);
        ctx.strokeStyle = `rgba(148, 163, 184, ${0.8 * smoothedGrowth})`;
        ctx.lineWidth = 3 * scale;
        ctx.stroke();

        if (growth > 0.01) {
          drawNode(node.right, nextX, nextY, level + 1, maxLevel, currentProgress, scale, baseSpread, verticalStep);
        }
      }

      // Draw node
      let nodeOpacity = 0;
      let nodeScale = 0;

      if (level === 1) {
        nodeOpacity = 1;
        nodeScale = 1;
      } else {
        const parentProgress = currentProgress - (level - 1);
        const appearFactor = Math.min(1, Math.max(0, (parentProgress - 0.8) * 5));
        nodeOpacity = appearFactor;
        nodeScale = easeOutQuart(appearFactor);
      }

      if (nodeOpacity > 0) {
        // Increased radius for bigger nodes
        const scaledRadius = 28 * scale;

        ctx.save();
        ctx.globalAlpha = nodeOpacity;

        ctx.beginPath();
        ctx.arc(x, y, scaledRadius * nodeScale, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.strokeStyle = `rgba(56, 189, 248, ${nodeOpacity})`;
        ctx.lineWidth = 3 * scale;
        ctx.stroke();

        if (nodeScale > 0.5) {
          ctx.fillStyle = `rgba(241, 245, 249, ${nodeOpacity})`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          // Increased font size significantly
          ctx.font = `bold ${Math.max(12, 14 * scale * nodeScale)}px monospace`;
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 4;
          ctx.fillText(node.value.toString(), x, y);
        }

        ctx.restore();
      }
    };

    const animate = () => {
      // Clear rect using css pixels (because we scaled the context)
      const width = canvas.parentElement.offsetWidth;
      const height = canvas.parentElement.offsetHeight;
      ctx.clearRect(0, 0, width, height);

      const leafCount = Math.pow(2, MAX_DEPTH - 1);
      const nodeRadius = 28; // Updated radius
      const minSpacing = 40; // Increased spacing for bigger nodes
      const totalTreeWidth = leafCount * (nodeRadius * 2 + minSpacing);

      const verticalGap = 130;
      const totalTreeHeight = (MAX_DEPTH - 1) * verticalGap + nodeRadius * 4;

      const padding = 30;
      const availableW = width - padding * 2;
      const availableH = height - padding * 2;

      const scaleW = availableW / totalTreeWidth;
      const scaleH = availableH / totalTreeHeight;
      const scale = Math.min(1.5, Math.min(scaleW, scaleH));

      const verticalStep = verticalGap * scale;
      const baseSpreadUnit = (nodeRadius * 2 + minSpacing) / 2;
      const scaledBaseSpread = baseSpreadUnit * scale;

      // Animation Loop logic
      // 1. Grow tree
      // 2. Wait a bit (progress > MAX + wait)
      // 3. Reset and Regenerate

      if (progressRef.current < MAX_DEPTH + 3) { // Wait until +3 (arbitrary pause duration)
        // Faster animation
        progressRef.current += 0.025;
      } else {
        // Reset and Regenerate
        progressRef.current = 1;
        treeDataRef.current = generateTreeData(MAX_DEPTH, generateRootValue());
      }

      const rootX = width / 2;
      // Center vertically
      const treeVisualHeight = (MAX_DEPTH - 1) * verticalStep;
      const rootY = (height - treeVisualHeight) / 2;

      if (treeDataRef.current) {
        drawNode(treeDataRef.current, rootX, rootY, 1, MAX_DEPTH, progressRef.current, scale, scaledBaseSpread, verticalStep);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    progressRef.current = 1;
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="w-full h-full bg-slate-950 relative overflow-hidden flex flex-col">
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h2 className="text-xl font-bold text-slate-200">Binary Tree Visualization</h2>
      </div>
      <canvas ref={canvasRef} className="block" style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default BinaryTree;
