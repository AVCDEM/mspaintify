import React, { useState, useRef, useEffect } from 'react';

// ============================================
// EDIT THESE VALUES TO CUSTOMIZE YOUR DEPLOYMENT
// ============================================
const TOKEN_TICKER = '$MSPAINT';      // your token ticker
const TWITTER_HANDLE = '@mspaintify'; // your X handle (with @)
const SHARE_HASHTAG = '#mspaintify';  // hashtag for shared tweets
// ============================================

export default function MSPaintify() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(6);
  const [tool, setTool] = useState('brush');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  const colors = [
    '#000000', '#ef4444', '#f97316', '#eab308',
    '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
  ];

  const loadingMessages = {
    capturing: 'Looking at your masterpiece...',
    describing: 'Squinting really hard...',
    generating: 'Making it real...',
    finishing: 'Adding the mspaintify touch...',
  };

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Patrick+Hand&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoords(e);
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = tool === 'eraser' ? brushSize * 3 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setResult(null);
    setHasDrawn(false);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!hasDrawn) {
      setError('Draw something first!');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Step 1: Capture canvas
      setLoadingStep(loadingMessages.capturing);
      const canvas = canvasRef.current;
      const base64Data = canvas.toDataURL('image/png').split(',')[1];

      // Step 2: Send to /api/describe (Gemini)
      setLoadingStep(loadingMessages.describing);
      const visionResponse = await fetch('/api/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Data }),
      });

      const visionData = await visionResponse.json();
      if (!visionResponse.ok) {
        throw new Error(visionData.error || 'Could not analyze drawing');
      }

      const description = visionData.description;
      if (!description) throw new Error('No description returned');

      // Step 3: Generate via Pollinations
      setLoadingStep(loadingMessages.generating);
      const fullPrompt = `${description}, photorealistic, highly detailed, professional photography, sharp focus, 4k`;
      const seed = Math.floor(Math.random() * 1000000);
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=768&height=768&nologo=true&seed=${seed}`;

      await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = resolve;
        img.onerror = () => reject(new Error('Image generation failed'));
        img.src = pollinationsUrl;
        setTimeout(() => reject(new Error('Timeout — try again')), 90000);
      });

      // Step 4: Watermark
      setLoadingStep(loadingMessages.finishing);
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = pollinationsUrl;
        });

        const resultCanvas = document.createElement('canvas');
        resultCanvas.width = 768;
        resultCanvas.height = 768;
        const rctx = resultCanvas.getContext('2d');
        rctx.drawImage(img, 0, 0, 768, 768);

        // Watermark box
        rctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        rctx.fillRect(540, 715, 220, 45);
        rctx.strokeStyle = '#000000';
        rctx.lineWidth = 2;
        rctx.strokeRect(540, 715, 220, 45);

        // Watermark text (rainbow)
        rctx.font = 'bold 24px sans-serif';
        rctx.fillStyle = '#000000';
        rctx.fillText('ms', 555, 745);
        const wmColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
        const letters = 'paintify';
        let xPos = 590;
        for (let i = 0; i < letters.length; i++) {
          rctx.fillStyle = wmColors[i % wmColors.length];
          rctx.fillText(letters[i], xPos, 745);
          xPos += rctx.measureText(letters[i]).width + 1;
        }

        setResult(resultCanvas.toDataURL('image/png'));
      } catch (corsErr) {
        // CORS fallback
        setResult(pollinationsUrl);
      }

      setLoadingStep('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Oops, something broke. Try again!');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.download = 'mspaintify.png';
    link.href = result;
    link.click();
  };

  const handleShare = () => {
    const text = `just turned my mspaint masterpiece into a real photo 🎨\n\nmade on ${TWITTER_HANDLE}\n${TOKEN_TICKER} ${SHARE_HASHTAG}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      '_blank'
    );
  };

  const rainbowLetters = (text) => {
    const cs = ['#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444'];
    return text.split('').map((char, i) => (
      <span key={i} style={{ color: i < 2 ? '#000000' : cs[i % cs.length] }}>
        {char}
      </span>
    ));
  };

  return (
    <div
      className="min-h-screen w-full p-4 md:p-8 relative overflow-hidden"
      style={{
        backgroundColor: '#fffbeb',
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 28px, #fde68a 28px, #fde68a 29px)`,
        fontFamily: "'Patrick Hand', cursive",
      }}
    >
      {/* Decorative scribbles */}
      <svg className="absolute top-2 left-2 opacity-60 pointer-events-none" width="80" height="40" viewBox="0 0 80 40">
        <path d="M 5 20 Q 15 5, 25 20 T 45 20 T 65 20 T 80 20" stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
      <svg className="absolute top-2 right-2 opacity-60 pointer-events-none" width="80" height="40" viewBox="0 0 80 40">
        <path d="M 5 20 Q 15 5, 25 20 T 45 20 T 65 20 T 80 20" stroke="#8b5cf6" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
      <svg className="absolute bottom-2 left-2 opacity-60 pointer-events-none" width="80" height="40" viewBox="0 0 80 40">
        <path d="M 5 20 Q 15 5, 25 20 T 45 20 T 65 20 T 80 20" stroke="#22c55e" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
      <svg className="absolute bottom-2 right-2 opacity-60 pointer-events-none" width="80" height="40" viewBox="0 0 80 40">
        <path d="M 5 20 Q 15 5, 25 20 T 45 20 T 65 20 T 80 20" stroke="#eab308" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>

      {/* Header */}
      <header className="text-center mb-6 md:mb-10 relative z-10">
        <h1
          className="text-6xl md:text-8xl leading-none"
          style={{ fontFamily: "'Caveat', cursive", fontWeight: 700 }}
        >
          {rainbowLetters('mspaintify')}
        </h1>
        <p className="text-xl md:text-2xl mt-2 text-gray-700">
          draw like a kid → get a real photo ✨
        </p>
      </header>

      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6 md:gap-8 relative z-10">
        {/* Drawing side */}
        <div>
          <div className="bg-white border-[3px] border-dashed border-black rounded-2xl p-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <canvas
              ref={canvasRef}
              width={512}
              height={512}
              className="w-full aspect-square cursor-crosshair touch-none rounded-lg"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>

          {/* Tools */}
          <div className="mt-4 bg-white border-[3px] border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex gap-2 flex-wrap justify-center">
              {colors.map(c => (
                <button
                  key={c}
                  onClick={() => { setColor(c); setTool('brush'); }}
                  className={`w-10 h-10 rounded-full border-[3px] transition-transform ${color === c && tool === 'brush' ? 'border-black scale-125' : 'border-gray-400 hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-3 mt-4">
              <span className="text-lg">size:</span>
              <input
                type="range"
                min="2"
                max="24"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="flex-1 accent-black"
              />
              <span className="text-lg w-10 text-right">{brushSize}px</span>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setTool('eraser')}
                className={`flex-1 py-2 px-3 border-[3px] border-black rounded-lg text-lg transition-all ${tool === 'eraser' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
              >
                🧽 eraser
              </button>
              <button
                onClick={clearCanvas}
                className="flex-1 py-2 px-3 border-[3px] border-black rounded-lg bg-white hover:bg-red-100 text-lg"
              >
                🗑 clear
              </button>
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="mt-4 w-full py-4 px-6 text-2xl border-[4px] border-black rounded-xl bg-yellow-300 hover:bg-yellow-400 hover:translate-y-[-2px] active:translate-y-[2px] transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ fontFamily: "'Caveat', cursive", fontWeight: 700 }}
          >
            {loading ? loadingStep : '✨ make it real ✨'}
          </button>

          {error && (
            <div className="mt-3 p-3 bg-red-100 border-[3px] border-red-500 rounded-lg text-red-800 text-center text-lg">
              {error}
            </div>
          )}
        </div>

        {/* Result side */}
        <div>
          <div className="bg-white border-[3px] border-dashed border-black rounded-2xl p-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] aspect-square flex items-center justify-center overflow-hidden">
            {result ? (
              <img src={result} alt="generated" className="w-full h-full object-contain rounded-lg" />
            ) : loading ? (
              <div className="text-center px-6">
                <div className="text-6xl animate-bounce mb-4">🎨</div>
                <p className="text-xl text-gray-700">{loadingStep}</p>
                <p className="text-sm text-gray-500 mt-2">(can take 20-40s)</p>
              </div>
            ) : (
              <div className="text-center px-6">
                <div className="text-6xl mb-4 opacity-40">📸</div>
                <p className="text-2xl text-gray-500" style={{ fontFamily: "'Caveat', cursive" }}>
                  your real photo will appear here
                </p>
              </div>
            )}
          </div>

          {result && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={handleDownload}
                className="py-3 px-4 text-xl border-[3px] border-black rounded-xl bg-white hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all"
              >
                ⬇ download
              </button>
              <button
                onClick={handleShare}
                className="py-3 px-4 text-xl border-[3px] border-black rounded-xl bg-black text-white hover:bg-gray-800 shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] hover:translate-y-[-2px] transition-all"
              >
                𝕏 share
              </button>
            </div>
          )}
        </div>
      </div>

      <footer className="text-center mt-10 text-gray-600 text-lg relative z-10">
        <p>made with crayons 🖍 — share your creation with {SHARE_HASHTAG}</p>
        <p className="text-sm mt-1 opacity-70">{TOKEN_TICKER} • {TWITTER_HANDLE}</p>
      </footer>
    </div>
  );
}
