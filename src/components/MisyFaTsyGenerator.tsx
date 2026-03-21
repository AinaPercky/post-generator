import React, { useState, useRef, useEffect } from 'react';
import { toPng, toJpeg } from 'html-to-image';
import { Upload, Download, RefreshCw, Link as LinkIcon, Wand2, Image as ImageIcon, Copy, Check } from 'lucide-react';

const PRESETS = {
  teknolojia: {
    title: 'TEKNOLOJIA',
    text: 'Ny olona rehetra manana iPhone tsy maintsy manana chargeur fa ny manana chargeur rehetra tsy voatery manana iPhone'
  },
  kolontsaina: {
    title: 'KOLONTSAINA',
    text: 'Ny miss rehetra tsy maintsy manja fa ny manja rehetra tsy voatery ho miss'
  },
  'fanatanjahan-tena': {
    title: 'FANATANJAHAN-TENA',
    text: 'Ny mpanao sport rehetra tsy maintsy mandany hery fa ny olona mandany hery rehetra tsy voatery manao sport'
  },
  fanabeazana: {
    title: 'FANABEAZANA',
    text: 'Ny profesora rehetra tsy maintsy manam-pahaizana fa ny manam-pahaizana rehetra tsy voatery ho profesora'
  },
  'toe-karena': {
    title: 'TOE-KARENA',
    text: 'Ny firenena mandroso rehetra tsy maintsy manana foto-drafitr\'asa fa ny firenena manana foto-drafitr\'asa rehetra tsy voatery mandroso'
  }
};

type Category = keyof typeof PRESETS | 'custom';

export function MisyFaTsyGenerator() {
  const [category, setCategory] = useState<Category>('teknolojia');
  const [title, setTitle] = useState(PRESETS.teknolojia.title);
  const [text, setText] = useState(PRESETS.teknolojia.text);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [filterIntensity, setFilterIntensity] = useState(80);
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);
  const [isDownloadingJpg, setIsDownloadingJpg] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // Fixed square format: 1080x1080
  const SQUARE_SIZE = 1080;
  
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle category change
  useEffect(() => {
    if (category !== 'custom') {
      setTitle(PRESETS[category].title);
      setText(PRESETS[category].text);
    }
  }, [category]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = async (format: 'png' | 'jpeg') => {
    if (!previewRef.current) return;
    
    try {
      if (format === 'png') setIsDownloadingPng(true);
      else setIsDownloadingJpg(true);
      
      // Small delay to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const options = { 
        quality: 0.95, 
        cacheBust: true, 
        pixelRatio: 2,
        width: SQUARE_SIZE,
        height: SQUARE_SIZE,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      };

      const dataUrl = format === 'png' 
        ? await toPng(previewRef.current, options)
        : await toJpeg(previewRef.current, options);
        
      const link = document.createElement('a');
      link.download = `MisyFaTsy-${title.replace(/\s+/g, '-')}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(`Failed to download ${format}`, err);
    } finally {
      setIsDownloadingPng(false);
      setIsDownloadingJpg(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const randomizeFilter = () => {
    setFilterIntensity(Math.floor(Math.random() * 60) + 40); // Random between 40 and 100
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Form */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-neutral-800 shadow-xl text-white">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-misy-lime">
            <Wand2 className="w-5 h-5" />
            MisyFaTsy Studio
          </h2>

          <div className="space-y-5">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Catégorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full bg-[#141414] border border-neutral-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-misy-teal focus:border-misy-teal transition-all outline-none"
              >
                <option value="teknolojia">TEKNOLOJIA</option>
                <option value="kolontsaina">KOLONTSAINA</option>
                <option value="fanatanjahan-tena">FANATANJAHAN-TENA</option>
                <option value="fanabeazana">FANABEAZANA</option>
                <option value="toe-karena">TOE-KARENA</option>
                <option value="custom">Personnalisé</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Titre</label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (category !== 'custom') setCategory('custom');
                }}
                className="w-full bg-[#141414] border border-neutral-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-misy-teal focus:border-misy-teal transition-all outline-none uppercase"
                placeholder="EX: TEKNOLOJIA"
              />
            </div>

            {/* Text */}
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Texte principal</label>
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (category !== 'custom') setCategory('custom');
                }}
                rows={4}
                className="w-full bg-[#141414] border border-neutral-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-misy-teal focus:border-misy-teal transition-all outline-none resize-none"
                placeholder="Ny olona rehetra..."
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Image de fond</label>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 px-4 bg-[#141414] hover:bg-[#1a1a1a] border border-dashed border-neutral-700 hover:border-misy-teal text-neutral-300 rounded-xl transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <Upload className="w-6 h-6 text-neutral-500 group-hover:text-misy-teal transition-colors" />
                <span className="text-sm font-medium">{imageUrl ? 'Changer l\'image' : 'Glisser ou cliquer pour uploader'}</span>
              </button>
            </div>

            {/* Filter Intensity */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-neutral-400">Intensité du filtre bleu</label>
                <span className="text-sm text-misy-teal font-mono">{filterIntensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={filterIntensity}
                onChange={(e) => setFilterIntensity(Number(e.target.value))}
                className="w-full accent-misy-teal"
              />
              <p className="text-xs text-neutral-500 mt-1">Contrôle l'intensité de la teinte bleue de l'image</p>
            </div>

            {/* Format - Fixed Square */}
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Format</label>
              <div className="w-full py-3 px-4 bg-[#141414] border border-neutral-800 rounded-xl text-white text-center font-medium">
                Carré - 1080 × 1080 px
              </div>
            </div>
            
            
            <button
              onClick={randomizeFilter}
              className="w-full py-3 px-4 bg-gradient-to-r from-misy-teal to-misy-baltic hover:opacity-90 text-white font-medium rounded-xl shadow-lg shadow-misy-teal/20 transition-all flex items-center justify-center gap-2"
            >
              <Wand2 className="w-4 h-4" />
              Surprise me (Filtre aléatoire)
            </button>
          </div>
        </div>
        
        {/* Actions */}
        <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-neutral-800 shadow-xl text-white space-y-4">
          <h3 className="text-sm font-medium text-neutral-400 mb-2 uppercase tracking-wider">Exporter</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleDownload('png')}
              disabled={isDownloadingPng}
              className="w-full py-3 px-4 bg-[#141414] hover:bg-[#1a1a1a] border border-neutral-800 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDownloadingPng ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-misy-lime" />}
              PNG HD
            </button>
            <button
              onClick={() => handleDownload('jpeg')}
              disabled={isDownloadingJpg}
              className="w-full py-3 px-4 bg-[#141414] hover:bg-[#1a1a1a] border border-neutral-800 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDownloadingJpg ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-misy-ocean" />}
              JPG
            </button>
          </div>
          <button
            onClick={copyToClipboard}
            className="w-full py-3 px-4 bg-[#141414] hover:bg-[#1a1a1a] border border-neutral-800 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-neutral-400" />}
            {isCopied ? 'Lien copié !' : 'Copier le lien'}
          </button>
        </div>
      </div>

      {/* Right Column: Preview */}
      <div className="lg:col-span-8 flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-4 px-2">
          <span className="text-sm font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            Live Preview
          </span>
          <span className="text-sm text-neutral-400 font-mono">{SQUARE_SIZE} × {SQUARE_SIZE}</span>
        </div>

        {/* Square container for preview */}
        <div className="w-full bg-[#0a0a0a] rounded-2xl border border-neutral-800 flex items-center justify-center p-4 md:p-8">
          {/* Wrapper that maintains aspect ratio and fits content */}
          <div 
            className="relative w-full shadow-2xl"
            style={{ 
              maxWidth: '700px',
              aspectRatio: '1 / 1',
              background: 'black'
            }}
          >
            {/* Scaled content wrapper - scales to fit parent */}
            <div 
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${SQUARE_SIZE}px`, 
                height: `${SQUARE_SIZE}px`,
                transform: `scale(${700 / SQUARE_SIZE})`,
                transformOrigin: 'top left'
              }}
            >
              {/* This wrapper is what gets exported */}
              <div 
                ref={previewRef}
                className="w-full h-full relative overflow-hidden font-sans flex flex-col"
                style={{ width: `${SQUARE_SIZE}px`, height: `${SQUARE_SIZE}px` }}
              >
                {/* 1. Background Image */}
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt="Background" 
                    className="absolute inset-0 w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
                    <ImageIcon className="w-24 h-24 text-neutral-800" />
                  </div>
                )}

                {/* 2. Artistic Gradient Overlay - Stronger on left & bottom */}
                <div 
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(to right, rgba(30, 41, 82, 0.6) 0%, rgba(30, 41, 82, 0.3) 50%, transparent 100%)`,
                    mixBlendMode: 'multiply'
                  }}
                ></div>
                
                {/* 3. Bottom gradient overlay for text readability */}
                <div 
                  className="absolute bottom-0 left-0 right-0"
                  style={{
                    height: '300px',
                    background: `linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 100%)`,
                    mixBlendMode: 'darken'
                  }}
                ></div>

                {/* 4. Color overlay based on filter intensity */}
                <div 
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, var(--color-misy-yale) 0%, var(--color-misy-baltic) 50%)`,
                    opacity: (filterIntensity / 100) * 0.15,
                    mixBlendMode: 'overlay'
                  }}
                ></div>

                {/* 5. Decorative Chains (subtle) */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-4">
                  <LinkIcon className="absolute top-20 right-40 w-64 h-64 text-white transform rotate-45" strokeWidth={0.5} />
                  <LinkIcon className="absolute bottom-40 right-32 w-48 h-48 text-white transform -rotate-12" strokeWidth={0.5} />
                </div>

                {/* 4. Content Container - Positioned layout matching image style */}
                
                {/* Title - Top Left, Gray & Muted */}
                <div className="absolute top-6 left-8 right-8">
                  <h1 className="text-gray-400 font-bold tracking-tight uppercase leading-tight"
                      style={{ 
                        fontSize: '36px',
                        textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                        opacity: 0.7
                      }}>
                    {title}
                  </h1>
                </div>

                {/* Main Content Band - Positioned on left-center area */}
                <div className="absolute bottom-24 left-8 right-16 z-10">
                  {/* "MISY FA TSY..." Label */}
                  <div className="bg-misy-baltic text-white font-bold px-5 py-2 text-lg tracking-wider shadow-lg mb-3 inline-block">
                    MISY FA TSY...
                  </div>

                  {/* Text Content - Below label */}
                  <div className="max-w-2xl">
                    <p className="text-white font-medium leading-tight italic"
                       style={{ 
                         fontSize: '38px',
                         textShadow: '0 3px 15px rgba(0,0,0,0.7)',
                         wordWrap: 'break-word'
                       }}>
                      {text}
                    </p>
                  </div>
                </div>

                {/* Subtle Vignette Effect */}
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]"></div>
                {/* Subtle Neon Border */}
                <div className="absolute inset-0 pointer-events-none border-[1px] border-white/10 mix-blend-overlay"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Gallery of examples */}
        <div className="w-full mt-8">
          <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">Galerie d'exemples</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(PRESETS).filter(([k]) => k !== 'toe-karena').map(([key, preset]) => (
              <button
                key={key}
                onClick={() => setCategory(key as Category)}
                className={`text-left p-4 rounded-xl border transition-all ${category === key ? 'bg-[#1a1a1a] border-misy-teal' : 'bg-[#0a0a0a] border-neutral-800 hover:border-neutral-600'}`}
              >
                <h4 className="text-white font-bold text-sm mb-1 truncate">{preset.title}</h4>
                <p className="text-neutral-500 text-xs line-clamp-2">{preset.text}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
