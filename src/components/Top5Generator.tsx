import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Loader2, Sparkles, TrendingUp, Star, Target, Crown, Image as ImageIcon } from 'lucide-react';
import { toPng, toJpeg } from 'html-to-image';
import { auth } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { SavedPost } from '../types';
import { savePost, updatePost } from '../lib/postService';

export function Top5Generator() {
  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const [categorySubtitle, setCategorySubtitle] = useState('YOUR CATEGORY HERE');
  
  const initialItems = [
    { rank: 5, title: 'YOUR ITEM TITLE HERE', description: 'Your short description or key metric goes here. Keep it simple and easy to understand.', imageUrl: null as string | null },
    { rank: 4, title: 'YOUR ITEM TITLE HERE', description: 'Your short description or key metric goes here. Keep it simple and easy to understand.', imageUrl: null as string | null },
    { rank: 3, title: 'YOUR ITEM TITLE HERE', description: 'Your short description or key metric goes here. Keep it simple and easy to understand.', imageUrl: null as string | null },
    { rank: 2, title: 'YOUR ITEM TITLE HERE', description: 'Your short description or key metric goes here. Keep it simple and easy to understand.', imageUrl: null as string | null },
    { rank: 1, title: 'YOUR ITEM TITLE HERE', description: 'Your short description or key metric goes here. Keep it simple and easy to understand.', imageUrl: null as string | null },
  ];

  const [items, setItems] = useState(initialItems);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [previewScale, setPreviewScale] = useState(0.5);

  useEffect(() => {
    if (containerRef.current) {
      const ro = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setPreviewScale(entry.contentRect.width / 1080);
        }
      });
      ro.observe(containerRef.current);
      return () => ro.disconnect();
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        handleItemChange(index, 'imageUrl', event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = async (format: 'png' | 'jpg' = 'png') => {
    if (!previewRef.current) return;
    try {
      setIsDownloading(true);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const options = { 
        quality: 0.95, 
        cacheBust: true, 
        pixelRatio: 2,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      };
      const dataUrl = format === 'jpg' 
        ? await toJpeg(previewRef.current, options)
        : await toPng(previewRef.current, options);
        
      const link = document.createElement('a');
      link.download = `top-5-post-${Date.now()}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download image', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!user) {
      setSaveError('Please sign in to save posts');
      return;
    }
    const allImagesPresent = items.every(item => item.imageUrl);
    if (!allImagesPresent) {
      setSaveError('Please ensure all 5 ranks have an image uploaded.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      const options = { 
        quality: 0.95, 
        cacheBust: true, 
        pixelRatio: 2,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      };
      const imageData = await toPng(previewRef.current, options);

      const newPost: SavedPost = {
        type: 'top5',
        title: `Top 5: ${categorySubtitle}`,
        imageUrl: imageData,
        authorName: user.displayName || 'Anonymous',
        metadata: {
          firebaseUid: user.uid,
          categorySubtitle: categorySubtitle,
          items: items.map(item => ({...item, imageUrl: ''})) // don't store base64 in metadata if it's too big, or store if needed
        },
      };

      await savePost(newPost);
      alert('Post saved successfully!');
    } catch (error: any) {
      console.error('Failed to save:', error);
      setSaveError(error?.message || 'Failed to save post');
    } finally {
      setIsSaving(false);
    }
  };

  const rankConfig = {
    5: { colorStr: '#F97316', bgStr: 'rgba(249, 115, 22, 0.1)', Icon: Sparkles },
    4: { colorStr: '#F59E0B', bgStr: 'rgba(245, 158, 11, 0.1)', Icon: TrendingUp },
    3: { colorStr: '#EAB308', bgStr: 'rgba(234, 179, 8, 0.1)', Icon: Star },
    2: { colorStr: '#A3E635', bgStr: 'rgba(163, 230, 53, 0.1)', Icon: Target },
    1: { colorStr: '#4ADE80', bgStr: 'rgba(74, 222, 128, 0.15)', Icon: Crown }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#0a0a0a] text-white min-h-[calc(100vh-4rem)] p-6 rounded-2xl font-sans">
      {/* Left Panel: Controls */}
      <div className="lg:col-span-5 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-6rem)] pr-2">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            Top 5 Generator
          </h2>
          <p className="text-neutral-400 text-sm">Create breathtaking Top 5 rankings.</p>
        </div>

        <div className="bg-[#141414] p-5 rounded-xl border border-neutral-800">
          <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Category Subtitle (Mandatory)</label>
          <input
            type="text"
            value={categorySubtitle}
            onChange={(e) => setCategorySubtitle(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
            placeholder="YOUR CATEGORY HERE"
            required
          />
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.rank} className="bg-[#141414] p-5 rounded-xl border border-neutral-800 flex flex-col gap-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="text-lg" style={{ color: (rankConfig as any)[item.rank].colorStr }}>#{item.rank}</span> 
                Item Details
              </h3>
              
              <div className="flex gap-4">
                {/* Photo Upload */}
                <div className="flex-shrink-0 w-24">
                  <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Photo *</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={el => fileInputRefs.current[index] = el}
                    onChange={(e) => handleImageUpload(index, e)}
                  />
                  <div 
                    onClick={() => fileInputRefs.current[index]?.click()}
                    className="w-24 h-24 bg-[#0a0a0a] border border-neutral-800 rounded-lg flex items-center justify-center cursor-pointer hover:border-emerald-500 transition-all overflow-hidden relative"
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={`Rank ${item.rank}`} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-neutral-600" />
                    )}
                  </div>
                </div>
                
                {/* Text Fields */}
                <div className="flex-grow flex flex-col gap-2">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Title *</label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-1.5 text-white focus:border-emerald-500 outline-none text-sm"
                      placeholder="YOUR ITEM TITLE HERE"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Description (Optional)</label>
                    <textarea
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      rows={2}
                      className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-1.5 text-white focus:border-emerald-500 outline-none text-sm resize-none"
                      placeholder="Short description..."
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {saveError && (
          <div className="p-3 bg-red-900/50 text-red-200 text-sm rounded-lg border border-red-800">
            {saveError}
          </div>
        )}

        <div className="flex flex-col gap-3 mb-8">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleDownload('png')}
              disabled={isDownloading}
              className="w-full py-2.5 px-4 bg-[#1a1a1a] hover:bg-[#222] border border-neutral-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              PNG
            </button>
            <button
              onClick={() => handleDownload('jpg')}
              disabled={isDownloading}
              className="w-full py-2.5 px-4 bg-[#1a1a1a] hover:bg-[#222] border border-neutral-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              JPEG
            </button>
          </div>
          <button
            onClick={handleSaveToLibrary}
            disabled={isSaving}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <SaveIcon />}
            Save to Library
          </button>
        </div>
      </div>

      <div className="lg:col-span-7 flex justify-center items-center overflow-auto min-h-[500px]">
        {/* Responsive wrapper constraining the visual size */}
        <div 
          ref={containerRef}
          className="w-full max-w-[540px] xl:max-w-[600px] aspect-[1080/1620] shrink-0 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl relative"
        >
          
          {/* Virtual 1080x1620 Canvas, perfectly scaled using absolute scaling */}
          <div 
            ref={previewRef}
            className="absolute top-0 left-0 bg-[#0A0D14] flex flex-col origin-top-left"
            style={{ 
              width: '1080px', 
              height: '1620px', 
              transform: `scale(${previewScale})`,
            }}
          >
            {/* Background effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1620px] h-[1620px] opacity-20 pointer-events-none">
              <div className="absolute inset-0 border border-white/20 rounded-full scale-100"></div>
              <div className="absolute inset-0 border border-white/10 rounded-full scale-[0.85]"></div>
              <div className="absolute inset-0 border border-white/5 rounded-full scale-[0.7]"></div>
            </div>
            
            <div className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[1080px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full"></div>

            {/* Header */}
            <div className="relative z-10 pt-20 pb-10 text-center flex flex-col items-center">
              <h1 className="text-[140px] leading-none font-black italic tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] uppercase" style={{ transform: 'skewX(-5deg)' }}>
                TOP 5
              </h1>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_8px_white]"></div>
                <h2 className="text-[20px] tracking-[0.4em] uppercase font-medium text-neutral-300">
                  {categorySubtitle || 'YOUR CATEGORY HERE'}
                </h2>
                <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_8px_white]"></div>
              </div>
              <div className="w-56 h-0.5 mt-4 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mix-blend-screen"></div>
              </div>
            </div>

            {/* List */}
            <div className="relative z-10 flex-grow px-12 flex flex-col gap-6 pb-16 justify-center">
              {items.map((item) => {
                const config = (rankConfig as any)[item.rank];
                const IconComp = config.Icon;
                const isTop1 = item.rank === 1;
                
                return (
                  <div 
                    key={item.rank} 
                    className="relative flex items-center bg-[#0d1219]/80 backdrop-blur-md rounded-2xl border"
                    style={{ 
                      borderColor: `rgba(${hexToRgb(config.colorStr)}, 0.4)`,
                      boxShadow: `0 0 20px ${config.bgStr}, inset 0 0 10px ${config.bgStr}`
                    }}
                  >
                    {item.rank === 1 && (
                      <div className="absolute inset-0 rounded-2xl shadow-[0_0_40px_rgba(74,222,128,0.2)] pointer-events-none"></div>
                    )}

                    <div className={`flex w-full items-stretch relative z-10 ${isTop1 ? 'p-6 gap-8' : 'p-4 gap-6'}`}>
                      
                      {/* Left: Image container */}
                      <div className={`${isTop1 ? 'w-[180px] h-[180px]' : 'w-[140px] h-[140px]'} flex-shrink-0 relative rounded-xl overflow-hidden border border-white/10 bg-[#161a22] shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-12 h-12 text-white/5" />
                          </div>
                        )}
                        
                        {/* Rank Badge overlapping top-left */}
                        <div 
                          className={`absolute -top-1 -left-1 rounded-full flex items-center justify-center border-2 border-[#0A0D14] ${isTop1 ? 'w-12 h-12' : 'w-10 h-10'}`}
                          style={{ 
                            backgroundColor: config.colorStr,
                            boxShadow: `0 0 10px ${config.colorStr}`
                          }}
                        >
                          <IconComp className={`${isTop1 ? 'w-6 h-6' : 'w-5 h-5'} text-[#0A0D14] fill-transparent stroke-[2.5]`} />
                        </div>
                      </div>

                      {/* Rank Number */}
                      <div 
                        className={`${isTop1 ? 'w-[100px]' : 'w-[80px]'} flex-shrink-0 flex items-center justify-center`}
                      >
                        <span 
                          className={`${isTop1 ? 'text-[140px]' : 'text-[100px]'} leading-none font-bold uppercase drop-shadow-md pb-4`}
                          style={{ 
                            color: config.colorStr, 
                            textShadow: `0 0 25px ${config.colorStr}80`,
                            fontFamily: "'Teko', 'Impact', sans-serif" 
                          }}
                        >
                          {item.rank}
                        </span>
                      </div>

                      {/* Right: Content */}
                      <div className={`flex-grow flex flex-col justify-center gap-2 relative ${isTop1 ? 'pr-6' : 'pr-4'}`}>
                        <h3 className={`${isTop1 ? 'text-[42px]' : 'text-[32px]'} leading-tight font-bold uppercase tracking-wide text-white drop-shadow-sm font-sans`} style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                          {item.title || 'YOUR ITEM TITLE HERE'}
                        </h3>
                        
                        <div 
                          className={`h-1.5 rounded-full ${isTop1 ? 'w-16' : 'w-12'}`}
                          style={{ backgroundColor: config.colorStr, boxShadow: `0 0 8px ${config.colorStr}80` }}
                        ></div>
                        
                        <p className="text-white/70 text-[18px] leading-snug font-medium pr-8">
                          {item.description || 'Your short description or key metric goes here. Keep it simple and easy to understand.'}
                        </p>
                        
                        {/* Decorative dots in the background of the card */}
                        {item.rank === 1 && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-32 h-32 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #4ADE80 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>
                        )}
                        {item.rank === 2 && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 text-[#A3E635]">
                             <Target className="w-24 h-24" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component
function SaveIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
  );
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` 
    : '255, 255, 255';
}
