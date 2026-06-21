import React, { useState, useRef, useEffect } from 'react';
import { Download, Loader as Loader2, Image as ImageIcon, Sun, TrendingUp, Star, Target, Crown } from 'lucide-react';
import { toPng, toJpeg } from 'html-to-image';
import { auth } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { SavedPost } from '../types';
import { savePost } from '../lib/postService';

const CANVAS_W = 1080;
const CANVAS_H = 1620;

const rankConfig: Record<number, { color: string; glow: string; Icon: React.ComponentType<any> }> = {
  5: { color: '#F97316', glow: 'rgba(249,115,22,0.55)', Icon: Sun },
  4: { color: '#F59E0B', glow: 'rgba(245,158,11,0.55)', Icon: TrendingUp },
  3: { color: '#EAB308', glow: 'rgba(234,179,8,0.55)',  Icon: Star },
  2: { color: '#84CC16', glow: 'rgba(132,204,22,0.55)', Icon: Target },
  1: { color: '#22C55E', glow: 'rgba(34,197,94,0.65)',  Icon: Crown },
};

const cardSizes: Record<number, { cardH: number; imgSize: number; badgeSize: number; rankFont: number; titleFont: number; descFont: number; barW: number }> = {
  5: { cardH: 222, imgSize: 174, badgeSize: 44, rankFont: 110, titleFont: 34, descFont: 22, barW: 120 },
  4: { cardH: 222, imgSize: 174, badgeSize: 44, rankFont: 110, titleFont: 34, descFont: 22, barW: 120 },
  3: { cardH: 238, imgSize: 188, badgeSize: 48, rankFont: 122, titleFont: 36, descFont: 22, barW: 130 },
  2: { cardH: 258, imgSize: 206, badgeSize: 52, rankFont: 136, titleFont: 38, descFont: 23, barW: 140 },
  1: { cardH: 290, imgSize: 234, badgeSize: 58, rankFont: 156, titleFont: 42, descFont: 24, barW: 160 },
};

function hexToRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : '255,255,255';
}

export function Top5Generator() {
  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [categorySubtitle, setCategorySubtitle] = useState('YOUR CATEGORY HERE');

  const initialItems = [5, 4, 3, 2, 1].map(rank => ({
    rank,
    title: 'YOUR ITEM TITLE HERE',
    description: 'Your short description or key metric goes here. Keep it simple and easy to understand.',
    imageUrl: null as string | null,
  }));

  const [items, setItems] = useState(initialItems);

  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [previewScale, setPreviewScale] = useState(0.42);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setPreviewScale(e.contentRect.width / CANVAS_W);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return unsub;
  }, []);

  const handleItemChange = (index: number, field: string, value: string) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (ev.target?.result) handleItemChange(index, 'imageUrl', ev.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const exportOptions = {
    cacheBust: true,
    pixelRatio: 2,
    width: CANVAS_W,
    height: CANVAS_H,
    style: { transform: 'scale(1)', transformOrigin: 'top left' },
  };

  const handleDownload = async (format: 'png' | 'jpg') => {
    if (!previewRef.current) return;
    try {
      setIsDownloading(true);
      await new Promise(r => setTimeout(r, 100));
      const dataUrl = format === 'jpg'
        ? await toJpeg(previewRef.current, { ...exportOptions, quality: 0.95 })
        : await toPng(previewRef.current, { ...exportOptions, quality: 0.95 });
      const a = document.createElement('a');
      a.download = `top-5-${Date.now()}.${format}`;
      a.href = dataUrl;
      a.click();
    } catch (err) {
      console.error('Download failed', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!user) { setSaveError('Please sign in to save posts'); return; }
    if (!items.every(i => i.imageUrl)) { setSaveError('Please upload an image for all 5 ranks.'); return; }
    setIsSaving(true);
    setSaveError(null);
    try {
      await new Promise(r => setTimeout(r, 100));
      const imageData = await toPng(previewRef.current!, { ...exportOptions, quality: 0.95 });
      const post: SavedPost = {
        type: 'top5',
        title: `Top 5: ${categorySubtitle}`,
        imageUrl: imageData,
        authorName: user.displayName || 'Anonymous',
        metadata: {
          firebaseUid: user.uid,
          categorySubtitle,
          items: items.map(i => ({ ...i, imageUrl: '' })),
        },
      };
      await savePost(post);
      alert('Saved successfully!');
    } catch (err: any) {
      setSaveError(err?.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#0a0a0a] text-white min-h-[calc(100vh-4rem)] p-6 rounded-2xl font-sans">
      {/* Controls */}
      <div className="lg:col-span-5 flex flex-col gap-5 overflow-y-auto max-h-[calc(100vh-6rem)] pr-2">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            Top 5 Generator
          </h2>
          <p className="text-neutral-400 text-sm">Create breathtaking Top 5 rankings.</p>
        </div>

        <div className="bg-[#141414] p-5 rounded-xl border border-neutral-800">
          <label className="block text-xs text-neutral-500 mb-2 uppercase tracking-wider">Category Subtitle</label>
          <textarea
            value={categorySubtitle}
            onChange={e => setCategorySubtitle(e.target.value)}
            rows={2}
            className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
            placeholder="YOUR CATEGORY HERE"
          />
        </div>

        <div className="space-y-4">
          {items.map((item, index) => {
            const cfg = rankConfig[item.rank];
            return (
              <div key={item.rank} className="bg-[#141414] p-4 rounded-xl border border-neutral-800">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <span style={{ color: cfg.color }}>#{item.rank}</span>
                  <span className="text-neutral-400">Item Details</span>
                </h3>
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Photo</label>
                    <input type="file" accept="image/*" className="hidden" ref={el => fileInputRefs.current[index] = el} onChange={e => handleImageUpload(index, e)} />
                    <div onClick={() => fileInputRefs.current[index]?.click()} className="w-20 h-20 bg-[#0a0a0a] border border-neutral-800 rounded-lg flex items-center justify-center cursor-pointer hover:border-emerald-500 transition-all overflow-hidden">
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                        : <ImageIcon className="w-6 h-6 text-neutral-600" />}
                    </div>
                  </div>
                  <div className="flex-grow flex flex-col gap-2">
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Title</label>
                      <input type="text" value={item.title} onChange={e => handleItemChange(index, 'title', e.target.value)} className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-1.5 text-white focus:border-emerald-500 outline-none text-sm" placeholder="YOUR ITEM TITLE HERE" />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Description</label>
                      <textarea value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} rows={2} className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-1.5 text-white focus:border-emerald-500 outline-none text-sm resize-none" placeholder="Short description..." />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {saveError && <div className="p-3 bg-red-900/50 text-red-200 text-sm rounded-lg border border-red-800">{saveError}</div>}

        <div className="flex flex-col gap-3 pb-8">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleDownload('png')} disabled={isDownloading} className="w-full py-2.5 px-4 bg-[#1a1a1a] hover:bg-[#222] border border-neutral-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PNG
            </button>
            <button onClick={() => handleDownload('jpg')} disabled={isDownloading} className="w-full py-2.5 px-4 bg-[#1a1a1a] hover:bg-[#222] border border-neutral-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} JPEG
            </button>
          </div>
          <button onClick={handleSaveToLibrary} disabled={isSaving} className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <SaveIcon />}
            {user ? 'Save to Library' : 'Sign in to Save'}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="lg:col-span-7 flex justify-center items-start overflow-auto">
        <div
          ref={containerRef}
          className="w-full max-w-[420px] xl:max-w-[460px] aspect-[2/3] relative border border-neutral-800 rounded-xl overflow-hidden shadow-2xl"
        >
          {/* Scaled canvas */}
          <div
            ref={previewRef}
            className="absolute top-0 left-0 origin-top-left"
            style={{
              width: `${CANVAS_W}px`,
              height: `${CANVAS_H}px`,
              transform: `scale(${previewScale})`,
              background: '#07080F',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            {/* Arc glow at top */}
            <div style={{
              position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
              width: '900px', height: '500px',
              background: 'radial-gradient(ellipse at 50% 0%, rgba(80,60,160,0.45) 0%, rgba(30,20,80,0.2) 50%, transparent 75%)',
              pointerEvents: 'none',
            }} />
            {/* Subtle arc border */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', pointerEvents: 'none' }} height="300" viewBox="0 0 1080 300" fill="none">
              <path d="M0 300 Q540 -40 1080 300" stroke="rgba(100,80,200,0.25)" strokeWidth="1.5" fill="none" />
            </svg>

            {/* Scattered sparkle dots */}
            {[
              [120, 380], [960, 420], [55, 680], [1025, 660],
              [80, 920], [1000, 900], [100, 1180], [980, 1150],
              [140, 1420], [940, 1400],
            ].map(([x, y], i) => (
              <div key={i} style={{
                position: 'absolute', left: x, top: y,
                width: 6, height: 6, borderRadius: '50%',
                background: i % 2 === 0 ? 'rgba(255,200,80,0.7)' : 'rgba(200,220,255,0.5)',
                boxShadow: i % 2 === 0 ? '0 0 8px rgba(255,200,80,0.9)' : '0 0 6px rgba(200,220,255,0.8)',
                pointerEvents: 'none',
              }} />
            ))}

            {/* Header */}
            <div style={{ textAlign: 'center', paddingTop: 64, paddingBottom: 32 }}>
              {/* TOP 5 */}
              <div style={{
                fontSize: 148,
                fontWeight: 900,
                fontStyle: 'italic',
                lineHeight: 1,
                letterSpacing: '-4px',
                background: 'linear-gradient(180deg, #ffffff 0%, #d0d0d0 40%, #a0a0a0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
                filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.35)) drop-shadow(0 4px 16px rgba(0,0,0,0.8))',
              }}>
                TOP 5
              </div>

              {/* Category row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginTop: 20 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', boxShadow: '0 0 8px #fff', display: 'inline-block', flexShrink: 0 }} />
                <span style={{
                  fontSize: 28,
                  fontWeight: 700,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: '#e8e8e8',
                  maxWidth: 700,
                  textAlign: 'center',
                  lineHeight: 1.2,
                }}>
                  {categorySubtitle || 'YOUR CATEGORY HERE'}
                </span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', boxShadow: '0 0 8px #fff', display: 'inline-block', flexShrink: 0 }} />
              </div>

              {/* Gradient underline */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                <div style={{
                  width: 260,
                  height: 2,
                  background: 'linear-gradient(90deg, transparent, #a855f7, #ec4899, #38bdf8, transparent)',
                  borderRadius: 2,
                }} />
              </div>
            </div>

            {/* Cards */}
            <div style={{ padding: '0 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {items.map(item => {
                const cfg = rankConfig[item.rank];
                const sz = cardSizes[item.rank];
                const rgb = hexToRgb(cfg.color);
                const IconComp = cfg.Icon;

                return (
                  <div
                    key={item.rank}
                    style={{
                      height: sz.cardH,
                      borderRadius: 18,
                      border: `1.5px solid rgba(${rgb},0.55)`,
                      background: `linear-gradient(135deg, rgba(${rgb},0.06) 0%, rgba(10,12,20,0.98) 60%)`,
                      boxShadow: `0 0 18px rgba(${rgb},0.25), 0 0 6px rgba(${rgb},0.15), inset 0 0 20px rgba(${rgb},0.04)`,
                      display: 'flex',
                      alignItems: 'center',
                      overflow: 'hidden',
                      position: 'relative',
                      flexShrink: 0,
                    }}
                  >
                    {/* Corner glow dots */}
                    <div style={{ position: 'absolute', top: 8, right: 16, width: 5, height: 5, borderRadius: '50%', background: cfg.color, boxShadow: `0 0 8px ${cfg.color}`, opacity: 0.7 }} />
                    <div style={{ position: 'absolute', bottom: 8, right: 50, width: 3, height: 3, borderRadius: '50%', background: cfg.color, boxShadow: `0 0 6px ${cfg.color}`, opacity: 0.5 }} />

                    {/* Image block */}
                    <div style={{ flexShrink: 0, marginLeft: 18, position: 'relative' }}>
                      <div style={{
                        width: sz.imgSize,
                        height: sz.imgSize,
                        borderRadius: 14,
                        overflow: 'hidden',
                        background: '#10131C',
                        border: '1.5px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {item.imageUrl
                          ? <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                          : (
                            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <path d="M21 15l-5-5L5 21" />
                            </svg>
                          )
                        }
                      </div>
                      {/* Circular icon badge */}
                      <div style={{
                        position: 'absolute',
                        top: -10,
                        left: -10,
                        width: sz.badgeSize,
                        height: sz.badgeSize,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, rgba(${rgb},0.25) 0%, rgba(10,12,20,0.95) 100%)`,
                        border: `1.5px solid rgba(${rgb},0.7)`,
                        boxShadow: `0 0 12px rgba(${rgb},0.5), inset 0 0 8px rgba(${rgb},0.15)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <IconComp style={{ width: sz.badgeSize * 0.48, height: sz.badgeSize * 0.48, color: cfg.color, strokeWidth: 2 }} />
                      </div>
                    </div>

                    {/* Rank number */}
                    <div style={{
                      width: sz.rankFont * 0.82,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: 16,
                    }}>
                      <span style={{
                        fontSize: sz.rankFont,
                        fontWeight: 900,
                        fontStyle: 'italic',
                        lineHeight: 1,
                        color: cfg.color,
                        textShadow: `0 0 30px ${cfg.glow}, 0 0 60px rgba(${rgb},0.3)`,
                        letterSpacing: '-2px',
                        userSelect: 'none',
                      }}>
                        {item.rank}
                      </span>
                    </div>

                    {/* Vertical divider */}
                    <div style={{ flexShrink: 0, width: 2, alignSelf: 'stretch', marginTop: 20, marginBottom: 20, marginLeft: 10, position: 'relative' }}>
                      <div style={{
                        width: 2,
                        height: '100%',
                        background: `linear-gradient(180deg, transparent, rgba(${rgb},0.8) 30%, rgba(${rgb},1) 50%, rgba(${rgb},0.8) 70%, transparent)`,
                        boxShadow: `0 0 8px rgba(${rgb},0.6)`,
                        borderRadius: 1,
                      }} />
                      {/* Sparkle on divider */}
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: cfg.color,
                        boxShadow: `0 0 12px ${cfg.color}, 0 0 20px rgba(${rgb},0.5)`,
                      }} />
                    </div>

                    {/* Text content */}
                    <div style={{ flex: 1, paddingLeft: 20, paddingRight: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10, overflow: 'hidden' }}>
                      <div style={{
                        fontSize: sz.titleFont,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: '#ffffff',
                        lineHeight: 1.1,
                        letterSpacing: '0.5px',
                        textShadow: '0 2px 8px rgba(0,0,0,0.7)',
                      }}>
                        {item.title || 'YOUR ITEM TITLE HERE'}
                      </div>
                      {/* Underline bar */}
                      <div style={{
                        width: sz.barW,
                        height: 3,
                        borderRadius: 2,
                        background: `linear-gradient(90deg, ${cfg.color}, transparent)`,
                        boxShadow: `0 0 8px rgba(${rgb},0.5)`,
                      }} />
                      <div style={{
                        fontSize: sz.descFont,
                        color: 'rgba(220,220,230,0.85)',
                        lineHeight: 1.45,
                        fontWeight: 400,
                      }}>
                        {item.description || 'Your short description or key metric goes here.'}
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

function SaveIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}
