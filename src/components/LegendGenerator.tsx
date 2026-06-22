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
const RARITY_EDITION: Record<LegendCard['rarity'], string> = {
  Commun: '2500', Rare: '1000', Epique: '500', Legendaire: '5000', Mythique: '100',
};

const CLASS_ACCENT: Record<LegendCard['characterClass'], string> = {
  Guerrier:    '#bf4040',
  Explorateur: '#3a9e5f',
  Savant:      '#3a7abf',
  Artiste:     '#bf407a',
  Fictionnel:  '#7a40bf',
  Penseur:     '#c9a84c',
  Dirigeant:   '#c97040',
  Athlete:     '#40b8a8',
};

const CLASS_ICONS: Record<LegendCard['characterClass'], React.ComponentType<any>> = {
  Guerrier: Sword, Explorateur: Compass, Savant: BookOpen, Artiste: Palette,
  Fictionnel: Sparkles, Penseur: Brain, Dirigeant: Crown, Athlete: Dumbbell,
};

const initialCard: LegendCard = {
  name: 'NOM DU PENSEUR',
  surname: 'NOM DE RÉFÉRENCE',
  era: 'ÈRE DE LA RÉFLEXION',
  origin: "LIEU DE L'ACADÉMIE",
  characterClass: 'Penseur',
  rarity: 'Legendaire',
  specialties: ['ANALYSE SYSTÉMIQUE', 'VISION PHILOSOPHIQUE', 'TRANSFORMATION SOCIALE'],
  keyAchievement: 'UN ÉCRIT MAJEUR OU UNE IDÉE QUI A CHANGÉ LE MONDE',
  flaw: "UNE FAIBLESSE PSYCHOLOGIQUE OU L'INCAPACITÉ D'AGIR",
  quote: 'CITATION ARCHÉTYPALE EN FRANÇAIS SUR LA PENSÉE',
  portraitUrl: null,
  cardNumber: 1,
};

// ──────────────────────────────────────────────────────
// SVG Components for the card canvas
// ──────────────────────────────────────────────────────

/** Large ornate metallic ring enclosing the circular portrait */
function PortraitRing({ diam, accent }: { diam: number; accent: string }) {
  const cx = diam / 2;
  const cy = diam / 2;
  const outerR = diam / 2 - 4;
  const ringW = 46;
  const innerR = outerR - ringW;

  // Tick marks around circumference
  const ticks = Array.from({ length: 120 }, (_, i) => {
    const angle = (i / 120) * Math.PI * 2 - Math.PI / 2;
    const major = i % 10 === 0;
    const medium = i % 5 === 0;
    const rOut = outerR - 2;
    const rIn = rOut - (major ? 14 : medium ? 9 : 5);
    return { angle, rOut, rIn, major, medium };
  });

  // Scroll ornament paths at bottom of ring (baroque flourishes)
  // These curve outward from below the ring at bottom
  const scrollW = 180;
  const scrollY = cy + outerR - 12;

  return (
    <svg width={diam} height={diam + 40} viewBox={`0 0 ${diam} ${diam + 40}`} style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
      <defs>
        <linearGradient id="ring-metal" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%"   stopColor="#b0b0b0" />
          <stop offset="20%"  stopColor="#e8e8e8" />
          <stop offset="40%"  stopColor="#c8c8c8" />
          <stop offset="60%"  stopColor="#a0a0a0" />
          <stop offset="80%"  stopColor="#d0d0d0" />
          <stop offset="100%" stopColor="#909090" />
        </linearGradient>
        <linearGradient id="ring-inner" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#505050" />
          <stop offset="50%"  stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#404040" />
        </linearGradient>
        <radialGradient id="ring-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="80%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.5)" />
        </radialGradient>
        <filter id="ring-drop" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.8)" />
        </filter>
        <filter id="scroll-glow">
          <feGaussianBlur stdDeviation="1.5" result="b" />
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <clipPath id="portrait-clip">
          <circle cx={cx} cy={cy} r={innerR} />
        </clipPath>
      </defs>

      {/* Drop shadow beneath ring */}
      <circle cx={cx} cy={cy} r={outerR + 8} fill="rgba(0,0,0,0.55)" filter="url(#ring-drop)" />

      {/* Ring body: metallic gradient fill */}
      <circle cx={cx} cy={cy} r={outerR} fill="url(#ring-metal)" />

      {/* Outer engraved groove */}
      <circle cx={cx} cy={cy} r={outerR - 4} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="3" />

      {/* Tick marks */}
      {ticks.map(({ angle, rOut, rIn, major, medium }, i) => (
        <line
          key={i}
          x1={cx + Math.cos(angle) * rOut}
          y1={cy + Math.sin(angle) * rOut}
          x2={cx + Math.cos(angle) * rIn}
          y2={cy + Math.sin(angle) * rIn}
          stroke={major ? accent : medium ? '#b0b0b0' : '#787878'}
          strokeWidth={major ? 2.5 : medium ? 1.8 : 1}
          strokeOpacity={major ? 1 : 0.7}
        />
      ))}

      {/* Diamond gems at 4 cardinal points */}
      {[0, 90, 180, 270].map((deg, i) => {
        const a = (deg * Math.PI) / 180;
        const rx = cx + Math.cos(a) * (outerR - ringW / 2);
        const ry = cy + Math.sin(a) * (outerR - ringW / 2);
        const size = 11;
        return (
          <polygon
            key={i}
            points={`${rx},${ry - size} ${rx + size * 0.65},${ry} ${rx},${ry + size} ${rx - size * 0.65},${ry}`}
            fill={accent}
            opacity="0.95"
          />
        );
      })}

      {/* Inner border groove */}
      <circle cx={cx} cy={cy} r={innerR + 4} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="3" />
      <circle cx={cx} cy={cy} r={innerR + 1} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />

      {/* Ring inner dark fill (behind portrait) */}
      <circle cx={cx} cy={cy} r={innerR} fill="#0c1018" />

      {/* Scroll ornaments at bottom of ring */}
      {/* Left scroll arm */}
      <g filter="url(#scroll-glow)" opacity="0.85">
        <path
          d={`M ${cx} ${scrollY + 10}
              C ${cx - 40} ${scrollY + 8} ${cx - 80} ${scrollY + 22} ${cx - 110} ${scrollY + 18}
              C ${cx - 140} ${scrollY + 14} ${cx - 155} ${scrollY - 2} ${cx - 145} ${scrollY - 14}
              C ${cx - 135} ${scrollY - 26} ${cx - 110} ${scrollY - 24} ${cx - 100} ${scrollY - 12}
              C ${cx - 90} ${scrollY} ${cx - 105} ${scrollY + 14} ${cx - 120} ${scrollY + 10}`}
          stroke="#c8c8c8" strokeWidth="2.5" fill="none" strokeLinecap="round"
        />
        <path
          d={`M ${cx - 50} ${scrollY + 14}
              C ${cx - 55} ${scrollY + 24} ${cx - 65} ${scrollY + 32} ${cx - 80} ${scrollY + 28}
              C ${cx - 95} ${scrollY + 24} ${cx - 98} ${scrollY + 10} ${cx - 88} ${scrollY + 4}`}
          stroke="#b0b0b0" strokeWidth="2" fill="none" strokeLinecap="round"
        />
        {/* Small leaf/petal accents */}
        <path d={`M ${cx - 130} ${scrollY} C ${cx - 148} ${scrollY - 10} ${cx - 148} ${scrollY - 22} ${cx - 130} ${scrollY - 16}`}
          stroke={accent} strokeWidth="1.8" fill="none" strokeOpacity="0.8" />
      </g>

      {/* Right scroll arm (mirror) */}
      <g filter="url(#scroll-glow)" opacity="0.85">
        <path
          d={`M ${cx} ${scrollY + 10}
              C ${cx + 40} ${scrollY + 8} ${cx + 80} ${scrollY + 22} ${cx + 110} ${scrollY + 18}
              C ${cx + 140} ${scrollY + 14} ${cx + 155} ${scrollY - 2} ${cx + 145} ${scrollY - 14}
              C ${cx + 135} ${scrollY - 26} ${cx + 110} ${scrollY - 24} ${cx + 100} ${scrollY - 12}
              C ${cx + 90} ${scrollY} ${cx + 105} ${scrollY + 14} ${cx + 120} ${scrollY + 10}`}
          stroke="#c8c8c8" strokeWidth="2.5" fill="none" strokeLinecap="round"
        />
        <path
          d={`M ${cx + 50} ${scrollY + 14}
              C ${cx + 55} ${scrollY + 24} ${cx + 65} ${scrollY + 32} ${cx + 80} ${scrollY + 28}
              C ${cx + 95} ${scrollY + 24} ${cx + 98} ${scrollY + 10} ${cx + 88} ${scrollY + 4}`}
          stroke="#b0b0b0" strokeWidth="2" fill="none" strokeLinecap="round"
        />
        <path d={`M ${cx + 130} ${scrollY} C ${cx + 148} ${scrollY - 10} ${cx + 148} ${scrollY - 22} ${cx + 130} ${scrollY - 16}`}
          stroke={accent} strokeWidth="1.8" fill="none" strokeOpacity="0.8" />
      </g>

      {/* Center ornament at bottom */}
      <path d={`M ${cx - 18} ${scrollY + 22} L ${cx} ${scrollY + 32} L ${cx + 18} ${scrollY + 22}`}
        stroke={accent} strokeWidth="2" fill="none" strokeOpacity="0.7" />
      <circle cx={cx} cy={scrollY + 34} r="4" fill={accent} opacity="0.7" />
    </svg>
  );
}

/** Scroll/manuscript illustration for top-left corner */
function ScrollIllustration() {
  return (
    <svg width="150" height="130" viewBox="0 0 150 130" style={{ opacity: 0.45 }}>
      {/* Main scroll body */}
      <path d="M 30 20 Q 20 16 22 28 L 38 100 Q 40 112 52 108 L 120 92 Q 132 88 128 76 L 112 20 Q 108 8 96 10 L 38 14 Q 26 12 30 20 Z"
        fill="#3a3018" stroke="#6a5830" strokeWidth="1.5" />
      {/* Scroll curl top-left */}
      <path d="M 30 20 Q 22 10 28 8 Q 36 6 38 14" fill="#4a4022" stroke="#7a6840" strokeWidth="1.2" />
      {/* Scroll curl bottom-left */}
      <path d="M 38 100 Q 28 108 28 114 Q 30 118 38 114 Q 46 110 40 104" fill="#4a4022" stroke="#7a6840" strokeWidth="1.2" />
      {/* Text lines on scroll */}
      <line x1="55" y1="32" x2="110" y2="26" stroke="#9a8040" strokeWidth="1" opacity="0.7" />
      <line x1="56" y1="44" x2="112" y2="38" stroke="#9a8040" strokeWidth="1" opacity="0.6" />
      <line x1="57" y1="56" x2="113" y2="50" stroke="#9a8040" strokeWidth="1" opacity="0.5" />
      <line x1="58" y1="68" x2="114" y2="62" stroke="#9a8040" strokeWidth="1" opacity="0.5" />
      <line x1="60" y1="80" x2="116" y2="74" stroke="#9a8040" strokeWidth="1" opacity="0.4" />
      {/* Second small scroll */}
      <path d="M 60 104 Q 54 98 56 108 L 64 130 Q 66 138 74 136 L 140 122 Q 146 120 144 112 L 136 90 Q 134 82 126 84 L 68 96 Q 58 98 60 104 Z"
        fill="#382c14" stroke="#5a4820" strokeWidth="1.2" />
    </svg>
  );
}

/** Owl illustration for top-right corner */
function OwlIllustration() {
  return (
    <svg width="100" height="120" viewBox="0 0 100 120" style={{ opacity: 0.45 }}>
      {/* Body */}
      <ellipse cx="50" cy="78" rx="30" ry="36" fill="#2a2218" stroke="#5a4830" strokeWidth="1.5" />
      {/* Head */}
      <ellipse cx="50" cy="38" rx="26" ry="24" fill="#2a2218" stroke="#5a4830" strokeWidth="1.5" />
      {/* Ear tufts */}
      <path d="M 34 20 L 28 6 L 38 16" fill="#2a2218" stroke="#5a4830" strokeWidth="1.2" />
      <path d="M 66 20 L 72 6 L 62 16" fill="#2a2218" stroke="#5a4830" strokeWidth="1.2" />
      {/* Eyes */}
      <circle cx="40" cy="38" r="10" fill="#1a1408" stroke="#c9a020" strokeWidth="1.5" />
      <circle cx="60" cy="38" r="10" fill="#1a1408" stroke="#c9a020" strokeWidth="1.5" />
      <circle cx="40" cy="38" r="5" fill="#e0c040" />
      <circle cx="60" cy="38" r="5" fill="#e0c040" />
      <circle cx="40" cy="38" r="2.5" fill="#0a0808" />
      <circle cx="60" cy="38" r="2.5" fill="#0a0808" />
      {/* Beak */}
      <path d="M 44 46 L 50 52 L 56 46 Q 50 43 44 46 Z" fill="#9a7820" />
      {/* Wing feathers */}
      <path d="M 22 62 C 14 68 12 82 18 90 C 22 96 32 96 36 88" fill="none" stroke="#4a3c20" strokeWidth="2" />
      <path d="M 78 62 C 86 68 88 82 82 90 C 78 96 68 96 64 88" fill="none" stroke="#4a3c20" strokeWidth="2" />
      {/* Feather detail lines on body */}
      {[60, 70, 80, 90, 100].map((y, i) => (
        <path key={i} d={`M ${26 + i * 2} ${y} Q 50 ${y - 6} ${74 - i * 2} ${y}`}
          fill="none" stroke="#4a3c20" strokeWidth="1" opacity="0.5" />
      ))}
      {/* Perch */}
      <rect x="30" y="110" width="40" height="6" rx="3" fill="#3a2c14" stroke="#5a4020" strokeWidth="1" />
    </svg>
  );
}

/** Specialty badge with metallic look and gold left accent */
function SpecialtyBadge({ text, accent }: { text: string; accent: string }) {
  return (
    <div style={{
      flex: 1,
      position: 'relative',
      background: 'linear-gradient(180deg, #323232 0%, #242424 50%, #2c2c2c 100%)',
      border: '1.5px solid #606060',
      borderRadius: 6,
      padding: '11px 10px 11px 18px',
      textAlign: 'center',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 6px rgba(0,0,0,0.6)',
      overflow: 'hidden',
    }}>
      {/* Gold left accent triangle */}
      <div style={{
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: 8,
        background: `linear-gradient(180deg, ${accent}cc, ${accent}ee, ${accent}cc)`,
        boxShadow: `2px 0 6px ${accent}60`,
      }} />
      {/* Inner highlight */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, height: 1,
        background: 'rgba(255,255,255,0.12)',
      }} />
      <span style={{
        fontSize: 15,
        fontWeight: 800,
        color: '#d8d8d8',
        fontFamily: '"Arial", sans-serif',
        letterSpacing: '0.5px',
        lineHeight: 1.25,
        display: 'block',
        textTransform: 'uppercase',
      }}>
        {text || 'SPÉCIALITÉ'}
      </span>
    </div>
  );
}

/** Celtic knot side ornament for achievement block */
function CelticKnot({ height }: { height: number }) {
  const w = 28;
  return (
    <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`}>
      {Array.from({ length: Math.floor(height / 22) }).map((_, i) => {
        const y = i * 22 + 11;
        return (
          <g key={i}>
            <path d={`M ${w / 2 - 8} ${y - 8} C ${w / 2 + 2} ${y - 4} ${w / 2 + 2} ${y + 4} ${w / 2 - 8} ${y + 8}`}
              stroke="#888" strokeWidth="2" fill="none" />
            <path d={`M ${w / 2 + 8} ${y - 8} C ${w / 2 - 2} ${y - 4} ${w / 2 - 2} ${y + 4} ${w / 2 + 8} ${y + 8}`}
              stroke="#888" strokeWidth="2" fill="none" />
            <path d={`M ${w / 2 - 8} ${y} C ${w / 2 - 4} ${y - 3} ${w / 2 + 4} ${y - 3} ${w / 2 + 8} ${y}`}
              stroke="#666" strokeWidth="1.5" fill="none" />
          </g>
        );
      })}
    </svg>
  );
}

// ──────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────

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

  const update = (field: keyof LegendCard, value: string | number) =>
    setCard(prev => ({ ...prev, [field]: value }));

  const updateSpec = (i: number, v: string) =>
    setCard(prev => {
      const s = [...prev.specialties] as [string, string, string];
      s[i] = v.toUpperCase();
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
    cacheBust: true, pixelRatio: 2, width: CANVAS_W, height: CANVAS_H,
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
      a.download = `legend-${card.name.replace(/\s+/g, '-')}-${String(card.cardNumber).padStart(4, '0')}.${format}`;
      a.href = url;
      a.click();
    } catch (err) {
      console.error('Download failed', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSave = async () => {
    if (!user) { setSaveError('Connectez-vous pour sauvegarder'); return; }
    if (!card.portraitUrl) { setSaveError('Uploadez un portrait'); return; }
    setIsSaving(true); setSaveError(null);
    try {
      await new Promise(r => setTimeout(r, 150));
      const img = await toPng(previewRef.current!, exportOpts);
      await savePost({
        type: 'legend', title: `${card.name} — ${card.surname}`,
        imageUrl: img, authorName: user.displayName || 'Anonymous',
        metadata: { firebaseUid: user.uid, card: { ...card, portraitUrl: '' } },
      });
      alert('Carte sauvegardée !');
      const n = await getNextLegendCardNumber();
      setNextCardNumber(n);
      update('cardNumber', n);
    } catch (err: any) {
      setSaveError(err?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const accent = CLASS_ACCENT[card.characterClass];
  const stars = RARITY_STARS[card.rarity];
  const rarityLabel = RARITY_FR[card.rarity];
  const edition = RARITY_EDITION[card.rarity];
  const cardNumStr = String(card.cardNumber).padStart(4, '0');
  const ClassIcon = CLASS_ICONS[card.characterClass];

  // Ring layout constants
  const RING_DIAM = 876;
  const RING_TOP = 90;
  const RING_LEFT = (CANVAS_W - RING_DIAM) / 2; // 102px on each side
  const RING_OUTER_R = RING_DIAM / 2 - 4;
  const RING_INNER_R = RING_OUTER_R - 46;
  const PORTRAIT_DIAM = RING_INNER_R * 2;

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
          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">Classe</p>
          <div className="grid grid-cols-4 gap-2">
            {CLASSES.map(cls => {
              const a = CLASS_ACCENT[cls];
              const Icon = CLASS_ICONS[cls];
              return (
                <button key={cls} onClick={() => update('characterClass', cls)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-[10px] text-neutral-400"
                  style={{ borderColor: card.characterClass === cls ? a : '#333', background: card.characterClass === cls ? `${a}25` : 'transparent' }}>
                  <Icon size={16} style={{ color: a }} />
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
                style={{
                  borderColor: card.rarity === r ? accent : '#333',
                  background: card.rarity === r ? `${accent}25` : 'transparent',
                  color: card.rarity === r ? accent : '#555',
                }}>
                {RARITY_FR[r]}
              </button>
            ))}
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-[#141414] p-4 rounded-xl border border-neutral-800 space-y-3">
          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">Informations</p>
          {[
            { label: 'NOM', field: 'name' as const },
            { label: 'SURNOM / TITRE', field: 'surname' as const },
            { label: 'ÈRE', field: 'era' as const },
            { label: 'ORIGINE', field: 'origin' as const },
          ].map(({ label, field }) => (
            <div key={field}>
              <label className="block text-[10px] text-neutral-600 mb-1 uppercase tracking-wider">{label}</label>
              <input type="text" value={card[field] as string} onChange={e => update(field, e.target.value)}
                className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                style={{ '--tw-ring-color': accent } as any}
              />
            </div>
          ))}
        </div>

        {/* Portrait */}
        <div className="bg-[#141414] p-4 rounded-xl border border-neutral-800 space-y-3">
          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">Portrait</p>
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
          <div onClick={() => fileInputRef.current?.click()}
            className="w-full h-40 bg-[#0a0a0a] border-2 border-dashed border-neutral-800 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden hover:border-neutral-600">
            {card.portraitUrl
              ? <img src={card.portraitUrl} alt="" className="w-full h-full object-cover object-top" />
              : <><ImageIcon className="w-8 h-8 text-neutral-700 mb-2" /><span className="text-xs text-neutral-600">Cliquer pour uploader le portrait</span></>}
          </div>
        </div>

        {/* Specialties */}
        <div className="bg-[#141414] p-4 rounded-xl border border-neutral-800 space-y-3">
          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">Spécialités (3)</p>
          {card.specialties.map((s, i) => (
            <div key={i}>
              <label className="block text-[10px] text-neutral-600 mb-1 uppercase tracking-wider">Spécialité {i + 1}</label>
              <input type="text" value={s} onChange={e => updateSpec(i, e.target.value)}
                className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none uppercase" />
            </div>
          ))}
        </div>

        {/* Details */}
        <div className="bg-[#141414] p-4 rounded-xl border border-neutral-800 space-y-3">
          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">Détails</p>
          {[
            { label: 'Réalisation Clef', field: 'keyAchievement' as const },
            { label: 'Faille Légendaire', field: 'flaw' as const },
            { label: 'Citation', field: 'quote' as const },
          ].map(({ label, field }) => (
            <div key={field}>
              <label className="block text-[10px] text-neutral-600 mb-1 uppercase tracking-wider">{label}</label>
              <textarea value={card[field] as string} onChange={e => update(field, e.target.value)}
                rows={2} className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none resize-none uppercase" />
            </div>
          ))}
        </div>

        {/* Card number */}
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
            {user ? 'Sauvegarder la carte' : 'Se connecter pour sauvegarder'}
          </button>
        </div>
      </div>

      {/* ─── PREVIEW ─── */}
      <div className="lg:col-span-7 flex justify-center items-start overflow-auto">
        <div ref={containerRef}
          className="w-full max-w-[410px] xl:max-w-[440px] aspect-[4/5] relative rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 0 60px rgba(0,0,0,0.9), 0 0 120px rgba(0,0,0,0.6)' }}>

          {/* ──────────────── CANVAS 1080 × 1350 ──────────────── */}
          <div ref={previewRef} style={{
            position: 'absolute', top: 0, left: 0,
            width: `${CANVAS_W}px`, height: `${CANVAS_H}px`,
            transform: `scale(${previewScale})`, transformOrigin: 'top left',
            fontFamily: '"Arial", "Helvetica", sans-serif',
            overflow: 'hidden',
            background: '#1a2030',
          }}>

            {/* ── Background: dark slate with topographic texture ── */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(160deg, #1c2438 0%, #141926 45%, #10161e 70%, #181e2c 100%)',
            }} />
            {/* Map/topo grid lines */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `
                linear-gradient(rgba(80,100,140,0.035) 1px, transparent 1px),
                linear-gradient(90deg, rgba(80,100,140,0.035) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }} />
            {/* Subtle contour map curves (organic blobs simulating topo lines) */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06 }} viewBox="0 0 1080 1350">
              <path d="M 0 800 Q 200 750 400 820 Q 600 890 800 830 Q 950 790 1080 850" stroke="#8090a0" strokeWidth="1" fill="none" />
              <path d="M 0 830 Q 250 775 450 845 Q 650 915 850 855 Q 1000 815 1080 875" stroke="#8090a0" strokeWidth="1" fill="none" />
              <path d="M 0 860 Q 300 800 500 870 Q 700 940 900 880 Q 1020 840 1080 900" stroke="#8090a0" strokeWidth="1" fill="none" />
              <path d="M 100 1100 Q 300 1050 500 1120 Q 700 1190 900 1130 Q 1020 1090 1080 1150" stroke="#8090a0" strokeWidth="0.8" fill="none" />
              <path d="M 0 200 Q 200 180 350 220 Q 500 260 700 200 Q 900 140 1080 180" stroke="#8090a0" strokeWidth="0.8" fill="none" />
            </svg>

            {/* ── Holographic rainbow border (left and right edges) ── */}
            {/* Left edge shimmer */}
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0, width: 10,
              background: 'linear-gradient(180deg, #ff0040 0%, #ff7000 12%, #ffd700 25%, #40ff40 38%, #00cfff 50%, #7040ff 62%, #ff0080 75%, #ff5500 88%, #ffd700 100%)',
              opacity: 0.7,
            }} />
            {/* Right edge shimmer */}
            <div style={{
              position: 'absolute', top: 0, right: 0, bottom: 0, width: 10,
              background: 'linear-gradient(180deg, #ffd700 0%, #ff0080 12%, #7040ff 25%, #00cfff 38%, #40ff40 50%, #ffd700 62%, #ff7000 75%, #ff0040 88%, #7040ff 100%)',
              opacity: 0.7,
            }} />

            {/* ── Outer card frame ── */}
            <div style={{
              position: 'absolute',
              top: 14, left: 14, right: 14, bottom: 14,
              border: '2px solid #3a3a3a',
              borderRadius: 16,
              boxShadow: 'inset 0 0 0 1px rgba(180,160,80,0.15)',
              pointerEvents: 'none',
            }} />
            {/* Inner thin line */}
            <div style={{
              position: 'absolute',
              top: 20, left: 20, right: 20, bottom: 20,
              border: '1px solid rgba(160,140,60,0.2)',
              borderRadius: 12,
              pointerEvents: 'none',
            }} />

            {/* ── Corner bracket ornaments ── */}
            {([
              { top: 18, left: 18 },
              { top: 18, right: 18 },
              { bottom: 18, left: 18 },
              { bottom: 18, right: 18 },
            ] as React.CSSProperties[]).map((pos, i) => (
              <svg key={i} width="36" height="36" viewBox="0 0 36 36"
                style={{ position: 'absolute', ...pos, opacity: 0.7 }}>
                {/* Outer corner */}
                <path d={`M 2 20 L 2 4 Q 2 2 4 2 L 20 2`}
                  stroke="#c9a84c" strokeWidth="2" fill="none"
                  transform={i === 1 || i === 3 ? 'scale(-1,1) translate(-36,0)' : i === 2 || i === 3 ? 'scale(1,-1) translate(0,-36)' : ''}
                />
                {i === 2 || i === 3
                  ? <path d={`M 2 20 L 2 4 Q 2 2 4 2 L 20 2`} stroke="#c9a84c" strokeWidth="2" fill="none" transform={`scale(${i === 3 ? -1 : 1},-1) translate(${i === 3 ? -36 : 0},-36)`} />
                  : null}
                <circle cx={i % 2 === 0 ? 6 : 30} cy={i < 2 ? 6 : 30} r="3" fill="#c9a84c" opacity="0.8" />
              </svg>
            ))}

            {/* ── Corner illustrations ── */}
            {/* Scrolls top-left */}
            <div style={{ position: 'absolute', top: 80, left: 18 }}>
              <ScrollIllustration />
            </div>
            {/* Owl top-right */}
            <div style={{ position: 'absolute', top: 78, right: 18 }}>
              <OwlIllustration />
            </div>

            {/* ── DOSSIER BANNER ── */}
            <div style={{
              position: 'absolute', top: 30, left: '50%',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              zIndex: 10,
            }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 14,
                background: 'linear-gradient(180deg, #2c2c2c 0%, #1c1c1c 40%, #161616 100%)',
                border: '1px solid #5a5a5a',
                borderRadius: 6,
                padding: '9px 26px',
                boxShadow: '0 2px 16px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: `radial-gradient(circle at 35% 35%, ${accent}ff, ${accent}99)`,
                  boxShadow: `0 0 8px ${accent}cc`,
                }} />
                <span style={{
                  fontSize: 18, fontWeight: 700, letterSpacing: '3px',
                  fontFamily: '"Arial", sans-serif', textTransform: 'uppercase',
                  background: 'linear-gradient(180deg, #dcdcdc 0%, #b0b0b0 50%, #989898 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  DOSSIER N° {card.cardNumber} • NIVEAU : {rarityLabel}
                </span>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: `radial-gradient(circle at 35% 35%, ${accent}ff, ${accent}99)`,
                  boxShadow: `0 0 8px ${accent}cc`,
                }} />
              </div>
            </div>

            {/* ── PORTRAIT RING + IMAGE ── */}
            <div style={{
              position: 'absolute',
              top: RING_TOP,
              left: RING_LEFT,
              width: RING_DIAM,
              height: RING_DIAM,
              zIndex: 2,
            }}>
              {/* Portrait image (circular, clipped) */}
              <div style={{
                position: 'absolute',
                top: (RING_DIAM / 2) - RING_INNER_R,
                left: (RING_DIAM / 2) - RING_INNER_R,
                width: PORTRAIT_DIAM,
                height: PORTRAIT_DIAM,
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'linear-gradient(160deg, #141824, #0c1018)',
                zIndex: 1,
              }}>
                {card.portraitUrl
                  ? <img src={card.portraitUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
                      <ImageIcon size={80} style={{ color: '#282830' }} />
                      <span style={{ fontSize: 16, color: '#383840', fontFamily: 'sans-serif' }}>Portrait</span>
                    </div>
                }
              </div>

              {/* Ornate ring on top */}
              <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
                <PortraitRing diam={RING_DIAM} accent={accent} />
              </div>
            </div>

            {/* ── INFO SECTION ── */}
            <div style={{
              position: 'absolute',
              top: RING_TOP + RING_DIAM + 10,
              left: 60, right: 60,
              zIndex: 3,
            }}>

              {/* NOM + ÈRE */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 16, marginBottom: 6, flexWrap: 'wrap' }}>
                <span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: accent, letterSpacing: '1.5px' }}>NOM </span>
                  <span style={{ fontSize: 16, fontWeight: 400, color: '#ddd', fontStyle: 'normal' }}>[{card.name}]</span>
                </span>
                <span style={{ color: '#3a3a3a', fontSize: 12 }}>•</span>
                <span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: accent, letterSpacing: '1.5px' }}>ÈRE </span>
                  <span style={{ fontSize: 14, fontWeight: 400, color: '#aaa' }}>[{card.era}]</span>
                </span>
              </div>

              {/* ORIGINE + CLASSE */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
                <span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: accent, letterSpacing: '1.5px' }}>ORIGINE </span>
                  <span style={{ fontSize: 14, fontWeight: 400, color: '#aaa' }}>[{card.origin}]</span>
                </span>
                <span style={{ color: '#3a3a3a', fontSize: 12 }}>•</span>
                <span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: accent, letterSpacing: '1.5px' }}>CLASSE </span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#e0e0e0' }}>{card.characterClass.toUpperCase()}</span>
                </span>
              </div>

              {/* SURNOM banner */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 0,
                marginBottom: 14, overflow: 'hidden',
              }}>
                {/* Left ornament line */}
                <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${accent}80)` }} />
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 16px',
                  background: 'rgba(0,0,0,0.4)',
                  border: `1px solid ${accent}60`,
                  borderRadius: 4,
                  flexShrink: 0,
                }}>
                  <span style={{ color: accent, fontSize: 16, opacity: 0.8 }}>❧</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: accent, letterSpacing: '2px', textTransform: 'uppercase' }}>
                    SURNOM / TITRE :
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#e0d8c0', fontStyle: 'italic', textTransform: 'uppercase' }}>
                    [{card.surname}]
                  </span>
                  <span style={{ color: accent, fontSize: 16, opacity: 0.8, transform: 'scaleX(-1)', display: 'inline-block' }}>❧</span>
                </div>
                {/* Right ornament line */}
                <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${accent}80, transparent)` }} />
              </div>

              {/* SPECIALTY BADGES */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                {card.specialties.map((spec, i) => (
                  <SpecialtyBadge key={i} text={spec} accent={accent} />
                ))}
              </div>

              {/* ACHIEVEMENT & FLAW BLOCK with Celtic side knots */}
              <div style={{ display: 'flex', alignItems: 'stretch', gap: 6, marginBottom: 12 }}>
                {/* Left Celtic knot */}
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  <CelticKnot height={86} />
                </div>

                <div style={{
                  flex: 1,
                  background: 'linear-gradient(180deg, rgba(10,12,18,0.8), rgba(16,20,28,0.8))',
                  border: `1px solid ${accent}50`,
                  borderRadius: 4,
                  padding: '12px 16px',
                  position: 'relative',
                }}>
                  {/* Corner accents */}
                  {[{tl: true}, {tr: true}, {bl: true}, {br: true}].map((_, ci) => (
                    <svg key={ci} width="12" height="12" viewBox="0 0 12 12" style={{
                      position: 'absolute',
                      top: ci < 2 ? -1 : undefined, bottom: ci >= 2 ? -1 : undefined,
                      left: ci % 2 === 0 ? -1 : undefined, right: ci % 2 === 1 ? -1 : undefined,
                    }}>
                      <path d={ci % 2 === 0
                        ? (ci < 2 ? 'M 1 10 L 1 1 L 10 1' : 'M 1 2 L 1 11 L 10 11')
                        : (ci < 2 ? 'M 11 10 L 11 1 L 2 1' : 'M 11 2 L 11 11 L 2 11')}
                        stroke={accent} strokeWidth="2" fill="none" />
                    </svg>
                  ))}

                  {/* Réalisation Clef */}
                  <div style={{ marginBottom: 8, lineHeight: 1.35 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: accent }}>RÉALISATION CLEF : </span>
                    <span style={{ fontSize: 14, fontWeight: 400, color: '#d8d0c0' }}>[{card.keyAchievement}]</span>
                  </div>
                  {/* Faille Légendaire */}
                  <div style={{ lineHeight: 1.35 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: accent }}>FAILLE LÉGENDAIRE : </span>
                    <span style={{ fontSize: 14, fontWeight: 400, color: '#d8d0c0' }}>[{card.flaw}]</span>
                  </div>
                </div>

                {/* Right Celtic knot */}
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  <CelticKnot height={86} />
                </div>
              </div>

              {/* QUOTE BOX */}
              <div style={{
                border: `2px solid ${accent}90`,
                borderRadius: 4,
                padding: '12px 18px',
                background: 'rgba(0,0,0,0.45)',
                textAlign: 'center',
                marginBottom: 12,
                position: 'relative',
                boxShadow: `inset 0 0 20px rgba(0,0,0,0.4), 0 0 12px ${accent}20`,
              }}>
                {/* Inner inset line */}
                <div style={{
                  position: 'absolute', inset: 3,
                  border: `1px solid ${accent}35`,
                  borderRadius: 2,
                  pointerEvents: 'none',
                }} />
                <span style={{
                  fontSize: 15, fontStyle: 'italic',
                  color: '#ddd8c0', fontFamily: '"Georgia", "Times New Roman", serif',
                  lineHeight: 1.4,
                }}>
                  « [{card.quote}] »
                </span>
              </div>

              {/* STARS */}
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} style={{
                    fontSize: 22, margin: '0 4px',
                    color: i < stars ? accent : '#2a2a2a',
                    textShadow: i < stars ? `0 0 10px ${accent}bb` : 'none',
                  }}>★</span>
                ))}
              </div>
            </div>

            {/* ── FOOTER ── */}
            <div style={{
              position: 'absolute', bottom: 22,
              left: 0, right: 0, textAlign: 'center',
            }}>
              <span style={{
                fontSize: 11, fontFamily: '"Arial", sans-serif',
                color: '#3a3a3a', letterSpacing: '2.5px', textTransform: 'uppercase',
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
