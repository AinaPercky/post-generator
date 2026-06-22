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
const RARITY_STARS: Record<LegendCard['rarity'], number> = {
  Commun: 1, Rare: 2, Epique: 3, Legendaire: 4, Mythique: 5,
};
const RARITY_FR: Record<LegendCard['rarity'], string> = {
  Commun: 'COMMUN', Rare: 'RARE', Epique: 'ÉPIQUE', Legendaire: 'LÉGENDE', Mythique: 'MYTHIQUE',
};
const EDITIONS: Record<LegendCard['rarity'], string> = {
  Commun: '2500', Rare: '1000', Epique: '500', Legendaire: '5000', Mythique: '100',
};

// Class color accent (for header/labels)
const CLASS_ACCENT: Record<LegendCard['characterClass'], string> = {
  Guerrier: '#c0392b',
  Explorateur: '#27ae60',
  Savant: '#2980b9',
  Artiste: '#c0396b',
  Fictionnel: '#8e44ad',
  Penseur: '#c9a84c',
  Dirigeant: '#d35400',
  Athlete: '#16a085',
};

const CLASS_ICONS: Record<LegendCard['characterClass'], React.ComponentType<any>> = {
  Guerrier: Sword,
  Explorateur: Compass,
  Savant: BookOpen,
  Artiste: Palette,
  Fictionnel: Sparkles,
  Penseur: Brain,
  Dirigeant: Crown,
  Athlete: Dumbbell,
};

const initialCard: LegendCard = {
  name: 'NOM DU PENSEUR',
  surname: 'NOM DE RÉFÉRENCE',
  era: 'ÈRE DE LA RÉFLEXION',
  origin: "LIEU DE L'ACADÉMIE",
  characterClass: 'Penseur',
  rarity: 'Legendaire',
  specialties: ['ANALYSE SYSTÉMIQUE', 'VISION PHILOSOPHIQUE', 'TRANSFORMATION SOCIALE'],
  keyAchievement: "UN ÉCRIT MAJEUR OU UNE IDÉE QUI A CHANGÉ LE MONDE",
  flaw: "UNE FAIBLESSE PSYCHOLOGIQUE OU L'INCAPACITÉ D'AGIR",
  quote: "CITATION ARCHÉTYPALE EN FRANÇAIS SUR LA PENSÉE",
  portraitUrl: null,
  cardNumber: 1,
};

// ─────────────────────────────────────────────
//  Decorative SVG components used on the card
// ─────────────────────────────────────────────

function OrnateRing({ size, accent }: { size: number; accent: string }) {
  const cx = size / 2;
  const r1 = size / 2 - 4;
  const r2 = size / 2 - 22;
  const r3 = size / 2 - 34;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', top: 0, left: 0 }}>
      <defs>
        <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9a9a9a" />
          <stop offset="25%" stopColor="#e8e8e8" />
          <stop offset="50%" stopColor="#c0c0c0" />
          <stop offset="75%" stopColor="#a0a0a0" />
          <stop offset="100%" stopColor="#d4d4d4" />
        </linearGradient>
        <linearGradient id="ring-accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.8" />
          <stop offset="100%" stopColor="#d4af37" stopOpacity="0.9" />
        </linearGradient>
        <filter id="ring-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Outer ring - silver metallic */}
      <circle cx={cx} cy={cx} r={r1} fill="none" stroke="url(#ring-grad)" strokeWidth="8" />
      {/* Tick marks around the outer ring */}
      {Array.from({ length: 60 }).map((_, i) => {
        const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const isLarge = i % 5 === 0;
        const rOut = r1 - 1;
        const rIn = rOut - (isLarge ? 12 : 6);
        return (
          <line
            key={i}
            x1={cx + Math.cos(angle) * rOut}
            y1={cx + Math.sin(angle) * rOut}
            x2={cx + Math.cos(angle) * rIn}
            y2={cx + Math.sin(angle) * rIn}
            stroke={isLarge ? accent : '#888'}
            strokeWidth={isLarge ? 2.5 : 1}
            strokeOpacity={isLarge ? 1 : 0.6}
          />
        );
      })}
      {/* Decorative diamonds at 4 cardinal points */}
      {[0, 90, 180, 270].map((deg, i) => {
        const angle = (deg * Math.PI) / 180;
        const rx = cx + Math.cos(angle) * (r1 - 6);
        const ry = cx + Math.sin(angle) * (r1 - 6);
        const pts = [
          `${rx},${ry - 9}`,
          `${rx + 6},${ry}`,
          `${rx},${ry + 9}`,
          `${rx - 6},${ry}`,
        ].join(' ');
        return <polygon key={i} points={pts} fill={accent} opacity="0.9" filter="url(#ring-glow)" />;
      })}
      {/* Inner decorative ring */}
      <circle cx={cx} cy={cx} r={r2} fill="none" stroke="url(#ring-accent)" strokeWidth="3" strokeDasharray="6 4" />
      {/* Innermost thin silver ring */}
      <circle cx={cx} cy={cx} r={r3} fill="none" stroke="#888" strokeWidth="1.5" />
      {/* Scroll ornaments at top and bottom */}
      {[{ angle: -90, label: '❧' }, { angle: 90, label: '❧' }].map(({ angle, label }, i) => {
        const rad = (angle * Math.PI) / 180;
        const tx = cx + Math.cos(rad) * (r1 - 4);
        const ty = cx + Math.sin(rad) * (r1 - 4);
        return (
          <text key={i} x={tx} y={ty + 6} textAnchor="middle" fontSize="22" fill={accent} opacity="0.8">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

function CornerOrnament({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const transforms: Record<string, string> = {
    tl: 'scale(1,1)',
    tr: 'scale(-1,1)',
    bl: 'scale(1,-1)',
    br: 'scale(-1,-1)',
  };
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" style={{
      position: 'absolute',
      top: position.startsWith('t') ? 24 : undefined,
      bottom: position.startsWith('b') ? 24 : undefined,
      left: position.endsWith('l') ? 24 : undefined,
      right: position.endsWith('r') ? 24 : undefined,
    }}>
      <g transform={`translate(${position.endsWith('r') ? 90 : 0}, ${position.startsWith('b') ? 90 : 0}) ${transforms[position]}`}>
        <path d="M4 4 L4 36 Q4 42 10 42 L38 42" stroke="#888" strokeWidth="2" fill="none" />
        <path d="M4 4 L36 4 Q42 4 42 10 L42 38" stroke="#888" strokeWidth="2" fill="none" />
        <circle cx="4" cy="4" r="4" fill="#c9a84c" opacity="0.8" />
        <circle cx="42" cy="42" r="2" fill="#c9a84c" opacity="0.6" />
        <path d="M8 8 L8 30 Q8 36 14 36 L34 36" stroke="#c9a84c" strokeWidth="1" fill="none" opacity="0.4" />
      </g>
    </svg>
  );
}

function SideKnot({ side }: { side: 'left' | 'right' }) {
  return (
    <svg
      width="32"
      height="120"
      viewBox="0 0 32 120"
      style={{ opacity: 0.6 }}
    >
      <path d="M16 4 C4 12 28 20 16 28 C4 36 28 44 16 52 C4 60 28 68 16 76 C4 84 28 92 16 100 C4 108 16 116 16 116"
        stroke="#888" strokeWidth="1.5" fill="none" />
      {[16, 40, 64, 88, 112].map(y => (
        <circle key={y} cx="16" cy={y} r="3" fill="none" stroke="#c9a84c" strokeWidth="1" opacity="0.6" />
      ))}
    </svg>
  );
}

// ─────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────

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
  const [previewScale, setPreviewScale] = useState(0.4);

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
      const s = [...prev.specialties] as [string, string, string];
      s[index] = value.toUpperCase();
      return { ...prev, specialties: s };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (ev.target?.result) setCard(prev => ({ ...prev, portraitUrl: ev.target.result as string }));
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
      await new Promise(r => setTimeout(r, 150));
      const dataUrl = format === 'jpg'
        ? await toJpeg(previewRef.current, { ...exportOptions, quality: 0.96 })
        : await toPng(previewRef.current, { ...exportOptions });
      const a = document.createElement('a');
      a.download = `legend-${card.name.replace(/\s+/g, '-')}-${String(card.cardNumber).padStart(4, '0')}.${format}`;
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
      await new Promise(r => setTimeout(r, 150));
      const imageData = await toPng(previewRef.current!, { ...exportOptions });
      const post: SavedPost = {
        type: 'legend',
        title: `${card.name} — ${card.surname}`,
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

  const accent = CLASS_ACCENT[card.characterClass];
  const stars = RARITY_STARS[card.rarity];
  const ClassIcon = CLASS_ICONS[card.characterClass];
  const rarityLabel = RARITY_FR[card.rarity];
  const edition = EDITIONS[card.rarity];
  const cardNumStr = String(card.cardNumber).padStart(4, '0');

  // Portrait ring dimensions
  const ringSize = 640;
  const ringOffset = (ringSize - CANVAS_W) / 2; // negative = ring extends past card edges at top

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#0a0a0a] text-white min-h-[calc(100vh-4rem)] p-6 rounded-2xl font-sans">

      {/* ── Controls ── */}
      <div className="lg:col-span-5 flex flex-col gap-5 overflow-y-auto max-h-[calc(100vh-6rem)] pr-2">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            Legend Card Generator
          </h2>
          <p className="text-neutral-400 text-sm">Créez des cartes de personnages légendaires.</p>
        </div>

        {/* Class & Rarity */}
        <div className="bg-[#141414] p-5 rounded-xl border border-neutral-800 space-y-4">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Classe</h3>
          <div className="grid grid-cols-4 gap-2">
            {CLASSES.map(cls => {
              const clsAccent = CLASS_ACCENT[cls];
              const Icon = CLASS_ICONS[cls];
              return (
                <button
                  key={cls}
                  onClick={() => handleFieldChange('characterClass', cls)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg border transition-all"
                  style={{
                    borderColor: card.characterClass === cls ? clsAccent : '#333',
                    background: card.characterClass === cls ? `${clsAccent}20` : 'transparent',
                  }}
                >
                  <Icon size={18} style={{ color: clsAccent }} />
                  <span className="text-[10px] text-neutral-400">{cls}</span>
                </button>
              );
            })}
          </div>

          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider pt-2">Rareté</h3>
          <div className="flex flex-wrap gap-2">
            {RARITIES.map(r => (
              <button
                key={r}
                onClick={() => handleFieldChange('rarity', r)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all uppercase"
                style={{
                  borderColor: card.rarity === r ? accent : '#333',
                  background: card.rarity === r ? `${accent}25` : 'transparent',
                  color: card.rarity === r ? accent : '#666',
                }}
              >
                {RARITY_FR[r]}
              </button>
            ))}
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-[#141414] p-5 rounded-xl border border-neutral-800 space-y-3">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Informations</h3>
          {[
            { label: 'NOM', field: 'name' as const, placeholder: 'Ex: ARISTOTE' },
            { label: 'SURNOM / TITRE', field: 'surname' as const, placeholder: 'Ex: Le Philosophe' },
            { label: 'ÈRE', field: 'era' as const, placeholder: 'Ex: Antiquité grecque' },
            { label: 'ORIGINE', field: 'origin' as const, placeholder: "Ex: Stagire, Macédoine" },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <label className="block text-[10px] text-neutral-500 mb-1 uppercase tracking-wider">{label}</label>
              <input
                type="text"
                value={card[field] as string}
                onChange={e => handleFieldChange(field, e.target.value)}
                placeholder={placeholder}
                className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-600 outline-none"
              />
            </div>
          ))}
        </div>

        {/* Portrait */}
        <div className="bg-[#141414] p-5 rounded-xl border border-neutral-800 space-y-3">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Portrait</h3>
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-44 bg-[#0a0a0a] border-2 border-dashed border-neutral-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-yellow-600 transition-all overflow-hidden"
          >
            {card.portraitUrl ? (
              <img src={card.portraitUrl} alt="Portrait" className="w-full h-full object-cover object-top" />
            ) : (
              <>
                <ImageIcon className="w-10 h-10 text-neutral-600 mb-2" />
                <span className="text-xs text-neutral-500">Cliquer pour uploader</span>
                <span className="text-[10px] text-neutral-600 mt-1">Portrait carré recommandé</span>
              </>
            )}
          </div>
        </div>

        {/* Specialties */}
        <div className="bg-[#141414] p-5 rounded-xl border border-neutral-800 space-y-3">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Spécialités (3)</h3>
          {card.specialties.map((spec, i) => (
            <div key={i}>
              <label className="block text-[10px] text-neutral-500 mb-1 uppercase tracking-wider">Spécialité {i + 1}</label>
              <input
                type="text"
                value={spec}
                onChange={e => handleSpecialtyChange(i, e.target.value)}
                className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-600 outline-none uppercase"
              />
            </div>
          ))}
        </div>

        {/* Achievement & Flaw */}
        <div className="bg-[#141414] p-5 rounded-xl border border-neutral-800 space-y-3">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Détails</h3>
          <div>
            <label className="block text-[10px] text-neutral-500 mb-1 uppercase tracking-wider">Réalisation Clef</label>
            <textarea
              value={card.keyAchievement}
              onChange={e => handleFieldChange('keyAchievement', e.target.value.toUpperCase())}
              rows={2}
              className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-600 outline-none resize-none uppercase"
            />
          </div>
          <div>
            <label className="block text-[10px] text-neutral-500 mb-1 uppercase tracking-wider">Faille Légendaire</label>
            <textarea
              value={card.flaw}
              onChange={e => handleFieldChange('flaw', e.target.value.toUpperCase())}
              rows={2}
              className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-600 outline-none resize-none uppercase"
            />
          </div>
          <div>
            <label className="block text-[10px] text-neutral-500 mb-1 uppercase tracking-wider">Citation</label>
            <textarea
              value={card.quote}
              onChange={e => handleFieldChange('quote', e.target.value)}
              rows={2}
              className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-600 outline-none resize-none italic"
            />
          </div>
        </div>

        {/* Card number */}
        <div className="bg-[#141414] p-4 rounded-xl border border-neutral-800">
          <label className="block text-[10px] text-neutral-500 mb-1 uppercase tracking-wider">Numéro de carte</label>
          <input
            type="number"
            value={card.cardNumber}
            onChange={e => handleFieldChange('cardNumber', parseInt(e.target.value) || 1)}
            className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-600 outline-none"
          />
          <p className="text-[10px] text-neutral-600 mt-1">Prochain disponible : #{nextCardNumber}</p>
        </div>

        {saveError && (
          <div className="p-3 bg-red-900/40 text-red-300 text-sm rounded-lg border border-red-800">{saveError}</div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3 pb-8">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleDownload('png')} disabled={isDownloading}
              className="py-2.5 px-4 bg-[#1a1a1a] hover:bg-[#222] border border-neutral-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PNG
            </button>
            <button onClick={() => handleDownload('jpg')} disabled={isDownloading}
              className="py-2.5 px-4 bg-[#1a1a1a] hover:bg-[#222] border border-neutral-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} JPEG
            </button>
          </div>
          <button onClick={handleSaveToLibrary} disabled={isSaving}
            className="py-2.5 px-4 bg-yellow-700 hover:bg-yellow-600 text-white font-medium rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {user ? 'Sauvegarder' : 'Se connecter pour sauvegarder'}
          </button>
        </div>
      </div>

      {/* ── Preview ── */}
      <div className="lg:col-span-7 flex justify-center items-start overflow-auto">
        <div
          ref={containerRef}
          className="w-full max-w-[420px] xl:max-w-[450px] aspect-[4/5] relative rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* ─────────────── CANVAS 1080 × 1350 ─────────────── */}
          <div
            ref={previewRef}
            style={{
              position: 'absolute', top: 0, left: 0,
              width: `${CANVAS_W}px`,
              height: `${CANVAS_H}px`,
              transform: `scale(${previewScale})`,
              transformOrigin: 'top left',
              fontFamily: '"Georgia", "Times New Roman", serif',
              overflow: 'hidden',
              background: '#1a2035',
            }}
          >
            {/* ── Background: dark slate with subtle map texture ── */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(160deg, #1c2540 0%, #141926 40%, #0f1520 70%, #1a2035 100%)',
            }} />
            {/* Subtle grid/map texture overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `
                linear-gradient(rgba(100,120,160,0.04) 1px, transparent 1px),
                linear-gradient(90deg, rgba(100,120,160,0.04) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }} />
            {/* Noise texture overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at 30% 20%, rgba(80,60,20,0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(40,60,90,0.15) 0%, transparent 50%)',
            }} />

            {/* ── Holographic outer border ── */}
            <div style={{
              position: 'absolute', inset: 0,
              border: '12px solid transparent',
              backgroundImage: `linear-gradient(#1c2540, #1c2540), linear-gradient(135deg, #ff0080, #ff8c00, #ffd700, #00ff80, #00bfff, #8000ff, #ff0080)`,
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              borderRadius: 28,
              opacity: 0.85,
            }} />

            {/* ── Inner metallic frame ── */}
            <div style={{
              position: 'absolute',
              top: 20, left: 20, right: 20, bottom: 20,
              borderRadius: 18,
              border: `3px solid`,
              borderColor: '#4a4a4a',
              boxShadow: `
                inset 0 0 0 1px rgba(200,200,200,0.15),
                0 0 40px rgba(0,0,0,0.8)
              `,
              pointerEvents: 'none',
            }} />
            {/* Inner frame highlight */}
            <div style={{
              position: 'absolute',
              top: 24, left: 24, right: 24, bottom: 24,
              borderRadius: 15,
              border: '1px solid rgba(180,160,80,0.25)',
              pointerEvents: 'none',
            }} />

            {/* ── Corner ornaments ── */}
            <CornerOrnament position="tl" />
            <CornerOrnament position="tr" />
            <CornerOrnament position="bl" />
            <CornerOrnament position="br" />

            {/* ── TOP BANNER: DOSSIER N° xxx • NIVEAU : RARITY ── */}
            <div style={{
              position: 'absolute', top: 38, left: '50%', transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
            }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: 'linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 40%, #1e1e1e 100%)',
                border: `1px solid #666`,
                borderRadius: 6,
                padding: '8px 28px',
                boxShadow: `0 0 20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.15)`,
              }}>
                {/* Left gem */}
                <div style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: accent,
                  boxShadow: `0 0 8px ${accent}`,
                }} />
                <span style={{
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: '3px',
                  fontFamily: '"Arial", sans-serif',
                  background: 'linear-gradient(180deg, #e8e8e8 0%, #c0c0c0 50%, #a0a0a0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textTransform: 'uppercase',
                }}>
                  DOSSIER N° {card.cardNumber} • NIVEAU : {rarityLabel}
                </span>
                {/* Right gem */}
                <div style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: accent,
                  boxShadow: `0 0 8px ${accent}`,
                }} />
              </div>
            </div>

            {/* ── CIRCULAR PORTRAIT with ornate ring ── */}
            <div style={{
              position: 'absolute',
              top: 90,
              left: '50%',
              transform: 'translateX(-50%)',
              width: ringSize,
              height: ringSize,
            }}>
              {/* SVG ornate ring */}
              <OrnateRing size={ringSize} accent={accent} />

              {/* Portrait circle */}
              <div style={{
                position: 'absolute',
                top: ringSize / 2 - 256,
                left: ringSize / 2 - 256,
                width: 512,
                height: 512,
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'linear-gradient(160deg, #1a1a2a, #0a0a14)',
                border: `3px solid ${accent}60`,
                boxShadow: `0 0 0 6px rgba(0,0,0,0.5), 0 0 40px rgba(0,0,0,0.9)`,
              }}>
                {card.portraitUrl ? (
                  <img
                    src={card.portraitUrl}
                    alt="Portrait"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', gap: 12,
                  }}>
                    <ImageIcon size={80} style={{ color: '#333' }} />
                    <span style={{ fontSize: 18, color: '#444', fontFamily: 'sans-serif' }}>Portrait</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── INFO SECTION ── */}
            <div style={{
              position: 'absolute',
              top: 90 + ringSize - 20,
              left: 50, right: 50,
            }}>
              {/* NOM + ÈRE */}
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 20,
                marginBottom: 6,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}>
                <span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: accent, fontFamily: 'Arial, sans-serif', letterSpacing: '2px' }}>NOM </span>
                  <span style={{ fontSize: 18, fontWeight: 400, color: '#e8e8e8', fontFamily: 'Arial, sans-serif' }}>[{card.name}]</span>
                </span>
                <span style={{ color: '#444', fontSize: 14 }}>•</span>
                <span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: accent, fontFamily: 'Arial, sans-serif', letterSpacing: '2px' }}>ÈRE </span>
                  <span style={{ fontSize: 16, fontWeight: 400, color: '#b0b0b0', fontFamily: 'Arial, sans-serif' }}>[{card.era}]</span>
                </span>
              </div>

              {/* ORIGINE + CLASSE */}
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 20,
                marginBottom: 14,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}>
                <span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: accent, fontFamily: 'Arial, sans-serif', letterSpacing: '2px' }}>ORIGINE </span>
                  <span style={{ fontSize: 16, fontWeight: 400, color: '#b0b0b0', fontFamily: 'Arial, sans-serif' }}>[{card.origin}]</span>
                </span>
                <span style={{ color: '#444', fontSize: 14 }}>•</span>
                <span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: accent, fontFamily: 'Arial, sans-serif', letterSpacing: '2px' }}>CLASSE </span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#e8e8e8', fontFamily: 'Arial, sans-serif' }}>{card.characterClass.toUpperCase()}</span>
                </span>
              </div>

              {/* SURNOM decorative banner */}
              <div style={{
                textAlign: 'center',
                marginBottom: 18,
                position: 'relative',
              }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 12,
                  background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.12) 20%, rgba(201,168,76,0.18) 50%, rgba(201,168,76,0.12) 80%, transparent)',
                  border: `1px solid ${accent}50`,
                  borderRadius: 4,
                  padding: '8px 24px',
                  width: '100%',
                  justifyContent: 'center',
                }}>
                  <span style={{ color: accent, fontSize: 18, opacity: 0.8 }}>✦</span>
                  <span style={{
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: '2px',
                    fontFamily: 'Arial, sans-serif',
                    color: accent,
                    textTransform: 'uppercase',
                  }}>
                    SURNOM / TITRE :
                  </span>
                  <span style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#e8e0c8',
                    fontFamily: 'Arial, sans-serif',
                    fontStyle: 'italic',
                    textTransform: 'uppercase',
                  }}>
                    [{card.surname}]
                  </span>
                  <span style={{ color: accent, fontSize: 18, opacity: 0.8 }}>✦</span>
                </div>
              </div>

              {/* SPECIALTIES: 3 badges in a row */}
              <div style={{
                display: 'flex', gap: 10,
                marginBottom: 18,
                justifyContent: 'center',
              }}>
                {card.specialties.map((spec, i) => (
                  <div key={i} style={{
                    flex: 1,
                    background: 'linear-gradient(180deg, #2e2e2e 0%, #222 100%)',
                    border: `1px solid #555`,
                    borderRadius: 6,
                    padding: '10px 8px',
                    textAlign: 'center',
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.5)`,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#cccccc', fontFamily: 'Arial, sans-serif', letterSpacing: '0.5px', lineHeight: 1.3 }}>
                      {spec || `SPÉCIALITÉ ${i + 1}`}
                    </div>
                  </div>
                ))}
              </div>

              {/* Side knots + Achievement & Flaw block */}
              <div style={{ position: 'relative', marginBottom: 14 }}>
                {/* Left Celtic knot */}
                <div style={{ position: 'absolute', left: -36, top: 0 }}>
                  <SideKnot side="left" />
                </div>
                {/* Right Celtic knot */}
                <div style={{ position: 'absolute', right: -36, top: 0 }}>
                  <SideKnot side="right" />
                </div>

                <div style={{
                  background: 'rgba(0,0,0,0.35)',
                  border: `1px solid ${accent}30`,
                  borderRadius: 6,
                  padding: '14px 16px',
                }}>
                  {/* RÉALISATION CLEF */}
                  <div style={{ marginBottom: 10 }}>
                    <span style={{
                      fontSize: 15, fontWeight: 800, color: accent,
                      fontFamily: 'Arial, sans-serif', letterSpacing: '1px',
                    }}>
                      RÉALISATION CLEF :{' '}
                    </span>
                    <span style={{
                      fontSize: 15, fontWeight: 400, color: '#d8d8d8',
                      fontFamily: 'Arial, sans-serif',
                    }}>
                      [{card.keyAchievement}]
                    </span>
                  </div>
                  {/* FAILLE LÉGENDAIRE */}
                  <div>
                    <span style={{
                      fontSize: 15, fontWeight: 800, color: accent,
                      fontFamily: 'Arial, sans-serif', letterSpacing: '1px',
                    }}>
                      FAILLE LÉGENDAIRE :{' '}
                    </span>
                    <span style={{
                      fontSize: 15, fontWeight: 400, color: '#d8d8d8',
                      fontFamily: 'Arial, sans-serif',
                    }}>
                      [{card.flaw}]
                    </span>
                  </div>
                </div>
              </div>

              {/* QUOTE box */}
              <div style={{
                border: `2px solid ${accent}70`,
                borderRadius: 6,
                padding: '14px 18px',
                background: `linear-gradient(135deg, rgba(201,168,76,0.08), rgba(0,0,0,0.3))`,
                textAlign: 'center',
                marginBottom: 14,
                boxShadow: `0 0 20px rgba(201,168,76,0.1)`,
              }}>
                <span style={{
                  fontSize: 16,
                  fontStyle: 'italic',
                  color: '#e8e0c0',
                  fontFamily: '"Georgia", serif',
                  letterSpacing: '0.3px',
                }}>
                  « [{card.quote}] »
                </span>
              </div>

              {/* STARS */}
              <div style={{ textAlign: 'center', marginBottom: 10 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} style={{
                    fontSize: 24,
                    color: i < stars ? accent : '#333',
                    margin: '0 3px',
                    textShadow: i < stars ? `0 0 10px ${accent}` : 'none',
                  }}>
                    ★
                  </span>
                ))}
              </div>
            </div>

            {/* ── FOOTER ── */}
            <div style={{
              position: 'absolute',
              bottom: 30,
              left: 0, right: 0,
              textAlign: 'center',
            }}>
              <span style={{
                fontSize: 12, fontFamily: 'Arial, sans-serif',
                color: '#555',
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}>
                TCG COLLECTOR • PREMIUM EDITION • {cardNumStr}/{edition}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
