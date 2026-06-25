import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import {
  CreditCard, LayoutGrid, Image, Palette, Download, Settings, ChevronLeft, Sparkles
} from 'lucide-react';
import { supabase } from '../supabase';
import { getPostsByType, savePost, deletePost, getNextLegendCardNumber } from '../lib/postService';
import type { LegendCard, SavedPost } from '../types';

// Design System Colors
const COLORS = {
  bgGlobal: '#0a0a0a',
  surface1: '#0e0e0e',
  surface2: '#151515',
  surface3: '#1a1a1a',
  border: '#222222',
  accentGold: '#D4AF37',
  accentGoldBg: '#1a1500',
  textPrimary: '#e0e0e0',
  textSecondary: '#888888',
  textTertiary: '#444444',
};

// Class Themes with palettes
const CLASS_THEMES: Record<LegendCard['characterClass'], {
  name: string;
  bg: string;
  accent: string;
  text: string;
  secondary: string;
}> = {
  Guerrier: { name: 'Guerrier', bg: '#0D0D0D', accent: '#7A0000', text: '#D4AF37', secondary: '#8B0000' },
  Explorateur: { name: 'Explorateur', bg: '#0D4D6D', accent: '#2E6B57', text: '#D9C49A', secondary: '#1A4A5A' },
  Savant: { name: 'Savant', bg: '#009DFF', accent: '#00D9FF', text: '#F5F5F5', secondary: '#0066AA' },
  Artiste: { name: 'Artiste', bg: '#6B2D90', accent: '#E048C7', text: '#D9B56D', secondary: '#4A1D70' },
  Fictionnel: { name: 'Fictionnel', bg: '#1A1A2E', accent: '#4A4A6A', text: '#C0C0C0', secondary: '#2A2A3E' },
  Penseur: { name: 'Penseur', bg: '#8B6A3D', accent: '#F5E8C7', text: '#6E6E6E', secondary: '#6B5030' },
  Dirigeant: { name: 'Dirigeant', bg: '#102A56', accent: '#D4AF37', text: '#7C1F1F', secondary: '#0A1A3A' },
  Athlete: { name: 'Athlete', bg: '#111111', accent: '#D4AF37', text: '#00AA55', secondary: '#1A1A1A' },
};

// Rarity effects
const RARITY_CONFIG: Record<LegendCard['rarity'], { label: string; effect: string }> = {
  Commun: { label: 'Commun', effect: 'none' },
  Rare: { label: 'Rare', effect: 'matte' },
  Epique: { label: 'Epique', effect: 'shimmer' },
  Legendaire: { label: 'Legendaire', effect: 'particles' },
  Mythique: { label: 'Mythique', effect: 'holo' },
};

// Default card state
const DEFAULT_CARD: LegendCard = {
  name: '',
  surname: '',
  era: '',
  origin: '',
  characterClass: 'Guerrier',
  rarity: 'Commun',
  specialties: ['', '', '', ''],
  keyAchievement: '',
  flaw: '',
  quote: '',
  portraitUrl: null,
  cardNumber: 1,
};

type ViewMode = 'editor' | 'gallery';

export default function LegendBuilder() {
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [card, setCard] = useState<LegendCard>(DEFAULT_CARD);
  const [savedCards, setSavedCards] = useState<SavedPost[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [filterClass, setFilterClass] = useState<LegendCard['characterClass'] | 'all'>('all');
  const [filterRarity, setFilterRarity] = useState<LegendCard['rarity'] | 'all'>('all');

  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load cards on mount
  useEffect(() => {
    loadCards();
    initCardNumber();
  }, []);

  const loadCards = async () => {
    try {
      const posts = await getPostsByType('legend', { limit: 100, includeImageData: false });
      setSavedCards(posts);
    } catch (err) {
      console.error('Failed to load cards:', err);
    }
  };

  const initCardNumber = async () => {
    const nextNum = await getNextLegendCardNumber();
    setCard(prev => ({ ...prev, cardNumber: nextNum }));
  };

  // Update card field
  const updateCard = <K extends keyof LegendCard>(field: K, value: LegendCard[K]) => {
    setCard(prev => ({ ...prev, [field]: value }));
  };

  // Update specialty at index
  const updateSpecialty = (index: number, value: string) => {
    setCard(prev => {
      const newSpecs = [...prev.specialties] as [string, string, string, string];
      newSpecs[index] = value;
      return { ...prev, specialties: newSpecs };
    });
  };

  // Handle portrait upload
  const handlePortraitUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setCard(prev => ({ ...prev, portraitUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  // Filter gallery cards
  const filteredCards = savedCards.filter(post => {
    const cardData = post.metadata?.card as LegendCard | undefined;
    if (!cardData) return false;
    if (filterClass !== 'all' && cardData.characterClass !== filterClass) return false;
    if (filterRarity !== 'all' && cardData.rarity !== filterRarity) return false;
    return true;
  });

  // Save card to database
  const handleSave = async () => {
    try {
      const post: SavedPost = {
        type: 'legend',
        title: card.name || 'Sans nom',
        description: card.surname || '',
        imageUrl: card.portraitUrl || '',
        authorName: 'Anonyme',
        metadata: { card },
      };

      const saved = await savePost(post);
      if (saved) {
        await loadCards();
        await initCardNumber();
        setSelectedCardId(saved.id || null);
      }
    } catch (err) {
      console.error('Failed to save card:', err);
      alert('Erreur lors de la sauvegarde');
    }
  };

  // Load card from gallery
  const handleLoadCard = (post: SavedPost) => {
    const cardData = post.metadata?.card as LegendCard;
    if (cardData) {
      setCard(cardData);
      setSelectedCardId(post.id || null);
      setViewMode('editor');
    }
  };

  // Delete card
  const handleDeleteCard = async (id: string) => {
    if (!confirm('Supprimer cette carte ?')) return;
    try {
      await deletePost(id);
      await loadCards();
      if (selectedCardId === id) {
        setSelectedCardId(null);
        setCard(DEFAULT_CARD);
        await initCardNumber();
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  // Export to PNG
  const handleExport = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: null,
      });
      const link = document.createElement('a');
      link.download = `${card.name || 'legend'}-${card.cardNumber}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Erreur lors de l\'export');
    } finally {
      setIsExporting(false);
    }
  };

  const theme = CLASS_THEMES[card.characterClass];
  const rarityConfig = RARITY_CONFIG[card.rarity];

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: COLORS.bgGlobal, fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar Navbar */}
      <nav style={{
        width: 56,
        backgroundColor: COLORS.surface1,
        borderRight: `1px solid ${COLORS.border}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 0',
        gap: 8,
      }}>
        <NavButton icon={<CreditCard size={22} />} active={viewMode === 'editor'} onClick={() => setViewMode('editor')} title="Editeur" />
        <NavButton icon={<LayoutGrid size={22} />} active={viewMode === 'gallery'} onClick={() => setViewMode('gallery')} title="Galerie" />
        <div style={{ height: 1, width: 32, backgroundColor: COLORS.border, margin: '8px 0' }} />
        <NavButton icon={<Image size={22} />} onClick={() => fileInputRef.current?.click()} title="Portrait" />
        <NavButton icon={<Palette size={22} />} title="Theme" />
        <div style={{ flex: 1 }} />
        <NavButton icon={<Download size={22} />} onClick={handleExport} title="Export PNG" />
        <NavButton icon={<Settings size={22} />} title="Parametres" />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePortraitUpload}
          style={{ display: 'none' }}
        />
      </nav>

      {/* Main Canvas Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header Bar */}
        <header style={{
          height: 48,
          backgroundColor: COLORS.surface1,
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 12,
        }}>
          {viewMode === 'gallery' && (
            <button
              onClick={() => setViewMode('editor')}
              style={{
                background: 'none',
                border: 'none',
                color: COLORS.textSecondary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <ChevronLeft size={18} />
              <span style={{ fontSize: 14 }}>Retour</span>
            </button>
          )}
          <h1 style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            color: COLORS.textPrimary,
            fontFamily: 'Bebas Neue, sans-serif',
            letterSpacing: 1,
          }}>
            {viewMode === 'editor' ? 'FICHE LEGENDE' : 'COLLECTION'}
          </h1>
          {selectedCardId && viewMode === 'editor' && (
            <span style={{
              fontSize: 11,
              color: COLORS.accentGold,
              backgroundColor: COLORS.accentGoldBg,
              padding: '2px 8px',
              borderRadius: 4,
            }}>
              Carte sauvegardee
            </span>
          )}
        </header>

        {/* Canvas Content */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 32 }}>
          {viewMode === 'editor' ? (
            <CardPreview ref={cardRef} card={card} theme={theme} rarityConfig={rarityConfig} />
          ) : (
            <GalleryView
              cards={filteredCards}
              onLoad={handleLoadCard}
              onDelete={handleDeleteCard}
              filterClass={filterClass}
              filterRarity={filterRarity}
              onFilterClass={setFilterClass}
              onFilterRarity={setFilterRarity}
            />
          )}
        </div>
      </main>

      {/* Editor Panel */}
      {viewMode === 'editor' && (
        <aside style={{
          width: 320,
          backgroundColor: COLORS.surface1,
          borderLeft: `1px solid ${COLORS.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <EditorPanel
            card={card}
            onUpdate={updateCard}
            onUpdateSpecialty={updateSpecialty}
            onSave={handleSave}
            onExport={handleExport}
            isExporting={isExporting}
          />
        </aside>
      )}
    </div>
  );
}

// Navbar Button Component
function NavButton({ icon, active, onClick, title }: {
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 40,
        height: 40,
        borderRadius: 8,
        border: 'none',
        backgroundColor: active ? COLORS.surface3 : 'transparent',
        color: active ? COLORS.accentGold : COLORS.textSecondary,
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 150ms ease-out, color 150ms ease-out',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = COLORS.surface2;
          e.currentTarget.style.color = COLORS.textPrimary;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = COLORS.textSecondary;
        }
      }}
    >
      {icon}
    </button>
  );
}

// Card Preview Component
const CardPreview = React.forwardRef<HTMLDivElement, {
  card: LegendCard;
  theme: typeof CLASS_THEMES['Guerrier'];
  rarityConfig: typeof RARITY_CONFIG['Commun'];
}>(({ card, theme, rarityConfig }, ref) => {
  const hasHoloEffect = card.rarity === 'Mythique';
  const hasParticles = card.rarity === 'Legendaire';
  const hasShimmer = card.rarity === 'Epique';
  const hasMatte = card.rarity === 'Rare';

  return (
    <div
      ref={ref}
      style={{
        width: 432,
        height: 540,
        backgroundColor: theme.bg,
        border: `2px solid ${theme.accent}`,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Bebas Neue, sans-serif',
      }}
    >
      {/* Rarity Effects */}
      {hasHoloEffect && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(125deg,
            rgba(255,0,0,0.1) 0%,
            rgba(255,154,0,0.1) 10%,
            rgba(208,222,33,0.1) 20%,
            rgba(79,220,74,0.1) 30%,
            rgba(63,218,216,0.1) 40%,
            rgba(47,126,216,0.1) 50%,
            rgba(139,71,219,0.1) 60%,
            rgba(255,0,0,0.1) 70%
          )`,
          pointerEvents: 'none',
          mixBlendMode: 'color',
          animation: 'holoShift 3s linear infinite',
        }} />
      )}

      {hasParticles && (
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}>
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: 3,
                height: 3,
                backgroundColor: COLORS.accentGold,
                borderRadius: '50%',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: 0.6,
                animation: `particleFloat ${2 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Header: Name + Rarity + Number */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: `1px solid ${theme.accent}40`,
      }}>
        <span style={{
          fontSize: 28,
          color: theme.text,
          letterSpacing: 1,
          textTransform: 'uppercase',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {card.name || 'NOM'}
        </span>
        <div style={{ textAlign: 'right', marginLeft: 12 }}>
          <div style={{ fontSize: 12, color: theme.accent, fontFamily: 'Inter' }}>
            {card.rarity.toUpperCase()}
          </div>
          <div style={{ fontSize: 14, color: theme.text, fontFamily: 'Montserrat', fontWeight: 600 }}>
            #{card.cardNumber.toString().padStart(3, '0')}
          </div>
        </div>
      </div>

      {/* Portrait */}
      <div style={{
        height: '35%',
        backgroundColor: `${theme.accent}20`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {card.portraitUrl ? (
          <img
            src={card.portraitUrl}
            alt={card.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.accent,
          }}>
            <Image size={48} strokeWidth={1} />
          </div>
        )}
        {/* Matte overlay for Rare */}
        {hasMatte && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, transparent 60%, ${theme.bg}40 100%)`,
            boxShadow: `inset 0 0 40px ${theme.accent}30`,
          }} />
        )}
      </div>

      {/* Shimmer effect for Epic */}
      {hasShimmer && (
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '10%',
          height: '35%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          animation: 'shimmer 2s infinite',
          pointerEvents: 'none',
        }} />
      )}

      {/* Class */}
      <div style={{
        padding: '8px 16px',
        borderBottom: `1px solid ${theme.accent}20`,
      }}>
        <span style={{
          fontSize: 12,
          color: theme.text,
          fontFamily: 'Inter',
          textTransform: 'uppercase',
          letterSpacing: 2,
          opacity: 0.8,
        }}>
          {card.characterClass}
          {card.era && ` — ${card.era}`}
          {card.origin && ` — ${card.origin}`}
        </span>
      </div>

      {/* Specialties 2x2 Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 1,
        backgroundColor: theme.accent + '20',
      }}>
        {card.specialties.map((spec, i) => (
          <div
            key={i}
            style={{
              backgroundColor: theme.bg,
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div style={{
              width: 20,
              height: 20,
              backgroundColor: theme.accent,
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: 13,
              color: theme.text,
              fontFamily: 'Montserrat',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {spec || `Specialite ${i + 1}`}
            </span>
          </div>
        ))}
      </div>

      {/* Key Achievement */}
      <div style={{
        padding: '12px 16px',
        borderTop: `1px solid ${theme.accent}20`,
      }}>
        <div style={{
          fontSize: 10,
          color: theme.accent,
          fontFamily: 'Inter',
          textTransform: 'uppercase',
          letterSpacing: 2,
          marginBottom: 4,
        }}>
          Realisation clef
        </div>
        <div style={{
          fontSize: 13,
          color: theme.text,
          fontFamily: 'Inter',
          lineHeight: 1.4,
        }}>
          {card.keyAchievement || 'Description de la realisation majeure...'}
        </div>
      </div>

      {/* Flaw */}
      <div style={{
        padding: '12px 16px',
        borderTop: `1px solid ${theme.accent}20`,
      }}>
        <div style={{
          fontSize: 10,
          color: COLORS.textSecondary,
          fontFamily: 'Inter',
          textTransform: 'uppercase',
          letterSpacing: 2,
          marginBottom: 4,
        }}>
          Faille
        </div>
        <div style={{
          fontSize: 13,
          color: theme.text,
          fontFamily: 'Inter',
          lineHeight: 1.4,
          opacity: 0.8,
        }}>
          {card.flaw || 'Point faible ou defaut de personnalite...'}
        </div>
      </div>

      {/* Quote */}
      <div style={{
        padding: '16px',
        marginTop: 'auto',
        backgroundColor: `${theme.accent}15`,
        borderTop: `1px solid ${theme.accent}30`,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
        }}>
          <span style={{
            fontSize: 24,
            color: theme.accent,
            fontFamily: 'Bebas Neue',
            lineHeight: 1,
          }}>"</span>
          <span style={{
            fontSize: 14,
            color: theme.text,
            fontFamily: 'Inter',
            fontStyle: 'italic',
            lineHeight: 1.5,
          }}>
            {card.quote || 'Citation emblematique...'}
          </span>
          <span style={{
            fontSize: 24,
            color: theme.accent,
            fontFamily: 'Bebas Neue',
            lineHeight: 1,
            alignSelf: 'flex-end',
          }}>"</span>
        </div>
      </div>
    </div>
  );
});

// Editor Panel Component
function EditorPanel({
  card,
  onUpdate,
  onUpdateSpecialty,
  onSave,
  onExport,
  isExporting,
}: {
  card: LegendCard;
  onUpdate: <K extends keyof LegendCard>(field: K, value: LegendCard[K]) => void;
  onUpdateSpecialty: (index: number, value: string) => void;
  onSave: () => void;
  onExport: () => void;
  isExporting: boolean;
}) {
  return (
    <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Form Fields */}
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Name */}
        <Field label="Nom">
          <input
            type="text"
            value={card.name}
            onChange={(e) => onUpdate('name', e.target.value)}
            placeholder="Nom du personnage"
            style={inputStyle}
          />
        </Field>

        {/* Surname */}
        <Field label="Surnom">
          <input
            type="text"
            value={card.surname}
            onChange={(e) => onUpdate('surname', e.target.value)}
            placeholder="Surnom ou titre"
            style={inputStyle}
          />
        </Field>

        {/* Era & Origin */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Ere">
            <input
              type="text"
              value={card.era}
              onChange={(e) => onUpdate('era', e.target.value)}
              placeholder="Ex: XIXe siecle"
              style={inputStyle}
            />
          </Field>
          <Field label="Origine">
            <input
              type="text"
              value={card.origin}
              onChange={(e) => onUpdate('origin', e.target.value)}
              placeholder="Ex: France"
              style={inputStyle}
            />
          </Field>
        </div>

        {/* Class Selector */}
        <Field label="Classe">
          <select
            value={card.characterClass}
            onChange={(e) => onUpdate('characterClass', e.target.value as LegendCard['characterClass'])}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {Object.keys(CLASS_THEMES).map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </Field>

        {/* Rarity Selector */}
        <Field label="Rareté">
          <select
            value={card.rarity}
            onChange={(e) => onUpdate('rarity', e.target.value as LegendCard['rarity'])}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {Object.keys(RARITY_CONFIG).map((rarity) => (
              <option key={rarity} value={rarity}>
                {RARITY_CONFIG[rarity as LegendCard['rarity']].label}
              </option>
            ))}
          </select>
        </Field>

        {/* Specialties */}
        <Field label="Spécialités">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[0, 1, 2, 3].map((i) => (
              <input
                key={i}
                type="text"
                value={card.specialties[i]}
                onChange={(e) => onUpdateSpecialty(i, e.target.value)}
                placeholder={`Spécialité ${i + 1}`}
                style={inputStyle}
              />
            ))}
          </div>
        </Field>

        {/* Key Achievement */}
        <Field label="Réalisation clé">
          <textarea
            value={card.keyAchievement}
            onChange={(e) => onUpdate('keyAchievement', e.target.value)}
            placeholder="Décrivez l'exploit majeur..."
            style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
          />
        </Field>

        {/* Flaw */}
        <Field label="Faille">
          <textarea
            value={card.flaw}
            onChange={(e) => onUpdate('flaw', e.target.value)}
            placeholder="Point faible ou défaut de caractère..."
            style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
          />
        </Field>

        {/* Quote */}
        <Field label="Citation">
          <textarea
            value={card.quote}
            onChange={(e) => onUpdate('quote', e.target.value)}
            placeholder="« Citation emblématique... »"
            style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
          />
        </Field>
      </div>

      {/* Action Buttons */}
      <div style={{
        padding: 16,
        borderTop: `1px solid ${COLORS.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        marginTop: 'auto',
        backgroundColor: COLORS.surface1,
      }}>
        <button
          onClick={onSave}
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: COLORS.accentGold,
            color: COLORS.bgGlobal,
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Sparkles size={18} />
          Sauvegarder
        </button>
        <button
          onClick={onExport}
          disabled={isExporting}
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: COLORS.surface2,
            color: COLORS.textPrimary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: isExporting ? 'wait' : 'pointer',
            opacity: isExporting ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Download size={18} />
          {isExporting ? 'Export...' : 'Exporter PNG'}
        </button>
      </div>
    </div>
  );
}

// Field Component
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: 11,
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: 500,
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// Input Style
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  backgroundColor: COLORS.surface2,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 6,
  color: COLORS.textPrimary,
  fontSize: 13,
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  transition: 'border-color 150ms ease-out',
};

// Gallery View Component
function GalleryView({
  cards,
  onLoad,
  onDelete,
  filterClass,
  filterRarity,
  onFilterClass,
  onFilterRarity,
}: {
  cards: SavedPost[];
  onLoad: (post: SavedPost) => void;
  onDelete: (id: string) => void;
  filterClass: LegendCard['characterClass'] | 'all';
  filterRarity: LegendCard['rarity'] | 'all';
  onFilterClass: (v: LegendCard['characterClass'] | 'all') => void;
  onFilterRarity: (v: LegendCard['rarity'] | 'all') => void;
}) {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 24,
        padding: 16,
        backgroundColor: COLORS.surface1,
        borderRadius: 8,
        border: `1px solid ${COLORS.border}`,
      }}>
        <select
          value={filterClass}
          onChange={(e) => onFilterClass(e.target.value as LegendCard['characterClass'] | 'all')}
          style={{ ...inputStyle, width: 140 }}
        >
          <option value="all">Toutes classes</option>
          {Object.keys(CLASS_THEMES).map((cls) => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>
        <select
          value={filterRarity}
          onChange={(e) => onFilterRarity(e.target.value as LegendCard['rarity'] | 'all')}
          style={{ ...inputStyle, width: 140 }}
        >
          <option value="all">Toutes raretés</option>
          {Object.keys(RARITY_CONFIG).map((r) => (
            <option key={r} value={r}>{RARITY_CONFIG[r as LegendCard['rarity']].label}</option>
          ))}
        </select>
      </div>

      {/* Cards Grid */}
      {cards.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 48,
          color: COLORS.textSecondary,
        }}>
          Aucune carte dans la collection
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
        }}>
          {cards.map((post) => {
            const cardData = post.metadata?.card as LegendCard;
            const theme = CLASS_THEMES[cardData?.characterClass || 'Guerrier'];
            return (
              <div
                key={post.id}
                style={{
                  backgroundColor: COLORS.surface1,
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: `1px solid ${COLORS.border}`,
                  cursor: 'pointer',
                }}
                onClick={() => onLoad(post)}
              >
                {/* Mini Card Preview */}
                <div style={{
                  height: 120,
                  backgroundColor: theme.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}>
                  {post.imageUrl ? (
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ color: theme.accent, fontFamily: 'Bebas Neue', fontSize: 24 }}>
                      {cardData?.name?.charAt(0) || '?'}
                    </span>
                  )}
                  {/* Card Number Badge */}
                  <div style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: theme.bg,
                    color: theme.text,
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontFamily: 'Montserrat',
                    fontWeight: 600,
                  }}>
                    #{cardData?.cardNumber?.toString().padStart(3, '0')}
                  </div>
                </div>
                {/* Card Info */}
                <div style={{ padding: 12 }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: COLORS.textPrimary,
                    fontFamily: 'Bebas Neue',
                    marginBottom: 4,
                  }}>
                    {post.title}
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span style={{
                      fontSize: 11,
                      color: theme.accent,
                    }}>
                      {cardData?.characterClass}
                    </span>
                    <span style={{
                      fontSize: 11,
                      color: COLORS.textSecondary,
                    }}>
                      {cardData?.rarity}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// CSS Animations (injected into document)
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    @keyframes particleFloat {
      0%, 100% { transform: translateY(0); opacity: 0.6; }
      50% { transform: translateY(-20px); opacity: 0.2; }
    }
    @keyframes holoShift {
      0% { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }
  `;
  document.head.appendChild(style);
}
