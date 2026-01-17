
import { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, Zap, BarChart3, Wifi, WifiOff, Music, Network } from 'lucide-react';
import BinaryTree from './BinaryTree';

const WEBSOCKET_URL = 'ws://localhost:8766/ws';

// Musical notes for display
const NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

function App() {
  const [cpuHistory, setCpuHistory] = useState(() => Array(100).fill(0));
  const [currentCPU, setCurrentCPU] = useState(0);
  const [peakCPU, setPeakCPU] = useState(0);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('compute');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [activeNoteIndex, setActiveNoteIndex] = useState(0);
  const [barPosition, setBarPosition] = useState(0);
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' or 'tree'

  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const noteBarRef = useRef(null);

  // WebSocket connection with auto-reconnect
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    console.log('Connecting to CPU WebSocket...');
    setConnectionError(null);

    const ws = new WebSocket(WEBSOCKET_URL);

    ws.onopen = () => {
      console.log('Connected to CPU WebSocket');
      setIsConnected(true);
      setConnectionError(null);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const cpuValue = data.cpu;

        // Update CPU directly (no interpolation)
        setCurrentCPU(cpuValue);

        // Update peak
        setPeakCPU(prev => Math.max(prev, cpuValue));

        // Add to history
        setCpuHistory(prev => [...prev.slice(1), cpuValue]);
      } catch (err) {
        console.error('Error parsing CPU data:', err);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      wsRef.current = null;

      // Auto-reconnect after 2 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          connectWebSocket();
        }
      }, 2000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionError('Failed to connect to CPU server');
      setIsConnected(false);
    };

    wsRef.current = ws;
  }, [isPlaying]);

  // Connect/disconnect based on isPlaying state
  useEffect(() => {
    if (isPlaying) {
      connectWebSocket();
    } else {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isPlaying, connectWebSocket]);

  // Canvas animation for the stage
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    let particles = [];
    const particleCount = 50;

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: Math.random() * 3 + 1,
        hue: Math.random() * 60 + 180,
      });
    }

    const animate = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;

      // Slower fade for smoother trails
      ctx.fillStyle = 'rgba(15, 23, 42, 0.05)';
      ctx.fillRect(0, 0, width, height);

      const cpuFactor = currentCPU / 100;

      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * 0.15;
      const radius = baseRadius + cpuFactor * 50;
      // Slow down time by 4x
      const time = Date.now() * 0.00025;

      // Outer glow
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 2);
      gradient.addColorStop(0, `hsla(${180 + cpuFactor * 100}, 100%, 60%, 0.3)`);
      gradient.addColorStop(0.5, `hsla(${280 + cpuFactor * 50}, 100%, 50%, 0.1)`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw rotating polygon based on algorithm
      const sides = selectedAlgorithm === 'compute' ? 6 :
        selectedAlgorithm === 'sorting' ? 4 :
          selectedAlgorithm === 'matrix' ? 8 : 5;

      ctx.save();
      ctx.translate(centerX, centerY);
      // Slower rotation (reduced from 0.5 + cpuFactor to 0.1 + cpuFactor * 0.2)
      ctx.rotate(time * (0.1 + cpuFactor * 0.2));

      // Multiple layers of the shape
      for (let layer = 3; layer >= 0; layer--) {
        const layerRadius = radius * (1 + layer * 0.2);
        const alpha = 0.3 - layer * 0.05;

        ctx.beginPath();
        for (let i = 0; i <= sides; i++) {
          const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
          // Slower wobble (reduced from time * 3 to time * 0.8)
          const wobble = Math.sin(time * 0.8 + i) * cpuFactor * 10;
          const x = Math.cos(angle) * (layerRadius + wobble);
          const y = Math.sin(angle) * (layerRadius + wobble);

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();

        ctx.strokeStyle = `hsla(${180 + cpuFactor * 100 + layer * 30}, 100%, ${60 + layer * 10}%, ${alpha})`;
        ctx.lineWidth = 3 - layer * 0.5;
        ctx.stroke();
      }

      // Inner filled shape
      ctx.beginPath();
      for (let i = 0; i <= sides; i++) {
        const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(angle) * radius * 0.5;
        const y = Math.sin(angle) * radius * 0.5;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      const innerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.5);
      innerGradient.addColorStop(0, `hsla(${320}, 100%, 60%, 0.8)`);
      innerGradient.addColorStop(1, `hsla(${200}, 100%, 50%, 0.4)`);
      ctx.fillStyle = innerGradient;
      ctx.fill();

      ctx.restore();

      // Update and draw particles - slower movement
      particles.forEach((p, i) => {
        // Reduced particle speed (from 1 + cpuFactor * 2 to 0.3 + cpuFactor * 0.5)
        p.x += p.vx * (0.3 + cpuFactor * 0.5);
        p.y += p.vy * (0.3 + cpuFactor * 0.5);

        const dx = centerX - p.x;
        const dy = centerY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > radius * 3) {
          p.vx += dx * 0.00005;
          p.vy += dy * 0.00005;
        }

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * (1 + cpuFactor), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue + cpuFactor * 60}, 100%, 70%, ${0.5 + cpuFactor * 0.3})`;
        ctx.fill();

        particles.slice(i + 1).forEach(p2 => {
          const d = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
          if (d < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `hsla(${200}, 100%, 60%, ${(1 - d / 100) * 0.2})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animate();
    }

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [selectedAlgorithm, isPlaying, currentCPU]);

  // Note bar animation - moves based on CPU activity
  useEffect(() => {
    if (!isPlaying) return;

    let frameId;
    let lastTime = Date.now();

    const animateBar = () => {
      const now = Date.now();
      const delta = now - lastTime;

      // Speed based on CPU (higher CPU = faster)
      const speed = 0.05 + (currentCPU / 100) * 0.15;

      setBarPosition(prev => {
        const newPos = prev + speed * delta * 0.01;
        // Reset when bar reaches end
        if (newPos >= 100) {
          return 0;
        }
        return newPos;
      });

      // Update active note based on bar position
      setActiveNoteIndex(Math.floor((barPosition / 100) * NOTES.length) % NOTES.length);

      lastTime = now;
      noteBarRef.current = requestAnimationFrame(animateBar);
    };

    noteBarRef.current = requestAnimationFrame(animateBar);

    return () => {
      if (noteBarRef.current) {
        cancelAnimationFrame(noteBarRef.current);
      }
    };
  }, [isPlaying, currentCPU, barPosition]);

  const getCPUColor = (value) => {
    if (value < 30) return 'text-cyan-400';
    if (value < 60) return 'text-purple-400';
    return 'text-pink-500';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-mono flex">
      {/* Left Panel - Dashboard */}
      <div className="w-[40%] min-w-[320px] p-4 flex flex-col gap-4 border-r border-slate-800/50">
        {/* Header */}
        <div className="glass-panel p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Activity className="w-8 h-8 text-cyan-400" />
              <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                CPU Symphony
              </h1>
              <p className="text-xs text-slate-500">Music from Machines</p>
            </div>

            <div className="ml-auto flex bg-slate-900 rounded-lg p-1 border border-slate-800">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`p-2 rounded-md transition-all ${viewMode === 'dashboard' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                title="Dashboard"
              >
                <Activity size={16} />
              </button>
              <button
                onClick={() => setViewMode('tree')}
                className={`p-2 rounded-md transition-all ${viewMode === 'tree' ? 'bg-slate-800 text-purple-400' : 'text-slate-500 hover:text-slate-300'}`}
                title="Binary Tree"
              >
                <Network size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        {viewMode === 'dashboard' ? (
          <>
            <div className={`glass-panel p-3 flex items-center gap-2 ${isConnected ? 'border-green-500/30' : 'border-red-500/30'}`}>
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-green-400">Connected to CPU Server</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-red-400">
                    {connectionError || 'Disconnected - Reconnecting...'}
                  </span>
                </>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-panel p-4 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Current CPU</p>
                <p className={`text-3xl font-bold ${getCPUColor(currentCPU)} transition-colors`}>
                  {currentCPU.toFixed(1)}%
                </p>
                <Zap className={`w-4 h-4 absolute top-3 right-3 ${currentCPU > 50 ? 'text-pink-500 animate-pulse' : 'text-slate-600'}`} />
              </div>

              <div className="glass-panel p-4 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Peak CPU</p>
                <p className="text-3xl font-bold text-purple-400">
                  {peakCPU.toFixed(1)}%
                </p>
                <BarChart3 className="w-4 h-4 absolute top-3 right-3 text-slate-600" />
              </div>
            </div>

            {/* Live Graph */}
            <div className="glass-panel p-4 h-[180px]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-500 uppercase tracking-wider">CPU History</p>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}`} />
                  <span className="text-xs text-slate-500">{isConnected ? 'Live' : 'Offline'}</span>
                </div>
              </div>

              <div className="h-[calc(100%-2rem)] relative">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="50%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Grid lines */}
                  {[25, 50, 75].map(y => (
                    <line
                      key={y}
                      x1="0"
                      y1={y}
                      x2="100"
                      y2={y}
                      stroke="#334155"
                      strokeWidth="0.5"
                      strokeDasharray="2"
                    />
                  ))}

                  {/* Area fill */}
                  <path
                    d={cpuHistory.length > 0 ? `M 0,${100 - cpuHistory[0]} ${cpuHistory.map((v, i) =>
                      `L ${(i / Math.max(cpuHistory.length - 1, 1)) * 100},${100 - v}`
                    ).join(' ')} L 100,100 L 0,100 Z` : ''}
                    fill="url(#areaGradient)"
                  />

                  {/* Line */}
                  <path
                    d={cpuHistory.length > 0 ? `M 0,${100 - cpuHistory[0]} ${cpuHistory.map((v, i) =>
                      `L ${(i / Math.max(cpuHistory.length - 1, 1)) * 100},${100 - v}`
                    ).join(' ')}` : ''}
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Current point */}
                  <circle
                    cx="100"
                    cy={100 - (cpuHistory[cpuHistory.length - 1] || 0)}
                    r="2"
                    fill="#ec4899"
                  />
                </svg>

                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-slate-600 -ml-1">
                  <span>100</span>
                  <span>50</span>
                  <span>0</span>
                </div>
              </div>
            </div>

            {/* Sheet Music Display */}
            <div className="glass-panel p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-purple-400" />
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Sheet Music</p>
                </div>
                <span className="text-sm text-cyan-400 font-bold">
                  {NOTES[activeNoteIndex]}4
                </span>
              </div>

              {/* Sheet music staff */}
              <div className="relative h-24 bg-slate-900/50 rounded-lg overflow-hidden">
                {/* Treble clef area */}
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-3xl text-slate-600 font-serif select-none">
                  𝄞
                </div>

                {/* Staff lines (5 lines) */}
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  {[0, 1, 2, 3, 4].map(i => (
                    <line
                      key={i}
                      x1="40"
                      y1={20 + i * 16}
                      x2="100%"
                      y2={20 + i * 16}
                      stroke="#475569"
                      strokeWidth="1"
                    />
                  ))}
                </svg>

                {/* Notes on staff - positioned based on note (C=bottom, B=top) */}
                <div className="absolute left-10 right-4 top-0 bottom-0 flex items-center">
                  {NOTES.map((note, i) => {
                    // Position notes on staff (C is lowest, B is highest)
                    // Staff positions: B=line1, A=space1, G=line2, F=space2, E=line3, D=space3, C=line4
                    const notePositions = { C: 84, D: 76, E: 68, F: 60, G: 52, A: 44, B: 36 };
                    const yPos = notePositions[note];
                    const xPos = 40 + (i * ((100 - 40) / NOTES.length)) + 20;

                    return (
                      <div
                        key={note}
                        className="absolute transition-all duration-200"
                        style={{
                          left: `${(i / NOTES.length) * 85 + 12}%`,
                          top: `${yPos - 8}px`,
                        }}
                      >
                        {/* Note head (oval) */}
                        <div
                          className={`w-5 h-4 rounded-full border-2 transition-all duration-150 ${i === activeNoteIndex
                            ? 'bg-cyan-400 border-cyan-400 shadow-lg shadow-cyan-500/50 scale-125'
                            : 'bg-transparent border-slate-500'
                            }`}
                          style={{
                            transform: 'rotate(-20deg)',
                          }}
                        />
                        {/* Note stem */}
                        <div
                          className={`absolute w-0.5 h-8 transition-all duration-150 ${i === activeNoteIndex ? 'bg-cyan-400' : 'bg-slate-500'
                            }`}
                          style={{
                            left: note === 'C' || note === 'D' || note === 'E' ? '16px' : '-2px',
                            top: note === 'C' || note === 'D' || note === 'E' ? '-28px' : '12px',
                          }}
                        />
                        {/* Note letter label */}
                        <span
                          className={`absolute text-[10px] font-bold transition-all duration-150 ${i === activeNoteIndex ? 'text-pink-400' : 'text-slate-600'
                            }`}
                          style={{
                            left: '50%',
                            transform: 'translateX(-50%)',
                            top: note === 'C' || note === 'D' || note === 'E' ? '16px' : '-20px',
                          }}
                        >
                          {note}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Playhead bar */}
                <div
                  className="absolute top-2 bottom-2 w-0.5 bg-gradient-to-b from-pink-500 via-purple-500 to-cyan-400 shadow-lg shadow-pink-500/30 z-20 rounded-full"
                  style={{
                    left: `${10 + barPosition * 0.85}%`,
                    transition: 'left 0.05s linear',
                  }}
                />

                {/* Glow behind playhead */}
                <div
                  className="absolute top-0 bottom-0 w-12 bg-gradient-to-r from-transparent via-pink-500/10 to-transparent z-10"
                  style={{
                    left: `calc(${10 + barPosition * 0.85}% - 1.5rem)`,
                    transition: 'left 0.05s linear',
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="glass-panel p-4 flex-1 flex flex-col justify-center items-center text-center">
            <h3 className="text-xl font-bold mb-2">Binary Tree Mode</h3>
            <p className="text-slate-500">Visualization controls are automated in this mode.</p>
          </div>
        )}
      </div>

      {/* Right Panel - Stage */}
      <div className="w-[60%] p-4 flex flex-col">
        {viewMode === 'tree' ? (
          <div className="glass-panel flex-1 relative overflow-hidden">
            <BinaryTree />
          </div>
        ) : (
          <div className="glass-panel flex-1 relative overflow-hidden">
            {/* Visualizer Active Badge */}
            <div className="absolute top-4 right-4 z-10">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isPlaying
                ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30'
                : 'bg-slate-800/50 border border-slate-700/50'
                }`}>
                <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'
                  }`} />
                <span className={`text-xs font-medium ${isPlaying ? 'text-cyan-400' : 'text-slate-500'
                  }`}>
                  {isPlaying ? 'Visualizer Active' : 'Paused'}
                </span>
              </div>
            </div>

            {/* Algorithm Badge */}
            <div className="absolute top-4 left-4 z-10">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30">
                <span className="text-xs font-medium text-purple-400 uppercase">
                  {selectedAlgorithm} Mode
                </span>
              </div>
            </div>

            {/* Now Playing */}
            <div className="absolute bottom-4 left-4 z-10">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-gradient-to-t from-cyan-400 to-pink-500 rounded-full"
                      style={{
                        height: `${10 + (currentCPU / 100) * 15 + Math.sin(Date.now() / 200 + i) * 5}px`,
                        transition: 'height 0.1s ease-out',
                      }}
                    />
                  ))}
                </div>
                <div>
                  <p className="text-xs text-slate-500">Now Playing</p>
                  <p className="text-sm text-white font-medium">CPU Symphony #{Math.floor(currentCPU)}</p>
                </div>
              </div>
            </div>

            {/* FPS Counter */}
            <div className="absolute bottom-4 right-4 z-10">
              <span className="text-xs text-slate-600">60 FPS</span>
            </div>

            {/* Canvas for Animation */}
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              style={{ background: 'transparent' }}
            />

            {/* Overlay gradient for depth */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-slate-950/30" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/30 via-transparent to-slate-950/30" />
            </div>

            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-cyan-500/30 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-20 h-20 border-r-2 border-t-2 border-purple-500/30 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 border-purple-500/30 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-pink-500/30 rounded-br-lg" />
          </div>
        )}
      </div>
    </div >
  );
}

export default App;
