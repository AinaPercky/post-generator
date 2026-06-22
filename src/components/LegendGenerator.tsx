import React, { useState, useRef, useEffect } from 'react';
import { Download, Loader as Loader2, Image as ImageIcon, Save, Sword, Compass, BookOpen, Palette, Sparkles, Brain, Crown, Dumbbell } from 'lucide-react';
import { toPng, toJpeg } from 'html-to-image';
import { auth } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { SavedPost, LegendCard } from '../types';
import { savePost, getNextLegendCardNumber } from '../lib/postService';

const CANVAS_W = 1080;
const CANVAS_H = 1350;

const CLASSES: LegendCard['characterClass'][] = ['Guerrier', 'Explorateur', 'Savant', 'Artiste', 'Fictionnel', 'Penseur', 'Dirigeant', 'Athlete'];
const RARITIES: LegendCard['rarity'][] = ['Commun', 'Rare', 'Epique', 'Legendaire', 'Mythique'];

const CLASS_CONFIG: Record<LegendCard['characterClass'], { color: string; bgColor: string; icon: React.ComponentType<any> }> = {
  Guerrier: { color: '#ef4444', bgColor: 'linear-gradient(135deg, #1a0505 0%, #2d0a0a 50%, #1a0505 100%)', icon: Sword },
  Explorateur: { color: '#22c55e', bgColor: 'linear-gradient(135deg, #051a0d 0%, #0a2d15 50%, #051a0d 100%)', icon: Compass },
  Savant: { color: '#3b82f6', bgColor: 'linear-gradient(135deg, #050a1a 0%, #0a152d 50%, #050a1a 100%)', icon: BookOpen },
  Artiste: { color: '#ec4899', bgColor: 'linear-gradient(135deg, #1a0510 0%, #2d0a1a 50%, #1a0510 100%)', icon: Palette },
  Fictionnel: { color: '#a855f7', bgColor: 'linear-gradient(135deg, #0f051a 0%, #1a0a2d 50%, #0f051a 100%)', icon: Sparkles },
  Penseur: { color: '#eab308', bgColor: 'linear-gradient(135deg, #1a1505 0%, #2d250a 50%, #1a1505 100%)', icon: Brain },
  Dirigeant: { color: '#f97316', bgColor: 'linear-gradient(135deg, #1a0f05 0%, #2d1a0a 50%, #1a0f05 100%)', icon: Crown },
  Athlete: { color: '#14b8a6', bgColor: 'linear-gradient(135deg, #051a17 0%, #0a2d28 50%, #051a17 100%)', icon: Dumbbell },
};

const RARITY_CONFIG: Record<LegendCard['rarity'], { glow: string; border: string; bg: string }> = {
  Commun: { glow: 'rgba(150,150,150,0.3)', border: '#6b7280', bg: 'rgba(80,80,80,0.15)' },
  Rare: { glow: 'rgba(59,130,246,0.4)', border: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  Epique: { glow: 'rgba(168,85,247,0.5)', border: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
  Legendaire: { glow: 'rgba(234,179,8,0.5)', border: '#eab308', bg: 'rgba(234,179,8,0.15)' },
  Mythique: { glow: 'rgba(239,68,68,0.6)', border: '#ef4444', bg: 'rgba(239,68,68,0.2)' },
};

const initialCard: LegendCard = {
  name: 'Character Name',
  surname: 'The Title',
  era: '20th Century',
  origin: 'Unknown',
  characterClass: 'Guerrier',
  rarity: 'Commun',
  specialties: ['Skill 1', 'Skill 2', 'Skill 3'],
  keyAchievement: 'Greatest achievement description goes here.',
  flaw: 'Character flaw or weakness.',
  quote: 'A memorable quote or saying.',
  portraitUrl: null,
  cardNumber: 1,
};

export function LegendGenerator() {
  const [user, setUser] = useState<User | null>(null);
  const [card, setCard] = useState<LegendCard>(initialCard);
  const [nextCardNumber, setNextCardNumber] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    getNextLegendCardNumber().then(num => {
      setNextCardNumber(num);
      setCard(prev => ({ ...prev, cardNumber: num }));
    });
  }, []);

  const handleFieldChange = (field: keyof LegendCard, value: string | number) => {
    setCard(prev => ({ ...prev, [field]: value }));
  };

  const handleSpecialtyChange = (index: number, value: string) => {
    setCard(prev => {
      const newSpecialties = [...prev.specialties] as [string, string, string];
      newSpecialties[index] = value;
      return { ...prev, specialties: newSpecialties };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (ev.target?.result) {
        setCard(prev => ({ ...prev, portraitUrl: ev.target.result as string }));
      }
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
      a.download = `legend-${card.name.replace(/\s+/g, '-')}-${card.cardNumber}.${format}`;
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
    if (!card.portraitUrl) { setSaveError('Please upload a portrait image'); return; }
    setIsSaving(true);
    setSaveError(null);
    try {
      await new Promise(r => setTimeout(r, 100));
      const imageData = await toPng(previewRef.current!, { ...exportOptions, quality: 0.95 });
      const post: SavedPost = {
        type: 'legend',
        title: `${card.name} - ${card.surname}`,
        imageUrl: imageData,
        authorName: user.displayName || 'Anonymous',
        metadata: {
          firebaseUid: user.uid,
          card: { ...card, portraitUrl: '' },
        },
      };
      await savePost(post);
      alert('Card saved successfully!');
      const nextNum = await getNextLegendCardNumber();
      setNextCardNumber(nextNum);
      setCard(prev => ({ ...prev, cardNumber: nextNum }));
    } catch (err: any) {
      setSaveError(err?.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const classConfig = CLASS_CONFIG[card.characterClass];
  const rarityConfig = RARITY_CONFIG[card.rarity];
  const ClassIcon = classConfig.icon;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#0a0a0a] text-white min-h-[calc(100vh-4rem)] p-6 rounded-2xl font-sans">
      {/* Controls */}
      <div className="lg:col-span-5 flex flex-col gap-5 overflow-y-auto max-h-[calc(100vh-6rem)] pr-2">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            Legend Card Generator
          </h2>
          <p className="text-neutral-400 text-sm">Create stunning character trading cards.</p>
        </div>

        {/* Basic Info */}
        <div className="bg-[#141414] p-5 rounded-xl border border-neutral-800 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">Basic Info</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-500 mb-1 uppercase">Name</label>
              <input
                type="text"
                value={card.name}
                onChange={e => handleFieldChange('name', e.target.value)}
                className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1 uppercase">Surname/Title</label>
              <input
                type="text"
                value={card.surname}
                onChange={e => handleFieldChange('surname', e.target.value)}
                className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-500 mb-1 uppercase">Era</label>
              <input
                type="text"
                value={card.era}
                onChange={e => handleFieldChange('era', e.target.value)}
                className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1 uppercase">Origin</label>
              <input
                type="text"
                value={card.origin}
                onChange={e => handleFieldChange('origin', e.target.value)}
                className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Class & Rarity */}
        <div className="bg-[#141414] p-5 rounded-xl border border-neutral-800 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">Class & Rarity</h3>

          <div>
            <label className="block text-xs text-neutral-500 mb-2 uppercase">Character Class</label>
            <div className="grid grid-cols-4 gap-2">
              {CLASSES.map(cls => {
                const cfg = CLASS_CONFIG[cls];
                const IconComp = cfg.icon;
                return (
                  <button
                    key={cls}
                    onClick={() => handleFieldChange('characterClass', cls)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                      card.characterClass === cls
                        ? 'border-current shadow-lg'
                        : 'border-neutral-800 hover:border-neutral-600'
                    }`}
                    style={{ borderColor: card.characterClass === cls ? cfg.color : undefined }}
                  >
                    <IconComp size={18} style={{ color: cfg.color }} />
                    <span className="text-[10px] text-neutral-400">{cls}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs text-neutral-500 mb-2 uppercase">Rarity</label>
            <div className="flex flex-wrap gap-2">
              {RARITIES.map(rarity => {
                const cfg = RARITY_CONFIG[rarity];
                return (
                  <button
                    key={rarity}
                    onClick={() => handleFieldChange('rarity', rarity)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      card.rarity === rarity
                        ? 'shadow-lg'
                        : 'border-neutral-800 text-neutral-400 hover:border-neutral-600'
                    }`}
                    style={{
                      borderColor: card.rarity === rarity ? cfg.border : undefined,
                      backgroundColor: card.rarity === rarity ? cfg.bg : 'transparent',
                      color: card.rarity === rarity ? cfg.border : undefined,
                      boxShadow: card.rarity === rarity ? `0 0 15px ${cfg.glow}` : undefined,
                    }}
                  >
                    {rarity}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Portrait */}
        <div className="bg-[#141414] p-5 rounded-xl border border-neutral-800 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">Portrait</h3>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-40 bg-[#0a0a0a] border border-dashed border-neutral-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-all overflow-hidden"
          >
            {card.portraitUrl ? (
              <img src={card.portraitUrl} alt="Portrait" className="w-full h-full object-cover" />
            ) : (
              <>
                <ImageIcon className="w-10 h-10 text-neutral-600 mb-2" />
                <span className="text-xs text-neutral-500">Click to upload portrait</span>
              </>
            )}
          </div>
        </div>

        {/* Specialties */}
        <div className="bg-[#141414] p-5 rounded-xl border border-neutral-800 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">Specialties (3)</h3>
          {card.specialties.map((spec, i) => (
            <div key={i}>
              <label className="block text-xs text-neutral-500 mb-1 uppercase">Specialty {i + 1}</label>
              <input
                type="text"
                value={spec}
                onChange={e => handleSpecialtyChange(i, e.target.value)}
                className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none"
              />
            </div>
          ))}
        </div>

        {/* Details */}
        <div className="bg-[#141414] p-5 rounded-xl border border-neutral-800 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">Details</h3>

          <div>
            <label className="block text-xs text-neutral-500 mb-1 uppercase">Key Achievement</label>
            <textarea
              value={card.keyAchievement}
              onChange={e => handleFieldChange('keyAchievement', e.target.value)}
              rows={2}
              className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-500 mb-1 uppercase">Flaw / Weakness</label>
            <textarea
              value={card.flaw}
              onChange={e => handleFieldChange('flaw', e.target.value)}
              rows={2}
              className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-500 mb-1 uppercase">Quote</label>
            <textarea
              value={card.quote}
              onChange={e => handleFieldChange('quote', e.target.value)}
              rows={2}
              className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none resize-none italic"
            />
          </div>
        </div>

        {/* Card Number */}
        <div className="bg-[#141414] p-4 rounded-xl border border-neutral-800">
          <label className="block text-xs text-neutral-500 mb-1 uppercase">Card Number (Auto)</label>
          <input
            type="number"
            value={card.cardNumber}
            onChange={e => handleFieldChange('cardNumber', parseInt(e.target.value) || 1)}
            className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none"
          />
          <p className="text-[10px] text-neutral-600 mt-1">Next available: #{nextCardNumber}</p>
        </div>

        {saveError && (
          <div className="p-3 bg-red-900/50 text-red-200 text-sm rounded-lg border border-red-800">{saveError}</div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 pb-8">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleDownload('png')}
              disabled={isDownloading}
              className="w-full py-2.5 px-4 bg-[#1a1a1a] hover:bg-[#222] border border-neutral-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              PNG
            </button>
            <button
              onClick={() => handleDownload('jpg')}
              disabled={isDownloading}
              className="w-full py-2.5 px-4 bg-[#1a1a1a] hover:bg-[#222] border border-neutral-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              JPEG
            </button>
          </div>
          <button
            onClick={handleSaveToLibrary}
            disabled={isSaving}
            className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {user ? 'Save to Library' : 'Sign in to Save'}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="lg:col-span-7 flex justify-center items-start overflow-auto">
        <div
          ref={containerRef}
          className="w-full max-w-[420px] xl:max-w-[460px] aspect-[4/5] relative border border-neutral-800 rounded-xl overflow-hidden shadow-2xl"
        >
          <div
            ref={previewRef}
            style={{
              position: 'absolute', top: 0, left: 0,
              width: `${CANVAS_W}px`,
              height: `${CANVAS_H}px`,
              transform: `scale(${previewScale})`,
              transformOrigin: 'top left',
              background: classConfig.bgColor,
              fontFamily: 'Inter, system-ui, sans-serif',
              overflow: 'hidden',
            }}
          >
            {/* Background glow based on rarity */}
            <div style={{
              position: 'absolute', top: '-20%', left: '-20%', right: '-20%', bottom: '-20%',
              background: `radial-gradient(ellipse at 30% 20%, ${rarityConfig.glow} 0%, transparent 50%),
                           radial-gradient(ellipse at 70% 80%, ${rarityConfig.glow} 0%, transparent 50%)`,
              pointerEvents: 'none',
            }} />

            {/* Mythique special effect */}
            {card.rarity === 'Mythique' && (
              <>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none',
                  background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.02) 10px, rgba(255,255,255,0.02) 20px)' }} />
                {[[100, 200], [900, 150], [200, 800], [850, 900], [500, 400]].map(([x, y], i) => (
                  <div key={i} style={{
                    position: 'absolute', left: x, top: y,
                    width: 4, height: 4, borderRadius: '50%',
                    background: '#fff',
                    boxShadow: '0 0 10px #fff, 0 0 20px #ef4444',
                  }} />
                ))}
              </>
            )}

            {/* Card frame border */}
            <div style={{
              position: 'absolute',
              top: 20, left: 20, right: 20, bottom: 20,
              borderRadius: 24,
              border: `3px solid ${rarityConfig.border}`,
              boxShadow: `0 0 40px ${rarityConfig.glow}, inset 0 0 60px ${rarityConfig.bg}`,
              pointerEvents: 'none',
            }} />

            {/* Header */}
            <div style={{ textAlign: 'center', paddingTop: 50 }}>
              {/* Card number badge */}
              <div style={{
                position: 'absolute', top: 35, right: 45,
                background: 'rgba(0,0,0,0.6)',
                border: `2px solid ${rarityConfig.border}`,
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 18,
                fontWeight: 700,
                color: rarityConfig.border,
                boxShadow: `0 0 15px ${rarityConfig.glow}`,
              }}>
                #{card.cardNumber}
              </div>

              {/* Class icon */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 60, height: 60, borderRadius: 16,
                background: 'rgba(0,0,0,0.5)',
                border: `2px solid ${classConfig.color}`,
                boxShadow: `0 0 20px ${classConfig.color}50`,
                marginBottom: 12,
              }}>
                <ClassIcon size={32} style={{ color: classConfig.color }} />
              </div>

              {/* Name */}
              <div style={{
                fontSize: 56,
                fontWeight: 900,
                letterSpacing: '-1px',
                color: '#fff',
                textShadow: `0 0 30px ${rarityConfig.glow}`,
                textTransform: 'uppercase',
              }}>
                {card.name}
              </div>

              {/* Surname */}
              <div style={{
                fontSize: 28,
                fontWeight: 600,
                fontStyle: 'italic',
                color: classConfig.color,
                marginTop: 4,
              }}>
                {card.surname}
              </div>

              {/* Era & Origin tags */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
                <span style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: `1px solid ${classConfig.color}50`,
                  borderRadius: 20,
                  padding: '6px 16px',
                  fontSize: 14,
                  color: '#aaa',
                }}>
                  {card.era}
                </span>
                <span style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: `1px solid ${classConfig.color}50`,
                  borderRadius: 20,
                  padding: '6px 16px',
                  fontSize: 14,
                  color: '#aaa',
                }}>
                  {card.origin}
                </span>
              </div>
            </div>

            {/* Portrait area */}
            <div style={{
              margin: '30px 60px',
              height: 320,
              borderRadius: 16,
              background: 'rgba(0,0,0,0.6)',
              border: `2px solid ${classConfig.color}40`,
              boxShadow: `inset 0 0 40px rgba(0,0,0,0.8)`,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {card.portraitUrl ? (
                <img src={card.portraitUrl} alt="Portrait" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <ImageIcon size={64} style={{ color: '#333' }} />
              )}
            </div>

            {/* Rarity indicator bar */}
            <div style={{
              margin: '0 60px',
              height: 4,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.1)',
            }}>
              <div style={{
                width: `${(RARITIES.indexOf(card.rarity) + 1) * 20}%`,
                height: '100%',
                borderRadius: 2,
                background: `linear-gradient(90deg, ${rarityConfig.border}, ${classConfig.color})`,
                boxShadow: `0 0 10px ${rarityConfig.glow}`,
              }} />
            </div>

            {/* Specialties */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 12,
              marginTop: 20,
              padding: '0 40px',
            }}>
              {card.specialties.map((spec, i) => (
                <div key={i} style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: `1px solid ${classConfig.color}60`,
                  borderRadius: 12,
                  padding: '8px 16px',
                  fontSize: 14,
                  color: '#ddd',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 200,
                }}>
                  {spec}
                </div>
              ))}
            </div>

            {/* Achievement & Flaw */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              margin: '24px 40px 0',
            }}>
              <div style={{
                background: 'rgba(34,197,94,0.15)',
                border: '1px solid rgba(34,197,94,0.4)',
                borderRadius: 12,
                padding: 16,
              }}>
                <div style={{ fontSize: 11, color: '#22c55e', marginBottom: 6, fontWeight: 600 }}>ACHIEVEMENT</div>
                <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.4 }}>{card.keyAchievement}</div>
              </div>
              <div style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: 12,
                padding: 16,
              }}>
                <div style={{ fontSize: 11, color: '#ef4444', marginBottom: 6, fontWeight: 600 }}>FLAW</div>
                <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.4 }}>{card.flaw}</div>
              </div>
            </div>

            {/* Quote */}
            <div style={{
              margin: '20px 50px 0',
              padding: '16px 20px',
              background: 'rgba(0,0,0,0.4)',
              borderLeft: `3px solid ${classConfig.color}`,
              borderRadius: '0 12px 12px 0',
            }}>
              <div style={{
                fontSize: 16,
                fontStyle: 'italic',
                color: '#fff',
                lineHeight: 1.4,
              }}>
                "{card.quote}"
              </div>
            </div>

            {/* Footer */}
            <div style={{
              position: 'absolute',
              bottom: 35,
              left: 50,
              right: 50,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 4,
                  background: rarityConfig.border,
                  boxShadow: `0 0 10px ${rarityConfig.glow}`,
                }} />
                <span style={{ fontSize: 14, color: rarityConfig.border, fontWeight: 600 }}>{card.rarity}</span>
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>
                LEGEND · {card.characterClass.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
