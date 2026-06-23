import React, { useState, useRef, useEffect } from 'react';
import { Download, Loader as Loader2, Image as ImageIcon, Save, Sword, Compass, BookOpen, Palette, Sparkles, Brain, Crown, Dumbbell, Calendar, Globe, Shield, Trophy, TriangleAlert as AlertTriangle, Flag, Target, Star, Zap, Flame, Wind, ChevronRight } from 'lucide-react';
import { toPng, toJpeg } from 'html-to-image';
import { auth } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { SavedPost, LegendCard } from '../types';
import { savePost, getNextLegendCardNumber } from '../lib/postService';

// Canvas size matching Guerrier frame proportions (769×1070)
const CANVAS_W = 770;
const CANVAS_H = 1075;

// Frame border thickness
const B = 11;

const CLASSES: LegendCard['characterClass'][] = [
  'Guerrier', 'Explorateur', 'Savant', 'Artiste',
  'Fictionnel', 'Penseur', 'Dirigeant', 'Athlete',
];
const RARITIES: LegendCard['rarity'][] = ['Commun', 'Rare', 'Epique', 'Legendaire', 'Mythique'];

const RARITY_STARS: Record<LegendCard['rarity'], number> = {
  Commun: 1, Rare: 2, Epique: 3, Legendaire: 4, Mythique: 5,
};
const RARITY_FR: Record<LegendCard['rarity'], string> = {
  Commun: 'COMMUN', Rare: 'RARE', Epique: 'ÉPIQUE', Legendaire: 'LÉGENDE', Mythique: 'MYTHIQUE',
};
const RARITY_EDITION: Record<LegendCard['rarity'], string> = {
  Commun: '2500', Rare: '1000', Epique: '500', Legendaire: '5000', Mythique: '100',
};

// Class-specific theme
const CLASS_THEME: Record<LegendCard['characterClass'], {
  accent: string;    // main accent (text, icons)
  frameDark: string; // outer/dark frame color
  frameMid: string;  // mid frame color
  frameBright: string; // inner bright frame edge
  divider: string;   // section divider gradient
  icon: React.ComponentType<any>;
}> = {
  Guerrier:    { accent: '#e83020', frameDark: '#1a0606', frameMid: '#701808', frameBright: '#c84018', divider: '#8b1808', icon: Sword },
  Explorateur: { accent: '#20c050', frameDark: '#06160a', frameMid: '#0a4818', frameBright: '#18a038', divider: '#0a5820', icon: Compass },
  Savant:      { accent: '#2080e8', frameDark: '#060a18', frameMid: '#0a2060', frameBright: '#1848c0', divider: '#0a2868', icon: BookOpen },
  Artiste:     { accent: '#e830a0', frameDark: '#160608', framMid: '#500820', frameBright: '#c02080', divider: '#600818', icon: Palette } as any,
  Fictionnel:  { accent: '#9030e0', frameDark: '#0c0618', frameMid: '#280860', frameBright: '#6018c0', divider: '#300870', icon: Sparkles },
  Penseur:     { accent: '#d4a030', frameDark: '#14100a', frameMid: '#483010', frameBright: '#c08020', divider: '#504010', icon: Brain },
  Dirigeant:   { accent: '#e06020', frameDark: '#180a06', frameMid: '#602010', frameBright: '#c05018', divider: '#682010', icon: Crown },
  Athlete:     { accent: '#20b8a0', frameDark: '#061412', frameMid: '#0a4840', frameBright: '#18a090', divider: '#0a5048', icon: Dumbbell },
};

const CLASS_ICONS: Record<LegendCard['characterClass'], React.ComponentType<any>> = {
  Guerrier: Sword, Explorateur: Compass, Savant: BookOpen, Artiste: Palette,
  Fictionnel: Sparkles, Penseur: Brain, Dirigeant: Crown, Athlete: Dumbbell,
};

const SPEC_ICON_LIST = [
  { id: 'sword', Icon: Sword }, { id: 'shield', Icon: Shield }, { id: 'target', Icon: Target },
  { id: 'star', Icon: Star }, { id: 'trophy', Icon: Trophy }, { id: 'zap', Icon: Zap },
  { id: 'flame', Icon: Flame }, { id: 'compass', Icon: Compass }, { id: 'globe', Icon: Globe },
  { id: 'wind', Icon: Wind }, { id: 'brain', Icon: Brain }, { id: 'flag', Icon: Flag },
];

type SpecIcon = typeof SPEC_ICON_LIST[number]['id'];

const DEFAULT_SPEC_ICONS: Record<LegendCard['characterClass'], [SpecIcon, SpecIcon, SpecIcon]> = {
  Guerrier:    ['sword', 'shield', 'flag'],
  Explorateur: ['compass', 'globe', 'star'],
  Savant:      ['brain', 'target', 'star'],
  Artiste:     ['star', 'wind', 'flame'],
  Fictionnel:  ['star', 'zap', 'wind'],
  Penseur:     ['brain', 'target', 'flag'],
  Dirigeant:   ['crown' as any, 'flag', 'shield'],
  Athlete:     ['zap', 'flame', 'target'],
};

const initialCard: LegendCard = {
  name: '',
  surname: '',
  era: '',
  origin: '',
  characterClass: 'Guerrier',
  rarity: 'Legendaire',
  specialties: ['', '', ''],
  keyAchievement: '',
  flaw: '',
  quote: '',
  portraitUrl: null,
  cardNumber: 1,
};

// ──────────────────────────────────────
// Sub-components used in the canvas
// ──────────────────────────────────────

/** Hexagonal shape clip-path (flat top & bottom) */
const HEX_CLIP = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';

/** Stylized double-chevron quote mark (66/99 style) */
function QuoteMark({ mirror = false }: { mirror?: boolean }) {
  const d = mirror
    ? 'M 22 6 L 12 18 L 22 18 M 10 6 L 0 18 L 10 18'
    : 'M 0 6 L 10 18 L 0 18 M 12 6 L 22 18 L 12 18';
  return (
    <svg width={24} height={24} viewBox="0 0 24 24">
      <path d={d} stroke="#c9a84c" strokeWidth="2.5" fill="none" strokeLinecap="square" />
    </svg>
  );
}

/** Pentagon class badge for the top-left corner */
function PentagonBadge({ size, accent, frameMid, frameBright, Icon }:
  { size: number; accent: string; frameMid: string; frameBright: string; Icon: React.ComponentType<any> }) {
  return (
    <div style={{
      width: size, height: size,
      position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Outer pentagon */}
      <div style={{
        position: 'absolute', inset: 0,
        clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
        background: `linear-gradient(160deg, ${frameBright} 0%, ${frameMid} 60%, #0a0404 100%)`,
        boxShadow: `inset 0 0 8px rgba(0,0,0,0.8)`,
      }} />
      {/* Inner pentagon */}
      <div style={{
        position: 'absolute',
        top: '8%', left: '8%', right: '8%', bottom: '8%',
        clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
        background: `linear-gradient(160deg, #1a0808 0%, #0a0404 100%)`,
      }} />
      {/* Rivet dots at pentagon vertices */}
      {[
        { x: '50%', y: '3%' }, { x: '91%', y: '38%' }, { x: '78%', y: '95%' },
        { x: '22%', y: '95%' }, { x: '9%',  y: '38%' },
      ].map((pt, i) => (
        <div key={i} style={{
          position: 'absolute', left: pt.x, top: pt.y,
          width: 6, height: 6, borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle at 35% 35%, ${frameBright}, ${frameMid})`,
          boxShadow: `0 0 4px ${accent}80`,
        }} />
      ))}
      {/* Icon */}
      <Icon size={size * 0.4} style={{ color: accent, position: 'relative', zIndex: 1, filter: `drop-shadow(0 0 4px ${accent})` }} />
    </div>
  );
}

/** Metallic hexagonal specialty badge */
function SpecBadge({ size, accent, frameMid, frameBright, Icon }:
  { size: number; accent: string; frameMid: string; frameBright: string; Icon: React.ComponentType<any> }) {
  return (
    <div style={{
      width: size, height: size * 0.87,
      position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Outer hex */}
      <div style={{
        position: 'absolute', inset: 0,
        clipPath: HEX_CLIP,
        background: `linear-gradient(160deg, ${frameBright}cc 0%, ${frameMid} 50%, #080404 100%)`,
      }} />
      {/* Inner hex */}
      <div style={{
        position: 'absolute',
        top: '8%', left: '8%', right: '8%', bottom: '8%',
        clipPath: HEX_CLIP,
        background: `linear-gradient(160deg, #1c0808 0%, #0a0404 100%)`,
      }} />
      <Icon size={size * 0.38} style={{ color: accent, position: 'relative', zIndex: 1, filter: `drop-shadow(0 0 5px ${accent}bb)` }} />
    </div>
  );
}

/** Large hexagonal badge for achievement/flaw sections */
function LargeHexBadge({ size, accent, frameMid, frameBright, Icon }:
  { size: number; accent: string; frameMid: string; frameBright: string; Icon: React.ComponentType<any> }) {
  return (
    <div style={{
      width: size, height: size * 0.87,
      position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {/* Outer hex (metallic ring) */}
      <div style={{
        position: 'absolute', inset: 0,
        clipPath: HEX_CLIP,
        background: `linear-gradient(160deg, ${frameBright} 0%, ${frameMid} 50%, #060202 100%)`,
      }} />
      {/* Inner hex (dark) */}
      <div style={{
        position: 'absolute',
        top: '10%', left: '10%', right: '10%', bottom: '10%',
        clipPath: HEX_CLIP,
        background: 'linear-gradient(160deg, #1a0808, #090404)',
      }} />
      <Icon size={size * 0.42} style={{ color: accent, position: 'relative', zIndex: 1, filter: `drop-shadow(0 0 6px ${accent})` }} />
    </div>
  );
}

/** Small info row icon */
function InfoIcon({ size, accent, frameMid, Icon }:
  { size: number; accent: string; frameMid: string; Icon: React.ComponentType<any> }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle at 35% 35%, ${frameMid}cc, #080404)`,
      border: `1.5px solid ${frameMid}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Icon size={size * 0.5} style={{ color: accent, opacity: 0.9 }} />
    </div>
  );
}

/** Section divider bar */
function Divider({ frameDark, frameBright }: { frameDark: string; frameBright: string }) {
  return (
    <div style={{
      height: 4, width: '100%',
      background: `linear-gradient(90deg, ${frameDark} 0%, ${frameBright} 20%, ${frameBright} 80%, ${frameDark} 100%)`,
      boxShadow: `0 0 8px ${frameBright}80`,
    }} />
  );
}

/** SVG Corner bracket ornament */
function CornerBracket({ pos, accent, frameBright }: { pos: 'tl' | 'tr' | 'bl' | 'br'; accent: string; frameBright: string }) {
  const W = 52;
  const sx = pos === 'tr' || pos === 'br' ? -1 : 1;
  const sy = pos === 'bl' || pos === 'br' ? -1 : 1;
  const ox = pos === 'tr' || pos === 'br' ? W : 0;
  const oy = pos === 'bl' || pos === 'br' ? W : 0;

  const corner: React.CSSProperties = {
    position: 'absolute',
    top: pos.startsWith('t') ? 0 : undefined,
    bottom: pos.startsWith('b') ? 0 : undefined,
    left: pos.endsWith('l') ? 0 : undefined,
    right: pos.endsWith('r') ? 0 : undefined,
  };

  return (
    <svg width={W} height={W} viewBox={`0 0 ${W} ${W}`} style={corner}>
      <g transform={`translate(${ox}, ${oy}) scale(${sx}, ${sy})`}>
        {/* Main L-bracket */}
        <path d={`M 6 46 L 6 6 L 46 6`}
          stroke={frameBright} strokeWidth="7" fill="none" strokeLinecap="square" />
        {/* Inner highlight */}
        <path d={`M 6 44 L 6 6 L 44 6`}
          stroke={accent} strokeWidth="2" fill="none" strokeLinecap="square" opacity="0.6" />
        {/* End rivet on right arm */}
        <circle cx="46" cy="6" r="5" fill={frameBright} />
        <circle cx="46" cy="6" r="2.5" fill={accent} opacity="0.8" />
        {/* End rivet on bottom arm */}
        <circle cx="6" cy="46" r="5" fill={frameBright} />
        <circle cx="6" cy="46" r="2.5" fill={accent} opacity="0.8" />
        {/* Corner center bolt */}
        <circle cx="6" cy="6" r="7" fill={frameBright} />
        <circle cx="6" cy="6" r="4" fill="#0a0404" />
        <circle cx="6" cy="6" r="2" fill={accent} opacity="0.9" />
      </g>
    </svg>
  );
}

/** Edge rivets row/column */
function EdgeRivets({ axis, length, count, frameBright, accent }: {
  axis: 'h' | 'v'; length: number; count: number; frameBright: string; accent: string;
}) {
  const spacing = length / (count + 1);
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const offset = spacing * (i + 1);
        const style: React.CSSProperties = {
          position: 'absolute',
          width: 8, height: 8,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, ${frameBright}, #301808)`,
          boxShadow: `0 0 3px ${accent}60`,
          transform: 'translate(-50%, -50%)',
          ...(axis === 'h'
            ? { left: offset, top: '50%' }
            : { top: offset, left: '50%' }),
        };
        return <div key={i} style={style} />;
      })}
    </>
  );
}

// ──────────────────────────────────────
// Main Component
// ──────────────────────────────────────

export function LegendGenerator() {
  const [user, setUser] = useState<User | null>(null);
  const [card, setCard] = useState<LegendCard>(initialCard);
  const [specIcons, setSpecIcons] = useState<[SpecIcon, SpecIcon, SpecIcon]>(['sword', 'shield', 'flag']);
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

  useEffect(() => {
    setSpecIcons(DEFAULT_SPEC_ICONS[card.characterClass] as [SpecIcon, SpecIcon, SpecIcon]);
  }, [card.characterClass]);

  const update = (field: keyof LegendCard, value: string | number) =>
    setCard(prev => ({ ...prev, [field]: value }));

  const updateSpec = (i: number, v: string) =>
    setCard(prev => {
      const s = [...prev.specialties] as [string, string, string];
      s[i] = v;
      return { ...prev, specialties: s };
    });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (ev.target?.result) update('portraitUrl', ev.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const exportOpts = {
    cacheBust: true, pixelRatio: 2,
    width: CANVAS_W, height: CANVAS_H,
    style: { transform: 'scale(1)', transformOrigin: 'top left' },
  };

  const handleDownload = async (format: 'png' | 'jpg') => {
    if (!previewRef.current) return;
    try {
      setIsDownloading(true);
      await new Promise(r => setTimeout(r, 150));
      const url = format === 'jpg'
        ? await toJpeg(previewRef.current, { ...exportOpts, quality: 0.96 })
        : await toPng(previewRef.current, exportOpts);
      const a = document.createElement('a');
      a.download = `legend-${(card.name || 'card').replace(/\s+/g, '-')}-${String(card.cardNumber).padStart(3, '0')}.${format}`;
      a.href = url; a.click();
    } catch (err) { console.error(err); }
    finally { setIsDownloading(false); }
  };

  const handleSave = async () => {
    if (!user) { setSaveError('Connectez-vous pour sauvegarder'); return; }
    if (!card.portraitUrl) { setSaveError('Uploadez un portrait'); return; }
    setIsSaving(true); setSaveError(null);
    try {
      await new Promise(r => setTimeout(r, 150));
      const img = await toPng(previewRef.current!, exportOpts);
      await savePost({
        type: 'legend', title: `${card.name || 'Légende'} — ${card.surname}`,
        imageUrl: img, authorName: user.displayName || 'Anonymous',
        metadata: { firebaseUid: user.uid, card: { ...card, portraitUrl: '' }, specIcons },
      });
      alert('Carte sauvegardée !');
      const n = await getNextLegendCardNumber();
      setNextCardNumber(n); update('cardNumber', n);
    } catch (err: any) {
      setSaveError(err?.message || 'Erreur');
    } finally { setIsSaving(false); }
  };

  const theme = CLASS_THEME[card.characterClass];
  const { accent, frameDark, frameMid, frameBright } = theme;
  const ClassIcon = CLASS_ICONS[card.characterClass];
  const stars = RARITY_STARS[card.rarity];
  const cardNumStr = String(card.cardNumber).padStart(3, '0');
  const edition = RARITY_EDITION[card.rarity];

  // Resolved spec icons
  const spec1Icon = SPEC_ICON_LIST.find(x => x.id === specIcons[0])?.Icon ?? Sword;
  const spec2Icon = SPEC_ICON_LIST.find(x => x.id === specIcons[1])?.Icon ?? Shield;
  const spec3Icon = SPEC_ICON_LIST.find(x => x.id === specIcons[2])?.Icon ?? Flag;

  const cinzel = '"Cinzel", "Georgia", serif';
  const sansSerif = '"Arial", "Helvetica", sans-serif';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#0a0a0a] text-white min-h-[calc(100vh-4rem)] p-6 rounded-2xl font-sans">

      {/* ─── CONTROLS ─── */}
      <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-6rem)] pr-2">
        <div>
          <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: accent }} />
            Legend Card Generator
          </h2>
          <p className="text-neutral-500 text-sm">Cartes de personnages légendaires TCG</p>
        </div>

        {/* Class */}
        <div className="bg-[#141414] p-4 rounded-xl border border-neutral-800 space-y-3">
          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">Classe du personnage</p>
          <div className="grid grid-cols-4 gap-2">
            {CLASSES.map(cls => {
              const t = CLASS_THEME[cls];
              const Icon = CLASS_ICONS[cls];
              return (
                <button key={cls} onClick={() => update('characterClass', cls)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-[10px] text-neutral-400"
                  style={{ borderColor: card.characterClass === cls ? t.accent : '#333', background: card.characterClass === cls ? `${t.accent}20` : 'transparent' }}>
                  <Icon size={16} style={{ color: t.accent }} />
                  {cls}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rarity */}
        <div className="bg-[#141414] p-4 rounded-xl border border-neutral-800 space-y-3">
          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">Rareté</p>
          <div className="flex flex-wrap gap-2">
            {RARITIES.map(r => (
              <button key={r} onClick={() => update('rarity', r)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border uppercase transition-all"
                style={{ borderColor: card.rarity === r ? accent : '#333', background: card.rarity === r ? `${accent}25` : 'transparent', color: card.rarity === r ? accent : '#555' }}>
                {RARITY_FR[r]}
              </button>
            ))}
          </div>
        </div>

        {/* Basic info */}
        <div className="bg-[#141414] p-4 rounded-xl border border-neutral-800 space-y-3">
          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">Informations</p>
          {[
            { label: '1. Nom', field: 'name' as const, placeholder: 'EX: ALEXANDRE LE GRAND' },
            { label: '4. Surnom / Titre', field: 'surname' as const, placeholder: 'Le Conquérant du Monde' },
            { label: 'Ère', field: 'era' as const, placeholder: '356 av. J.-C. — 323 av. J.-C.' },
            { label: 'Origine', field: 'origin' as const, placeholder: 'Macédoine / Royaume Argéade' },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <label className="block text-[10px] text-neutral-600 mb-1 uppercase tracking-wider">{label}</label>
              <input type="text" value={card[field] as string} onChange={e => update(field, e.target.value)}
                placeholder={placeholder}
                className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
            </div>
          ))}
          <div>
            <label className="block text-[10px] text-neutral-600 mb-1 uppercase tracking-wider">Sous-type (classe détaillée)</label>
            <input type="text" value={card.surname} onChange={e => update('surname', e.target.value)}
              placeholder="ex: Conquérant / Stratège"
              className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
          </div>
        </div>

        {/* Portrait */}
        <div className="bg-[#141414] p-4 rounded-xl border border-neutral-800 space-y-3">
          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">Portrait (4. Illustration)</p>
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
          <div onClick={() => fileInputRef.current?.click()}
            className="w-full h-40 bg-[#0a0a0a] border-2 border-dashed border-neutral-800 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-neutral-600 transition-all overflow-hidden">
            {card.portraitUrl
              ? <img src={card.portraitUrl} alt="" className="w-full h-full object-cover object-top" />
              : <><ImageIcon className="w-8 h-8 text-neutral-700 mb-2" /><span className="text-xs text-neutral-600">Cliquer pour uploader le portrait</span></>}
          </div>
        </div>

        {/* Specialties */}
        <div className="bg-[#141414] p-4 rounded-xl border border-neutral-800 space-y-3">
          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">6. Spécialités (3)</p>
          {[0, 1, 2].map(i => (
            <div key={i} className="space-y-1">
              <label className="block text-[10px] text-neutral-600 uppercase tracking-wider">Spécialité {i + 1}</label>
              <div className="flex gap-2">
                <select value={specIcons[i]}
                  onChange={e => {
                    const s = [...specIcons] as [SpecIcon, SpecIcon, SpecIcon];
                    s[i] = e.target.value as SpecIcon;
                    setSpecIcons(s);
                  }}
                  className="bg-[#0a0a0a] border border-neutral-800 rounded-lg px-2 py-2 text-white text-xs focus:outline-none w-28">
                  {SPEC_ICON_LIST.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
                </select>
                <input type="text" value={card.specialties[i]} onChange={e => updateSpec(i, e.target.value)}
                  placeholder="Ex: COMBAT PHYSIQUE"
                  className="flex-1 bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none uppercase" />
              </div>
            </div>
          ))}
        </div>

        {/* Achievement & Flaw */}
        <div className="bg-[#141414] p-4 rounded-xl border border-neutral-800 space-y-3">
          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">7 & 8 — Réalisation & Faille</p>
          <div>
            <label className="block text-[10px] text-neutral-600 mb-1 uppercase tracking-wider">7. Réalisation Clef</label>
            <textarea value={card.keyAchievement} onChange={e => update('keyAchievement', e.target.value)} rows={2}
              className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none resize-none"
              placeholder="Conquit un empire de 5 millions de km² en 13 ans..." />
          </div>
          <div>
            <label className="block text-[10px] text-neutral-600 mb-1 uppercase tracking-wider">8. Faille Légendaire</label>
            <textarea value={card.flaw} onChange={e => update('flaw', e.target.value)} rows={2}
              className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none resize-none"
              placeholder="Son orgueil croissant le poussa à l'épuisement fatal..." />
          </div>
        </div>

        {/* Citation */}
        <div className="bg-[#141414] p-4 rounded-xl border border-neutral-800 space-y-2">
          <label className="block text-[10px] text-neutral-600 uppercase tracking-wider">9. Citation</label>
          <textarea value={card.quote} onChange={e => update('quote', e.target.value)} rows={2}
            className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none resize-none italic"
            placeholder="Il n'y a rien d'impossible à celui qui essaie." />
        </div>

        {/* Card Number */}
        <div className="bg-[#141414] p-4 rounded-xl border border-neutral-800">
          <label className="block text-[10px] text-neutral-600 mb-1 uppercase tracking-wider">Numéro de carte</label>
          <input type="number" value={card.cardNumber} onChange={e => update('cardNumber', parseInt(e.target.value) || 1)}
            className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
          <p className="text-[10px] text-neutral-700 mt-1">Prochain disponible : #{nextCardNumber}</p>
        </div>

        {saveError && <div className="p-3 bg-red-900/40 text-red-300 text-sm rounded-lg border border-red-800">{saveError}</div>}

        {/* Actions */}
        <div className="flex flex-col gap-3 pb-8">
          <div className="grid grid-cols-2 gap-3">
            {(['png', 'jpg'] as const).map(fmt => (
              <button key={fmt} onClick={() => handleDownload(fmt)} disabled={isDownloading}
                className="py-2.5 px-4 bg-[#1a1a1a] hover:bg-[#222] border border-neutral-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors uppercase text-sm">
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} {fmt}
              </button>
            ))}
          </div>
          <button onClick={handleSave} disabled={isSaving}
            className="py-2.5 px-4 text-white font-medium rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            style={{ background: accent }}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {user ? 'Sauvegarder' : 'Se connecter pour sauvegarder'}
          </button>
        </div>
      </div>

      {/* ─── CARD PREVIEW ─── */}
      <div className="lg:col-span-7 flex justify-center items-start overflow-auto">
        <div ref={containerRef}
          style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
          className="w-full max-w-[380px] xl:max-w-[410px] relative rounded overflow-hidden"
          style2={{ boxShadow: `0 0 80px ${accent}40, 0 20px 60px rgba(0,0,0,0.8)` } as any}>

          {/* ──────────── CANVAS ──────────── */}
          <div ref={previewRef} style={{
            position: 'absolute', top: 0, left: 0,
            width: `${CANVAS_W}px`, height: `${CANVAS_H}px`,
            transform: `scale(${previewScale})`,
            transformOrigin: 'top left',
            background: frameDark,
            overflow: 'hidden',
          }}>

            {/* ── OUTER FRAME (background gradient) ── */}
            <div style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(160deg, ${frameDark} 0%, ${frameMid} 30%, ${frameBright} 50%, ${frameMid} 70%, ${frameDark} 100%)`,
            }} />
            {/* Inner card surface */}
            <div style={{
              position: 'absolute',
              top: B, left: B, right: B, bottom: B,
              background: '#0f0c0c',
            }} />

            {/* ── FRAME EDGE RIVETS ── */}
            {/* Top edge */}
            <div style={{ position: 'absolute', top: 0, left: 55, right: 55, height: B }}>
              <EdgeRivets axis="h" length={CANVAS_W - 110} count={5} frameBright={frameBright} accent={accent} />
            </div>
            {/* Bottom edge */}
            <div style={{ position: 'absolute', bottom: 0, left: 55, right: 55, height: B }}>
              <EdgeRivets axis="h" length={CANVAS_W - 110} count={5} frameBright={frameBright} accent={accent} />
            </div>
            {/* Left edge */}
            <div style={{ position: 'absolute', left: 0, top: 55, bottom: 55, width: B }}>
              <EdgeRivets axis="v" length={CANVAS_H - 110} count={8} frameBright={frameBright} accent={accent} />
            </div>
            {/* Right edge */}
            <div style={{ position: 'absolute', right: 0, top: 55, bottom: 55, width: B }}>
              <EdgeRivets axis="v" length={CANVAS_H - 110} count={8} frameBright={frameBright} accent={accent} />
            </div>

            {/* ── CORNER BRACKETS ── */}
            {(['tl', 'tr', 'bl', 'br'] as const).map(pos => (
              <CornerBracket key={pos} pos={pos} accent={accent} frameBright={frameBright} />
            ))}

            {/* ──────────── CARD CONTENT (inside frame border) ──────────── */}
            <div style={{
              position: 'absolute',
              top: B, left: B, right: B, bottom: B,
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}>

              {/* ═══ SECTION 1: HEADER ═══ */}
              <div style={{
                height: 108,
                display: 'flex',
                alignItems: 'stretch',
                position: 'relative',
                flexShrink: 0,
              }}>
                {/* Pentagon badge */}
                <div style={{
                  width: 96, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 8,
                }}>
                  <PentagonBadge size={80} accent={accent} frameMid={frameMid} frameBright={frameBright} Icon={ClassIcon} />
                </div>

                {/* Name area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '8px 12px 8px 4px' }}>
                  <div style={{ fontSize: 12, color: '#888', fontFamily: sansSerif, marginBottom: 4 }}>1. NOM :</div>
                  <div style={{
                    fontSize: card.name ? 26 : 20,
                    fontWeight: 700,
                    color: '#e8e0d8',
                    fontFamily: cinzel,
                    letterSpacing: '1px',
                    lineHeight: 1.1,
                    textTransform: 'uppercase',
                  }}>
                    {card.name || <span style={{ color: '#333', fontStyle: 'italic', fontSize: 16, fontFamily: sansSerif }}>NOM DU PERSONNAGE</span>}
                  </div>
                </div>

                {/* Vertical divider */}
                <div style={{
                  width: 2, alignSelf: 'stretch', margin: '8px 0',
                  background: `linear-gradient(180deg, transparent, ${frameBright}, ${frameBright}, transparent)`,
                }} />

                {/* Rarity + Number */}
                <div style={{
                  width: 168, flexShrink: 0,
                  display: 'flex', flexDirection: 'column', justifyContent: 'center',
                  padding: '8px 14px',
                  gap: 6,
                }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: accent, fontFamily: sansSerif, letterSpacing: '1px' }}>RARETÉ :</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#e0d8d0', fontFamily: cinzel, textTransform: 'uppercase' }}>
                      {RARITY_FR[card.rarity]}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#888', fontFamily: sansSerif }}>
                    N° : <span style={{ color: '#c8c0b8', fontWeight: 600 }}>{cardNumStr}</span>
                  </div>
                </div>
              </div>

              {/* ─── Divider ─── */}
              <Divider frameDark={frameDark} frameBright={frameBright} />

              {/* ═══ SECTION 2: PORTRAIT ═══ */}
              <div style={{
                flex: '0 0 396px',
                background: '#050404',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden',
              }}>
                {card.portraitUrl ? (
                  <img src={card.portraitUrl} alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <ImageIcon size={64} style={{ color: '#1e1818' }} />
                    <div style={{ color: '#2a2020', fontFamily: sansSerif, fontSize: 14, textAlign: 'center' }}>
                      4. PORTRAIT D'ACTION
                      <br />
                      <span style={{ fontSize: 12 }}>(Illustration du personnage)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Divider ─── */}
              <Divider frameDark={frameDark} frameBright={frameBright} />

              {/* ═══ SECTION 3: INFO ROWS ═══ */}
              <div style={{
                flexShrink: 0,
                padding: '4px 0',
                background: '#0f0c0c',
              }}>
                {[
                  { label: '4. SURNOM / APPELLATION / TITRE / PSEUDONYME :', value: card.surname, Icon: ClassIcon },
                  { label: 'ÈRE :', value: card.era, Icon: Calendar },
                  { label: 'ORIGINE :', value: card.origin, Icon: Globe },
                  { label: `5. CLASSE : ${card.characterClass.toUpperCase()} —`, value: '', Icon: Shield },
                ].map(({ label, value, Icon: RowIcon }, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center',
                    padding: '5px 10px 5px 8px',
                    minHeight: 46,
                    borderBottom: i < 3 ? `1px solid ${frameDark}` : 'none',
                  }}>
                    <InfoIcon size={32} accent={accent} frameMid={frameMid} Icon={RowIcon} />
                    <div style={{ marginLeft: 8, flex: 1 }}>
                      <span style={{
                        fontSize: 11, color: '#888', fontFamily: sansSerif, letterSpacing: '0.3px',
                      }}>
                        {label}{' '}
                      </span>
                      {value && (
                        <span style={{ fontSize: 13, color: '#d8d0c8', fontFamily: cinzel }}>
                          {value}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {/* Sous-type */}
                <div style={{
                  textAlign: 'center', padding: '4px 10px',
                  fontSize: 12, color: '#666', fontFamily: sansSerif, fontStyle: 'italic',
                }}>
                  ({card.surname || 'Sous-type'})
                </div>
              </div>

              {/* ─── Divider ─── */}
              <Divider frameDark={frameDark} frameBright={frameBright} />

              {/* ═══ SECTION 4: SPECIALTIES ═══ */}
              <div style={{
                flexShrink: 0,
                background: '#0c0a0a',
                padding: '6px 8px 8px',
              }}>
                {/* Header */}
                <div style={{
                  textAlign: 'center', fontSize: 12,
                  color: '#888', fontFamily: sansSerif,
                  letterSpacing: '1.5px', marginBottom: 6,
                  borderBottom: `1px solid ${frameDark}40`,
                  paddingBottom: 4,
                }}>
                  6. SPÉCIALITÉS (3)
                </div>
                {/* 3 Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start' }}>
                  {[
                    { Icon: spec1Icon, text: card.specialties[0] || '' },
                    { Icon: spec2Icon, text: card.specialties[1] || '' },
                    { Icon: spec3Icon, text: card.specialties[2] || '' },
                  ].map(({ Icon: BIcon, text }, i) => (
                    <div key={i} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: 4, flex: 1, padding: '0 4px',
                    }}>
                      <SpecBadge size={68} accent={accent} frameMid={frameMid} frameBright={frameBright} Icon={BIcon} />
                      {/* Underline bar */}
                      <div style={{ width: '80%', height: 1, background: `linear-gradient(90deg, transparent, ${frameBright}, transparent)` }} />
                      <div style={{
                        fontSize: 9, color: '#a09090', fontFamily: sansSerif,
                        textAlign: 'center', lineHeight: 1.3, textTransform: 'uppercase',
                        letterSpacing: '0.3px', minHeight: 22,
                      }}>
                        {text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ─── Divider ─── */}
              <Divider frameDark={frameDark} frameBright={frameBright} />

              {/* ═══ SECTION 5: ACHIEVEMENT ═══ */}
              <div style={{
                flexShrink: 0, height: 78,
                display: 'flex', alignItems: 'stretch',
                background: 'linear-gradient(90deg, #6a4a28 0%, #8a6038 40%, #7a5430 100%)',
                position: 'relative', overflow: 'hidden',
              }}>
                {/* Texture overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 6px)',
                }} />
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', padding: '6px 8px', zIndex: 1 }}>
                  <LargeHexBadge size={58} accent={accent} frameMid={frameMid} frameBright={frameBright} Icon={Trophy} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '8px 10px 8px 4px', zIndex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: accent, fontFamily: sansSerif, letterSpacing: '0.5px', marginBottom: 3 }}>
                    7. RÉALISATION CLEF :
                  </div>
                  <div style={{ fontSize: 11, color: '#1a0f08', fontFamily: sansSerif, lineHeight: 1.4 }}>
                    {card.keyAchievement || <span style={{ color: '#3a2818', fontStyle: 'italic' }}>Description de la réalisation majeure...</span>}
                  </div>
                </div>
              </div>

              {/* ─── Divider ─── */}
              <Divider frameDark={frameDark} frameBright={frameBright} />

              {/* ═══ SECTION 6: FLAW ═══ */}
              <div style={{
                flexShrink: 0, height: 78,
                display: 'flex', alignItems: 'stretch',
                background: 'linear-gradient(90deg, #5a3820 0%, #7a5030 40%, #6a4428 100%)',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 6px)',
                }} />
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', padding: '6px 8px', zIndex: 1 }}>
                  <LargeHexBadge size={58} accent={accent} frameMid={frameMid} frameBright={frameBright} Icon={AlertTriangle} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '8px 10px 8px 4px', zIndex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: accent, fontFamily: sansSerif, letterSpacing: '0.5px', marginBottom: 3 }}>
                    8. FAILLE :
                  </div>
                  <div style={{ fontSize: 11, color: '#1a0f08', fontFamily: sansSerif, lineHeight: 1.4 }}>
                    {card.flaw || <span style={{ color: '#3a2818', fontStyle: 'italic' }}>Description de la faiblesse légendaire...</span>}
                  </div>
                </div>
              </div>

              {/* ─── Divider ─── */}
              <Divider frameDark={frameDark} frameBright={frameBright} />

              {/* ═══ SECTION 7: CITATION ═══ */}
              <div style={{
                flex: 1,
                background: '#0c0a0a',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '6px 16px',
                gap: 6,
                position: 'relative',
                minHeight: 68,
              }}>
                {/* Citation content */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                  <QuoteMark />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: '#777', fontFamily: sansSerif, marginBottom: 2 }}>9. CITATION :</div>
                    <div style={{ fontSize: 12, fontStyle: 'italic', color: '#c8c0b0', fontFamily: cinzel, lineHeight: 1.3 }}>
                      {card.quote || <span style={{ color: '#3a3030' }}>La citation du personnage...</span>}
                    </div>
                  </div>
                  <QuoteMark mirror />
                </div>

                {/* Stars + spartan helmet */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, width: '100%', position: 'relative' }}>
                  {/* Spartan helmet SVG centered */}
                  <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 0 }}>
                    <svg width="28" height="28" viewBox="0 0 28 28" opacity="0.5">
                      <path d="M 14 2 C 8 2 4 6 4 11 C 4 14 5 16 6 18 L 6 24 L 10 24 L 10 20 C 11 21 12.5 22 14 22 C 15.5 22 17 21 18 20 L 18 24 L 22 24 L 22 18 C 23 16 24 14 24 11 C 24 6 20 2 14 2 Z"
                        fill={frameBright} />
                      <path d="M 4 11 C 4 7 6 4 9 3 L 8 8 C 6 9 5 10 5 13 Z" fill={accent} opacity="0.6" />
                      <rect x="10" y="16" width="8" height="2" rx="1" fill="#0a0404" />
                    </svg>
                  </div>
                  {/* Stars row */}
                  <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} style={{
                        fontSize: 16,
                        color: i < stars ? '#d4af37' : '#2a2020',
                        textShadow: i < stars ? '0 0 8px #d4af3780' : 'none',
                      }}>★</span>
                    ))}
                  </div>
                </div>
              </div>

            </div>{/* end card content */}
          </div>{/* end canvas */}
        </div>
      </div>
    </div>
  );
}
