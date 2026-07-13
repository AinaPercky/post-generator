import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toPng, toJpeg } from 'html-to-image';
// @ts-ignore
import cardBackground from '../assets/card_background_1782290811054.jpg';
import explorateurBackground from '../assets/fond_explorateur.png';
import savantBackground from '../assets/fond_savant.png';
import artisteBackground from '../assets/fond_artiste.png';
import fictionnelBackground from '../assets/fond_fictionnel.png';
import penseurBackground from '../assets/fond_penseur.png';
import dirigeantBackground from '../assets/fond_dirigeant.png';
import athleteBackground from '../assets/fond_athlete.png';
import { Anchor, Sparkles, Upload, Download, Plus, Trash2, Copy, Search, Image as ImageIcon, RotateCcw, Swords, Shield, Quote, Heart, Check, TriangleAlert as AlertTriangle, ListFilter as Filter, Eye, Settings, Circle as HelpCircle, FileImage, Crown, Skull, Crosshair, Axe, Flame, Zap, Wind, Target, Feather, Compass, FlaskConical, Palette, Film, BookOpen, Trophy, Loader2, CloudOff, CloudCheck, ClipboardPaste } from 'lucide-react';
import { WarriorCard, loadLegendCards, saveLegendCard, updateLegendCard, deleteLegendCard, DuplicateLegendError, normalizeLegendName } from '../lib/legendService';

// WarriorCard est importé depuis legendService (avec le champ supabaseId en plus)
// cf. src/lib/legendService.ts



const INITIAL_CARDS: WarriorCard[] = [
  {
    id: 1,
    numero: "001",
    nom: "NOUVELLE LÉGENDE",
    rarete: "C",
    surnom: "Surnom",
    portraitUrl: "",
    classe: "Guerrier / Soldat",
    specialite1: "Spécialité 1",
    specialite2: "Spécialité 2",
    realisation: "Réalisation principale",
    faille: "Faille ou faiblesse",
    citation: "Citation",
    theme: "gold",
    hp: 50,
    atk: 50
  }
];

const PORTRAIT_PRESETS = [
  { name: "Spartiate", url: "https://images.unsplash.com/photo-1580130379624-3a069adbffc5?auto=format&fit=crop&w=500&q=80" },
  { name: "Guerrier Doré", url: "https://images.unsplash.com/photo-1599733589046-10c005739ef9?auto=format&fit=crop&w=500&q=80" },
  { name: "Samouraï", url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=500&q=80" },
  { name: "Viking", url: "https://images.unsplash.com/photo-1608155686393-8fdd966d784d?auto=format&fit=crop&w=500&q=80" },
  { name: "Mystique", url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=500&q=80" },
  { name: "Paladin", url: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?auto=format&fit=crop&w=500&q=80" },
  { name: "Gladiateur", url: "https://images.unsplash.com/photo-1551632640-c5bb47668952?auto=format&fit=crop&w=500&q=80" },
  { name: "Chevalier", url: "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=500&q=80" }
];

const getCORSUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("cors", "true");
    return parsed.toString();
  } catch (e) {
    return url;
  }
};

export type ArchetypeType = 'Guerrier' | 'Explorateur' | 'Savant' | 'Artiste' | 'Fictionnel' | 'Penseur' | 'Dirigeant' | 'Athlète';

export interface ClassDesign {
  emoji: string;
  label: string;
  description: string;
  subTypes: string[];
  colors: string;
  fontTitle: string;
  fontData: string;
  fontCitation: string;
  background: string;
  cadre: string;
  effects: string;
}

export const CLASSES_CONFIG: Record<ArchetypeType, ClassDesign> = {
  Guerrier: {
    emoji: "⚔️",
    label: "Guerrier",
    description: "Bataille, arène, conquête physique",
    subTypes: ["Soldat", "Stratège", "Conquérant", "Chef de guerre", "Héros mythologique", "Anti-héros", "Combattant", "Mercenaire", "Hoplite", "Demi-dieu"],
    colors: "Variables · Rouge · Acier",
    fontTitle: "font-bebas text-amber-500",
    fontData: "font-montserrat",
    fontCitation: "font-serif",
    background: "Bataille · Arène · Explosion",
    cadre: "Armure lourde · Acier gravé",
    effects: "Étincelles · Cendres · Fumée"
  },
  Explorateur: {
    emoji: "🌍",
    label: "Explorateur",
    description: "Découverte, expansion du monde connu",
    subTypes: ["Navigateur", "Cartographe", "Terrestre", "Maritime", "Spatial", "Numérique", "Explorateur", "Pionnier"],
    colors: "Teal sombre · Vert mer · Céladon · Vanille",
    fontTitle: "font-oswald text-[#88d498]",
    fontData: "font-montserrat",
    fontCitation: "font-playfair",
    background: "Océan · Jungle · Horizon · Carte ancienne",
    cadre: "Parchemin · Boussole · Mappemonde",
    effects: "Brume · Rayons de soleil · Vieilles cartes"
  },
  Savant: {
    emoji: "🔬",
    label: "Savant",
    description: "Science, logique, innovation technologique",
    subTypes: ["Physicien", "Mathématicien", "Ingénieur", "Inventeur", "Économiste", "Théoricien", "Informaticien"],
    colors: "Bleu électrique · Cyan · Blanc",
    fontTitle: "font-oswald text-blue-400",
    fontData: "font-montserrat",
    fontCitation: "font-sans",
    background: "Laboratoire · Équations · Univers",
    cadre: "HUD holographique",
    effects: "Particules numériques · Énergie bleue"
  },
  Artiste: {
    emoji: "🎨",
    label: "Artiste",
    description: "Création, expression, culture",
    subTypes: ["Peintre", "Sculpteur", "Musicien", "Chanteur", "Acteur", "Écrivain", "Cinéaste", "Danseur", "Architecte", "Comédien"],
    colors: "Violet · Rose néon · Or doux",
    fontTitle: "font-anton text-[#820263]",
    fontData: "font-montserrat",
    fontCitation: "font-playfair",
    background: "Atelier · Scène · Lumières",
    cadre: "Cadre fluide · Organique",
    effects: "Peinture dynamique"
  },
  Fictionnel: {
    emoji: "🎬",
    label: "Fictionnel",
    description: "Personnages d'univers imaginaires",
    subTypes: ["Super-héros", "Anti-héros", "Créature", "Guerrier fictif", "Entité cosmique", "Personnage comique", "Vilain", "IA fictive", "Sorcier/Mage", "Antihéros criminel"],
    colors: "Variables selon univers d'origine",
    fontTitle: "font-bebas text-[#7776bc]",
    fontData: "font-montserrat",
    fontCitation: "font-serif",
    background: "Énergie · Portails · Cosmos",
    cadre: "Aura · Effets spéciaux",
    effects: "Éclairs · Distorsion"
  },
  Penseur: {
    emoji: "🧠",
    label: "Penseur",
    description: "Idées, philosophie, transformation sociale ou spirituelle",
    subTypes: ["Philosophe", "Idéologue", "Réformateur social", "Leader non-violent", "Théologien", "Visionnaire", "Théoricien"],
    colors: "Bronze · Ivoire · Gris ancien",
    fontTitle: "font-oswald text-[#ffff82]",
    fontData: "font-sourcesans",
    fontCitation: "font-playfair",
    background: "Bibliothèque · Temple · Manuscrits",
    cadre: "Gravure ancienne",
    effects: "Poussière dorée · Lumière douce"
  },
  Dirigeant: {
    emoji: "👑",
    label: "Dirigeant",
    description: "Pouvoir, gouvernance, empire",
    subTypes: ["Roi", "Empereur", "Président", "Dictateur", "Chef révolutionnaire", "Tyran", "Fondateur d'État"],
    colors: "Or royal · Bleu foncé · Rouge noble",
    fontTitle: "font-bebas text-[#c670ff]",
    fontData: "font-montserrat",
    fontCitation: "font-serif",
    background: "Trône · Palais · Capitole",
    cadre: "Blason · Sceau royal",
    effects: "Lumière royale · Bannières"
  },
  Athlète: {
    emoji: "🏆",
    label: "Athlète",
    description: "Performance physique, compétition, records",
    subTypes: ["Basketball", "Football", "Athlétisme", "Boxe/MMA", "Tennis", "Natation", "Cyclisme", "F1", "Rugby", "Baseball", "Golf", "Sport extrême", "Autre"],
    colors: "Variables selon discipline · Or · Noir",
    fontTitle: "font-anton text-[#C08A5A]",
    fontData: "font-montserrat",
    fontCitation: "font-sans",
    background: "Stade · Arène · Terrain",
    cadre: "Trading card moderne",
    effects: "Motion blur · Spotlight"
  }
};

export const parseClasse = (classeStr: string) => {
  const normalized = (classeStr || "").trim();
  const parts = normalized.split(" / ");
  if (parts.length === 2) {
    const archetype = parts[0] as ArchetypeType;
    if (CLASSES_CONFIG[archetype]) {
      return { mainClass: archetype, subType: parts[1] };
    }
  }
  
  const lower = normalized.toLowerCase();
  if (lower.includes("explorateur") || lower.includes("navigateur") || lower.includes("cartographe") || lower.includes("pionnier")) {
    return { mainClass: "Explorateur" as ArchetypeType, subType: normalized };
  }
  if (lower.includes("savant") || lower.includes("physicien") || lower.includes("math") || lower.includes("ingénieur") || lower.includes("inventeur") || lower.includes("science")) {
    return { mainClass: "Savant" as ArchetypeType, subType: normalized };
  }
  if (lower.includes("artiste") || lower.includes("peintre") || lower.includes("musicien") || lower.includes("chanteur") || lower.includes("écrivain")) {
    return { mainClass: "Artiste" as ArchetypeType, subType: normalized };
  }
  if (lower.includes("fictif") || lower.includes("fictionnel") || lower.includes("super-héros") || lower.includes("sorcier") || lower.includes("créature") || lower.includes("mage")) {
    return { mainClass: "Fictionnel" as ArchetypeType, subType: normalized };
  }
  if (lower.includes("penseur") || lower.includes("philosophe") || lower.includes("idéologue") || lower.includes("théologien") || lower.includes("visionnaire")) {
    return { mainClass: "Penseur" as ArchetypeType, subType: normalized };
  }
  if (lower.includes("dirigeant") || lower.includes("roi") || lower.includes("empereur") || lower.includes("président") || lower.includes("tyran")) {
    return { mainClass: "Dirigeant" as ArchetypeType, subType: normalized };
  }
  if (lower.includes("athlète") || lower.includes("basket") || lower.includes("foot") || lower.includes("boxe") || lower.includes("sport")) {
    return { mainClass: "Athlète" as ArchetypeType, subType: normalized };
  }
  
  return { mainClass: "Guerrier" as ArchetypeType, subType: normalized };
};

const AVAILABLE_SPECIALTY_ICONS = [
  { id: 'shield', label: 'Bouclier', icon: Shield },
  { id: 'swords', label: 'Épées', icon: Swords },
  { id: 'sparkles', label: 'Magie', icon: Sparkles },
  { id: 'crown', label: 'Couronne', icon: Crown },
  { id: 'skull', label: 'Nécromancie', icon: Skull },
  { id: 'crosshair', label: 'Précision', icon: Crosshair },
  { id: 'axe', label: 'Force Brut', icon: Axe },
  { id: 'heart', label: 'Vitalité', icon: Heart },
  { id: 'eye', label: 'Sagesse', icon: Eye },
  { id: 'flame', label: 'Feu', icon: Flame },
  { id: 'zap', label: 'Foudre', icon: Zap },
  { id: 'wind', label: 'Agilité', icon: Wind },
  { id: 'target', label: 'Traque', icon: Target },
  { id: 'feather', label: 'Légèreté', icon: Feather },
  { id: 'custom', label: '✍️ Personnalisé...', icon: HelpCircle }
];

const renderSpecialtyIcon = (iconName: string | undefined, defaultIcon: string, className: string = "w-3 h-3") => {
  const name = iconName || defaultIcon;
  if (name && (name.startsWith('data:') || name.startsWith('http') || name.startsWith('blob:'))) {
    return <img src={name} className={`${className} object-contain rounded-sm select-none`} alt="specialty" referrerPolicy="no-referrer" />;
  }
  const iconObj = AVAILABLE_SPECIALTY_ICONS.find(i => i.id === name);
  if (iconObj && iconObj.id !== 'custom') {
    const IconComponent = iconObj.icon;
    return <IconComponent className={className} />;
  }
  if (name && name !== 'custom') {
    return <span className="text-[12px] sm:text-[13px] font-bold leading-none select-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{name}</span>;
  }
  const DefaultIcon = defaultIcon === 'sparkles' ? Sparkles : Shield;
  return <DefaultIcon className={className} />;
};

const getCitationFontSize = (text: string) => {
  const len = (text || '').trim().length;
  if (len <= 50) return 12.5;
  if (len <= 80) return 11.5;
  if (len <= 110) return 10.5;
  if (len <= 140) return 9.5;
  if (len <= 175) return 8.5;
  if (len <= 210) return 7.8;
  return 7;
};

const getClassIcon = (classeName: string, iconClassName: string = "w-4 h-4") => {
  const { mainClass } = parseClasse(classeName);
  switch (mainClass) {
    case 'Explorateur': return <Anchor className={`${iconClassName} text-[#bce784]`} />;
    case 'Savant': return <FlaskConical className={`${iconClassName} text-[#ffff33]`} />;
    case 'Artiste': return <Palette className={`${iconClassName} text-[#820263]`} />;
    case 'Fictionnel': return <Film className={`${iconClassName} text-[#7776bc]`} />;
    case 'Penseur': return <BookOpen className={`${iconClassName} text-[#ffff82]`} />;
    case 'Dirigeant': return <Crown className={`${iconClassName} text-[#c670ff]`} />;
    case 'Athlète': return <Trophy className={`${iconClassName} text-[#C08A5A]`} />;
    case 'Guerrier':
    default:
      const normalized = (classeName || '').toLowerCase();
      if (normalized.includes('sorcier') || normalized.includes('mage') || normalized.includes('magicien') || normalized.includes('druide') || normalized.includes('alchimiste') || normalized.includes('wizard') || normalized.includes('philo') || normalized.includes('runique')) {
        return <Sparkles className={`${iconClassName} text-amber-400 animate-pulse`} />;
      }
      if (normalized.includes('prêtre') || normalized.includes('pope') || normalized.includes('clerc') || normalized.includes('divin') || normalized.includes('céleste') || normalized.includes('ange') || normalized.includes('héroïne') || normalized.includes('paladin')) {
        return <Crown className={`${iconClassName} text-yellow-400`} />;
      }
      if (normalized.includes('assassin') || normalized.includes('voleur') || normalized.includes('ninja') || normalized.includes('ombre') || normalized.includes('mort') || normalized.includes('faucheur') || normalized.includes('démon')) {
        return <Skull className={`${iconClassName} text-[#7776bc]`} />;
      }
      if (normalized.includes('archère') || normalized.includes('archer') || normalized.includes('chasseur') || normalized.includes('tireur') || normalized.includes('fusil') || normalized.includes('éclaireur')) {
        return <Crosshair className={`${iconClassName} text-[#C08A5A]`} />;
      }
      if (normalized.includes('hoplite') || normalized.includes('protecteur') || normalized.includes('sentinelle') || normalized.includes('bouclier') || normalized.includes('défense') || normalized.includes('garde')) {
        return <Shield className={`${iconClassName} text-blue-400`} />;
      }
      if (normalized.includes('barbare') || normalized.includes('berserker') || normalized.includes('bourreau') || normalized.includes('colosse') || normalized.includes('brute')) {
        return <Axe className={`${iconClassName} text-red-500`} />;
      }
      return <Swords className={`${iconClassName} text-amber-500 animate-pulse`} />;
  }
};

export interface CardAmbiance {
  fontTitle: string;
  fontData: string;
  fontCitation: string;
  accentColor: string;
  accentBorder: string;
  innerBorder: string;
  outerBorder: string;
  themeBgGradient: string;
  
  nameSectionStyle: string;
  textBoxStyle: string;
  portraitBorderStyle: string;
  classBadgeStyle: string;
  specBoxStyle: string;
  citationBoxStyle: string;
  iconContainerStyle: string;
  dividerStyle: string;
  failleColor: string;

  textBoxBgImage?: string;
  textBoxBgBlendMode?: string;

  quoteIconStyle: string;

  cornerStyle: 'rivet' | 'compass' | 'none';
  showScratches: boolean;
  showBlood: boolean;
  showEmber: boolean;
  effectOverlay: React.ReactNode;
}

export const getCardAmbiance = (classeStr: string, activeTheme: any): CardAmbiance => {
  const { mainClass } = parseClasse(classeStr);
  
  switch (mainClass) {
    case 'Explorateur':
      return {
        fontTitle: "font-oswald font-extrabold tracking-wide uppercase text-[#bce784]",
        fontData: "font-montserrat font-semibold",
        fontCitation: "font-playfair italic",
        accentColor: "text-[#bce784]",
        accentBorder: "border-[#bce784]/80",
        innerBorder: "border-[#bce784]/30",
        outerBorder: "border-[#348aa7]/80 shadow-[0_0_24px_rgba(52,138,167,0.45)]",
        themeBgGradient: "from-[#513b56]/95 via-[#525174]/90 to-[#171413]/95",
        
        nameSectionStyle: "border-2 border-[#bce784]/80 bg-[#171413]/90 backdrop-blur-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.85)] rounded-xl",
        textBoxStyle: "border-2 border-[#5dd39e]/80 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.85),0_4px_6px_rgba(0,0,0,0.5)]",
        portraitBorderStyle: "border-2 border-[#348aa7]/60 shadow-[0_0_12px_rgba(52,138,167,0.45)]",
        classBadgeStyle: "border-2 border-[#348aa7]/80 bg-gradient-to-r from-[#171413] via-[#2a2420] to-[#171413]",
        specBoxStyle: "border-2 border-[#525174]/60",
        citationBoxStyle: "border border-[#5dd39e]/50 bg-[#171413]/55",
        iconContainerStyle: "border-[#bce784]/80 shadow-[0_0_8px_rgba(188,231,132,0.08)]",
        dividerStyle: "via-[#5dd39e]/30",
        failleColor: "text-[#bce784]",
        
        textBoxBgImage: `linear-gradient(to bottom, rgba(81, 59, 86, 0.2), rgba(23, 20, 19, 0.82)), url(${explorateurBackground})`,
        textBoxBgBlendMode: 'normal',
        quoteIconStyle: "text-[#5dd39e] drop-shadow-[0_0_6px_rgba(93,211,158,0.6)]",
        
        cornerStyle: 'rivet',
        showScratches: false,
        showBlood: false,
        showEmber: false,
        effectOverlay: (
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-[24px]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#bce784]/[0.04] via-transparent to-[#348aa7]/20 mix-blend-overlay" />

            {/* Voile parcheminé sépia (vieux papier) */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(101,67,33,0.28)_100%)] mix-blend-multiply" />
            <div className="absolute inset-0 opacity-[0.05] bg-[repeating-linear-gradient(0deg,#5c4425_0px,transparent_1px,transparent_3px)]" />

            {/* Grille de carte ancienne (latitude/longitude) */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.06]" viewBox="0 0 300 480" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
              {[60, 120, 180, 240, 300, 360, 420].map(y => <line key={`lat-${y}`} x1="0" y1={y} x2="300" y2={y} stroke="#bce784" strokeWidth="0.5" strokeDasharray="6 4" />)}
              {[50, 100, 150, 200, 250].map(x => <line key={`lon-${x}`} x1={x} y1="0" x2={x} y2="480" stroke="#bce784" strokeWidth="0.5" strokeDasharray="6 4" />)}
              <line x1="0" y1="480" x2="300" y2="0" stroke="#5dd39e" strokeWidth="0.4" strokeDasharray="8 6" opacity="0.5" />
              <line x1="0" y1="0" x2="300" y2="480" stroke="#5dd39e" strokeWidth="0.4" strokeDasharray="8 6" opacity="0.3" />
              <line x1="0" y1="240" x2="300" y2="60" stroke="#348aa7" strokeWidth="0.35" strokeDasharray="5 8" opacity="0.4" />
            </svg>

            {/* Route maritime pointillée avec ports */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.16]" viewBox="0 0 300 480" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M25,420 Q90,360 70,270 T160,150 T130,50" stroke="#bce784" strokeWidth="0.7" strokeDasharray="3 4" fill="none" />
              <circle cx="25" cy="420" r="2.5" fill="#5dd39e" stroke="#171413" strokeWidth="0.5" />
              <circle cx="160" cy="150" r="2" fill="#bce784" stroke="#171413" strokeWidth="0.5" />
              <circle cx="130" cy="50" r="2.5" fill="#5dd39e" stroke="#171413" strokeWidth="0.5" />
            </svg>

            {/* Rayons de soleil / brume */}
            <div className="absolute top-0 left-[18%] w-16 h-56 bg-gradient-to-b from-[#bce784]/10 via-[#5dd39e]/04 to-transparent rotate-[-10deg] origin-top" />
            <div className="absolute top-0 left-[48%] w-12 h-44 bg-gradient-to-b from-[#bce784]/08 via-[#348aa7]/03 to-transparent rotate-[5deg] origin-top" />
            <div className="absolute top-0 right-[14%] w-8 h-36 bg-gradient-to-b from-[#5dd39e]/07 via-transparent to-transparent rotate-[12deg] origin-top" />

            {/* Semis d'étoiles (navigation céleste) */}
            {[
              [12, 8], [78, 14], [34, 22], [90, 30], [8, 42], [55, 6], [65, 48], [20, 55], [92, 60], [45, 65]
            ].map(([left, top], i) => (
              <div key={`star-${i}`} className="absolute rounded-full bg-[#bce784]"
                style={{ left: `${left}%`, top: `${top}%`, width: `${(i % 3) + 1}px`, height: `${(i % 3) + 1}px`, opacity: 0.35 + (i % 3) * 0.1,
                  boxShadow: '0 0 3px rgba(188,231,132,0.6)' }} />
            ))}

            {/* ═══ ASTROLABE (haut-gauche) ═══ */}
            <div className="absolute top-5 left-5 w-[72px] h-[72px] opacity-[0.28]">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Anneau extérieur (limbe gradué) */}
                <circle cx="50" cy="50" r="47" stroke="#bce784" strokeWidth="1" />
                <circle cx="50" cy="50" r="41" stroke="#5dd39e" strokeWidth="0.4" strokeDasharray="1 2" />
                {Array.from({ length: 36 }).map((_, i) => {
                  const angle = i * 10;
                  const rad = (angle * Math.PI) / 180;
                  const isMajor = i % 3 === 0;
                  const outer = 47;
                  const inner = isMajor ? 40 : 43.5;
                  return (
                    <line key={`tick-${i}`}
                      x1={50 + outer * Math.cos(rad)} y1={50 + outer * Math.sin(rad)}
                      x2={50 + inner * Math.cos(rad)} y2={50 + inner * Math.sin(rad)}
                      stroke="#bce784" strokeWidth={isMajor ? 0.8 : 0.35} />
                  );
                })}
                {/* Mater (plaque de fond) */}
                <circle cx="50" cy="50" r="30" stroke="#348aa7" strokeWidth="0.6" />
                <circle cx="50" cy="50" r="17" stroke="#5dd39e" strokeWidth="0.45" strokeDasharray="2 1.5" />
                {/* Écliptique (cercle excentré) */}
                <ellipse cx="46" cy="47" rx="20" ry="16" stroke="#bce784" strokeWidth="0.35" opacity="0.6" />
                {/* Alidade (règle mobile) */}
                <g transform="rotate(35 50 50)">
                  <line x1="10" y1="50" x2="90" y2="50" stroke="#bce784" strokeWidth="1" />
                  <circle cx="10" cy="50" r="2" fill="#bce784" />
                  <circle cx="90" cy="50" r="2" fill="#bce784" />
                </g>
                {/* Rete (étoiles pointeurs) */}
                <circle cx="66" cy="28" r="1.3" fill="#5dd39e" />
                <circle cx="28" cy="66" r="1.3" fill="#5dd39e" />
                <circle cx="72" cy="64" r="1.1" fill="#bce784" />
                <circle cx="34" cy="30" r="1" fill="#bce784" />
                {/* Axe central */}
                <circle cx="50" cy="50" r="2.8" fill="#171413" stroke="#348aa7" strokeWidth="0.8" />
                <circle cx="50" cy="50" r="1" fill="#5dd39e" />
              </svg>
            </div>

            {/* Rose des vents (bas-droite, existante) */}
            <div className="absolute bottom-4 right-4 w-24 h-24 opacity-[0.22]">
              <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="48" cy="48" r="44" stroke="#bce784" strokeWidth="0.6" strokeDasharray="3 2.5" />
                <circle cx="48" cy="48" r="34" stroke="#5dd39e" strokeWidth="0.4" />
                <circle cx="48" cy="48" r="22" stroke="#348aa7" strokeWidth="0.5" />
                {[0,22.5,45,67.5,90,112.5,135,157.5,180,202.5,225,247.5,270,292.5,315,337.5].map((angle, i) => {
                  const rad = (angle - 90) * Math.PI / 180;
                  const inner = i % 4 === 0 ? 26 : i % 2 === 0 ? 30 : 34;
                  const outer = 42;
                  return (
                    <line key={angle} x1={48 + inner * Math.cos(rad)} y1={48 + inner * Math.sin(rad)} x2={48 + outer * Math.cos(rad)} y2={48 + outer * Math.sin(rad)} stroke={i % 4 === 0 ? "#5dd39e" : "#bce784"} strokeWidth={i % 4 === 0 ? "0.8" : "0.4"} />
                  );
                })}
                <polygon points="48,6 45,48 48,42 51,48" fill="#5dd39e" opacity="0.95" />
                <polygon points="48,90 45,48 48,54 51,48" fill="#bce784" opacity="0.55" />
                <polygon points="90,48 48,45 54,48 48,51" fill="#348aa7" opacity="0.5" />
                <polygon points="6,48 48,45 42,48 48,51" fill="#348aa7" opacity="0.5" />
                <circle cx="48" cy="48" r="3.5" fill="#348aa7" opacity="0.9" />
                <circle cx="48" cy="48" r="1.5" fill="#bce784" opacity="0.8" />
                <text x="46" y="4" fontSize="5" fill="#5dd39e" opacity="0.8" fontFamily="serif">N</text>
                <text x="46" y="95" fontSize="5" fill="#bce784" opacity="0.6" fontFamily="serif">S</text>
                <text x="88" y="50" fontSize="5" fill="#348aa7" opacity="0.6" fontFamily="serif">E</text>
                <text x="2" y="50" fontSize="5" fill="#348aa7" opacity="0.6" fontFamily="serif">O</text>
              </svg>
            </div>

            <div className="absolute inset-0 bg-[radial-gradient(#bce784_0.8px,transparent_0.8px)] [background-size:20px_20px] opacity-[0.035]" />
            <div className="absolute -top-8 left-[30%] w-40 h-32 bg-[#348aa7]/20 blur-[30px] rounded-full" />
            <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#5dd39e]/12 via-[#348aa7]/06 to-transparent" />
            <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(23,20,19,0.65)] rounded-[24px]" />
          </div>
        )
      };
      
    case 'Savant':
      return {
        fontTitle: "font-oswald font-extrabold tracking-wide uppercase text-[#bce784]",
        fontData: "font-montserrat font-semibold",
        fontCitation: "font-playfair italic",
        accentColor: "text-[#ffff33]",
        accentBorder: "border-[#ffff33]/80",
        innerBorder: "border-[#ffff33]/30",
        outerBorder: "border-[#00ffff]/80 shadow-[0_0_24px_rgba(0,255,255,0.45)]",
        themeBgGradient: "from-[#00cccc]/95 via-[#00cccc]/90 to-[#171413]/95",
        
        nameSectionStyle: "border-2 border-[#ffff33]/80 bg-[#171413]/90 backdrop-blur-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.85)] rounded-xl",
        textBoxStyle: "border-2 border-[#ffcc33]/80 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.85),0_4px_6px_rgba(0,0,0,0.5)]",
        portraitBorderStyle: "border-2 border-[#00ffff]/60 shadow-[0_0_12px_rgba(0,255,255,0.45)]",
        classBadgeStyle: "border-2 border-[#00ffff]/80 bg-gradient-to-r from-[#171413] via-[#2a2420] to-[#171413]",
        specBoxStyle: "border-2 border-[#525174]/60",
        citationBoxStyle: "border border-[#ffcc33]/50 bg-[#171413]/55",
        iconContainerStyle: "border-[#ffff33]/80 shadow-[0_0_8px_rgba(255,255,51,0.4)]",
        dividerStyle: "via-[#ffcc33]/30",
        failleColor: "text-[#ffff33]",
        
        textBoxBgImage: `linear-gradient(to bottom, rgba(255, 204, 51, 0.2), rgba(23, 20, 19, 0.82)), url(${savantBackground})`,
        textBoxBgBlendMode: 'normal',
        quoteIconStyle: "text-[#ffcc33] drop-shadow-[0_0_6px_rgba(255,204,51,0.6)]",
        
        cornerStyle: 'rivet',
        showScratches: false,
        showBlood: false,
        showEmber: false,
        effectOverlay: (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-[24px]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00ffff]/[0.04] via-transparent to-[#ffff33]/10 mix-blend-overlay" />

          {/* Grille de papier millimétré (fond scientifique) */}
          <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(rgba(0,255,255,0.2)_0.5px,transparent_0.5px),linear-gradient(90deg,rgba(0,255,255,0.2)_0.5px,transparent_0.5px)] [background-size:14px_14px]" />
          <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(0,255,255,0.2)_0.5px,transparent_0.5px),linear-gradient(90deg,rgba(0,255,255,0.2)_0.5px,transparent_0.5px)] [background-size:70px_70px]" />

          {/* ═══ CIRCUIT IMPRIMÉ (PCB) — coin haut-droit ═══ */}
          <svg className="absolute top-4 right-4 w-[130px] h-[150px] opacity-[0.22]" viewBox="0 0 130 150" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10,10 H50 V35 H90" stroke="#00ffff" strokeWidth="1.2" fill="none" />
            <path d="M90,35 V70 H120" stroke="#00ffff" strokeWidth="1.2" fill="none" />
            <path d="M10,10 V45 H30 V80" stroke="#ffff33" strokeWidth="1" fill="none" />
            <path d="M30,80 H65 V110" stroke="#ffff33" strokeWidth="1" fill="none" />
            <path d="M65,110 H100 V140" stroke="#00ffff" strokeWidth="1" fill="none" />
            <path d="M50,35 V60 H15 V95" stroke="#ffcc33" strokeWidth="0.8" fill="none" />
            <path d="M15,95 H45" stroke="#ffcc33" strokeWidth="0.8" fill="none" />
            <path d="M90,70 V100 H60" stroke="#ffcc33" strokeWidth="0.8" fill="none" />
            {/* Puce centrale */}
            <rect x="55" y="55" width="22" height="22" rx="2" stroke="#00ffff" strokeWidth="1" fill="#00ffff" fillOpacity="0.05" />
            {[0,1,2,3].map(i => <line key={`pin-t-${i}`} x1={60+i*5} y1="55" x2={60+i*5} y2="50" stroke="#00ffff" strokeWidth="0.7" />)}
            {[0,1,2,3].map(i => <line key={`pin-b-${i}`} x1={60+i*5} y1="77" x2={60+i*5} y2="82" stroke="#00ffff" strokeWidth="0.7" />)}
            {/* Vias / points de soudure */}
            {[[10,10],[50,35],[90,35],[120,70],[10,45],[30,80],[65,110],[100,140],[15,95],[45,95],[60,100]].map(([x,y],i) => (
              <circle key={`via-${i}`} cx={x} cy={y} r="1.8" fill="#ffff33" opacity="0.85" />
            ))}
          </svg>

          {/* ═══ ADN (double hélice) — bas-gauche ═══ */}
          <svg className="absolute bottom-6 left-4 w-[46px] h-[170px] opacity-[0.22]" viewBox="0 0 46 170" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8,0 C8,20 38,20 38,40 C38,60 8,60 8,80 C8,100 38,100 38,120 C38,140 8,140 8,160" stroke="#00ffff" strokeWidth="1.1" fill="none" />
            <path d="M38,0 C38,20 8,20 8,40 C8,60 38,60 38,80 C38,100 8,100 8,120 C8,140 38,140 38,160" stroke="#ffff33" strokeWidth="1.1" fill="none" />
            {Array.from({ length: 9 }).map((_, i) => {
              const y = i * 20;
              const phase = Math.sin((i * Math.PI) / 2);
              const x1 = 23 + phase * 15;
              const x2 = 23 - phase * 15;
              return <line key={`rung-${i}`} x1={x1} y1={y} x2={x2} y2={y} stroke="#ffcc33" strokeWidth="0.6" opacity="0.7" />;
            })}
          </svg>

          {/* ═══ Courbe de fonction (sinusoïde + parabole) ═══ */}
          <svg className="absolute top-[38%] left-[8%] w-[140px] h-[90px] opacity-[0.16]" viewBox="0 0 140 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="45" x2="140" y2="45" stroke="#00ffff" strokeWidth="0.5" />
            <line x1="10" y1="0" x2="10" y2="90" stroke="#00ffff" strokeWidth="0.5" />
            <path d="M10,45 C25,10 40,10 55,45 C70,80 85,80 100,45 C115,10 125,10 135,45" stroke="#ffff33" strokeWidth="1" fill="none" />
            <path d="M10,80 Q72,-10 135,80" stroke="#ffcc33" strokeWidth="0.8" fill="none" opacity="0.7" />
          </svg>

          {/* ═══ Formules scientifiques éparpillées ═══ */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.24]" viewBox="0 0 300 480" fill="none" xmlns="http://www.w3.org/2000/svg">
            <text x="165" y="55" fontSize="11" fill="#00ffff" fontFamily="serif" fontStyle="italic">E = mc²</text>
            <text x="30" y="150" fontSize="9" fill="#ffff33" fontFamily="serif" fontStyle="italic">F = ma</text>
            <text x="180" y="190" fontSize="10" fill="#ffcc33" fontFamily="serif" fontStyle="italic">∫f(x)dx</text>
            <text x="20" y="245" fontSize="9" fill="#00ffff" fontFamily="serif" fontStyle="italic">λ = h/mv</text>
            <text x="195" y="270" fontSize="10" fill="#ffff33" fontFamily="serif" fontStyle="italic">e^(iπ)+1=0</text>
            <text x="35" y="345" fontSize="9" fill="#ffcc33" fontFamily="serif" fontStyle="italic">ΔS ≥ 0</text>
            <text x="175" y="400" fontSize="9" fill="#00ffff" fontFamily="serif" fontStyle="italic">∇×E = -∂B/∂t</text>
            <text x="25" y="430" fontSize="10" fill="#ffff33" fontFamily="serif" fontStyle="italic">a² + b² = c²</text>
          </svg>

          {/* ═══ Extraits de code informatique ═══ */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.14]" viewBox="0 0 300 480" fill="none" xmlns="http://www.w3.org/2000/svg">
            <text x="205" y="120" fontSize="7" fill="#00ffff" fontFamily="monospace">if (x &gt; 0) &#123;</text>
            <text x="205" y="132" fontSize="7" fill="#00ffff" fontFamily="monospace">&nbsp;&nbsp;return true;</text>
            <text x="205" y="144" fontSize="7" fill="#00ffff" fontFamily="monospace">&#125;</text>
            <text x="15" y="200" fontSize="7" fill="#ffcc33" fontFamily="monospace">01001 10110</text>
            <text x="15" y="212" fontSize="7" fill="#ffcc33" fontFamily="monospace">11010 00101</text>
            <text x="180" y="330" fontSize="7" fill="#ffff33" fontFamily="monospace">function f(x) =&gt;</text>
            <text x="30" y="380" fontSize="7" fill="#00ffff" fontFamily="monospace">&lt;system&gt;OK&lt;/system&gt;</text>
          </svg>

          {/* Halo lumineux central (énergie bleue) */}
          <div className="absolute -top-8 right-[25%] w-40 h-32 bg-[#00ffff]/15 blur-[35px] rounded-full" />
          <div className="absolute bottom-0 left-[20%] w-32 h-28 bg-[#ffff33]/10 blur-[30px] rounded-full" />

          <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(23,20,19,0.35)] rounded-[24px]" />
        </div>
      ),
      };

    case 'Artiste':
      return {
    fontTitle: "font-anton tracking-wide uppercase text-[#820263]",
    fontData: "font-montserrat font-semibold",
    fontCitation: "font-playfair italic",
    accentColor: "text-[#d90368]",
    accentBorder: "border-[#d90368]/80",
    innerBorder: "border-[#d90368]/30",
    outerBorder: "border-[#fb8b24]/80 shadow-[0_0_24px_rgba(251, 139, 36,0.45)]",
    themeBgGradient: "from-[#d90368]/95 via-[#d90368]/90 to-[#171413]/95",
    
    nameSectionStyle: "border-2 border-[#d90368]/80 bg-[#171413]/90 backdrop-blur-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.85)] rounded-xl",
    textBoxStyle: "border-2 border-[#820263]/80 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.85),0_4px_6px_rgba(0,0,0,0.5)]",
    portraitBorderStyle: "border-2 border-[#fb8b24]/60 shadow-[0_0_12px_rgba(251, 139, 36,0.45)]",
    classBadgeStyle: "border-2 border-[#fb8b24]/80 bg-gradient-to-r from-[#171413] via-[#2a2420] to-[#171413]",
    specBoxStyle: "border-2 border-[#525174]/60",
    citationBoxStyle: "border border-[#820263]/50 bg-[#171413]/55",
    iconContainerStyle: "border-[#d90368]/80 shadow-[0_0_8px_rgba(130, 2, 99,0.4)]",
    dividerStyle: "via-[#820263]/30",
    failleColor: "text-[#d90368]",
    
    textBoxBgImage: `linear-gradient(to bottom, rgba(217, 3, 104, 0.1), rgba(23, 20, 19, 0.82)), url(${artisteBackground})`,
    textBoxBgBlendMode: 'normal',
    quoteIconStyle: "text-[#820263] drop-shadow-[0_0_6px_rgba(217, 3, 104,0.6)]",
    
    cornerStyle: 'rivet',
    showScratches: false,
    showBlood: false,
    showEmber: false,
    effectOverlay: (
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-[24px]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#820263]/[0.04] via-transparent to-[#fb8b24]/15 mix-blend-overlay" />

        {/* Texture toile (trame croisée) — pleine carte, opacité très faible, sans gêner la lecture */}
        <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(45deg,rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(-45deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:6px_6px]" />

        {/* ═══ ZONE CONFINÉE : en-tête + portrait uniquement (haut de la carte) ═══
            Tout ce qui suit reste dans le premier 58% de hauteur pour ne jamais
            recouvrir le badge de classe, les spécialités ou la boîte de texte/citation */}
        <div className="absolute top-0 left-0 right-0 h-[58%] overflow-hidden">

          {/* Sous le feu des projecteurs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-56 bg-gradient-to-b from-[#fffbdb]/20 via-[#fb8b24]/[0.08] to-transparent" style={{ clipPath: 'polygon(42% 0%, 58% 0%, 100% 100%, 0% 100%)' }} />
          <div className="absolute top-0 left-[18%] w-24 h-40 bg-gradient-to-b from-[#820263]/10 via-transparent to-transparent rotate-[8deg] origin-top" />
          <div className="absolute top-0 right-[14%] w-20 h-36 bg-gradient-to-b from-[#820263]/10 via-transparent to-transparent rotate-[-10deg] origin-top" />

          {/* Éclaboussures de peinture abstraites — coins haut uniquement */}
          <svg className="absolute -top-4 -left-6 w-32 h-32 opacity-[0.28]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20,30 C28,18 42,20 38,35 C50,32 55,45 44,50 C56,55 50,70 38,66 C42,80 26,82 24,68 C12,72 6,58 18,52 C4,48 8,32 20,30 Z" fill="#820263" opacity="0.6" />
            <circle cx="55" cy="20" r="3" fill="#fb8b24" opacity="0.7" />
            <circle cx="65" cy="30" r="1.6" fill="#fb8b24" opacity="0.6" />
          </svg>
          <svg className="absolute -top-6 -right-8 w-36 h-36 opacity-[0.22]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M60,45 C70,35 85,40 80,55 C92,54 94,70 80,72 C84,84 68,86 64,74 C52,80 44,68 54,60 C42,58 44,42 60,45 Z" fill="#fb8b24" opacity="0.5" />
            <circle cx="30" cy="20" r="2.5" fill="#820263" opacity="0.6" />
            <circle cx="20" cy="30" r="1.4" fill="#820263" opacity="0.55" />
          </svg>
          {/* Coulures de peinture */}
          <div className="absolute top-6 left-[30%] w-[3px] h-14 bg-gradient-to-b from-[#820263]/70 to-transparent rounded-full" />
          <div className="absolute top-4 right-[35%] w-[2px] h-9 bg-gradient-to-b from-[#fb8b24]/60 to-transparent rounded-full" />

          {/* Notes de musique éparpillées — restent dans le portrait */}
          <div className="absolute top-[24%] left-[10%] text-[#fb8b24] text-lg opacity-40 rotate-[-12deg] select-none">♪</div>
          <div className="absolute top-[14%] right-[16%] text-[#820263] text-2xl opacity-35 rotate-[10deg] select-none">♫</div>
          <div className="absolute bottom-[10%] left-[16%] text-[#820263] text-base opacity-30 rotate-[6deg] select-none">♪</div>
          <div className="absolute bottom-[6%] right-[8%] text-[#fb8b24] text-xl opacity-30 rotate-[-8deg] select-none">♬</div>

          {/* Partition (portée musicale stylisée) — bas du portrait, jamais sur le badge/texte */}
          <svg className="absolute bottom-[4%] left-[6%] w-28 h-10 opacity-[0.16]" viewBox="0 0 140 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            {[8, 18, 28, 38, 48].map(y => <line key={`staff-${y}`} x1="0" y1={y} x2="140" y2={y} stroke="#fffbdb" strokeWidth="0.7" />)}
            <circle cx="20" cy="38" r="4" fill="#fffbdb" />
            <line x1="24" y1="38" x2="24" y2="12" stroke="#fffbdb" strokeWidth="1" />
            <circle cx="45" cy="28" r="4" fill="#fffbdb" />
            <line x1="49" y1="28" x2="49" y2="4" stroke="#fffbdb" strokeWidth="1" />
            <circle cx="70" cy="18" r="4" fill="#fffbdb" />
            <line x1="74" y1="18" x2="74" y2="42" stroke="#fffbdb" strokeWidth="1" />
          </svg>

          {/* Ondes visuelles — bord bas du portrait, discrètes, ne descendent pas plus bas */}
          <svg className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-6 opacity-[0.22]" viewBox="0 0 240 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            {Array.from({ length: 24 }).map((_, i) => {
              const h = 4 + Math.abs(Math.sin(i * 0.7)) * 20;
              return <rect key={`wave-${i}`} x={i * 10} y={20 - h / 2} width="3" height={h} rx="1.5" fill={i % 3 === 0 ? "#fb8b24" : "#820263"} opacity="0.7" />;
            })}
          </svg>
        </div>

        <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(23,20,19,0.65)] rounded-[24px]" />
      </div>
    )
    };
      
case 'Fictionnel':
  return {
    fontTitle: "font-bebas tracking-wide uppercase text-[#fffbdb]",
    fontData: "font-montserrat font-semibold text-[#ffff]",
    fontCitation: "font-playfair italic",
    accentColor: "text-[#7776bc]",
    accentBorder: "border-[#7776bc]/80",
    innerBorder: "border-[#7776bc]/30",
    outerBorder: "border-[#fffbdb]/80 shadow-[0_0_24px_rgba(255, 251, 219,0.45)]",
    themeBgGradient: "from-[#fffbdb]/95 via-[#fffbdb]/90 to-[#171413]/95",
    
    nameSectionStyle: "border-2 border-[#7776bc]/80 bg-[#171413]/90 backdrop-blur-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.85)] rounded-xl",
    textBoxStyle: "border-2 border-[#cdc7e5]/80 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.85),0_4px_6px_rgba(0,0,0,0.5)]",
    portraitBorderStyle: "border-2 border-[#fffbdb]/60 shadow-[0_0_12px_rgba(255, 251, 219,0.45)]",
    classBadgeStyle: "border-2 border-[#fffbdb]/80 bg-gradient-to-r from-[#171413] via-[#2a2420] to-[#171413]",
    specBoxStyle: "border-2 border-[#525174]/60",
    citationBoxStyle: "border border-[#cdc7e5]/50 bg-[#171413]/55",
    iconContainerStyle: "border-[#7776bc]/80 shadow-[0_0_8px_rgba(119, 118, 188,0.4)]",
    dividerStyle: "via-[#cdc7e5]/30",
    failleColor: "text-[#7776bc]",
    
    textBoxBgImage: `linear-gradient(to bottom, rgba(205, 199, 229, 0.08), rgba(23, 20, 19, 0.82)), url(${fictionnelBackground})`,
    textBoxBgBlendMode: 'normal',
    quoteIconStyle: "text-[#cdc7e5] drop-shadow-[0_0_6px_rgba(205, 199, 229,0.6)]",
    
    cornerStyle: 'rivet',
    showScratches: false,
    showBlood: false,
    showEmber: false,
    effectOverlay: (
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-[24px]">

        {/* ═══ Teinte de base + Optique cinématographique (vignette) — pleine carte, ne gêne jamais la lecture ═══ */}
        {/* <div className="absolute inset-0 bg-violet-500/5 mix-blend-color-dodge opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(0,0,0,0.55)_100%)]" /> */}
        {/* Aberration chromatique (léger liseré rouge/cyan sur les bords) */}
        {/* <div className="absolute inset-0 shadow-[inset_3px_0_0_rgba(255,0,60,0.06),inset_-3px_0_0_rgba(0,220,255,0.06)]" /> */}
        {/* Flare d'objectif discret */}
        {/* <div className="absolute top-[6%] right-[10%] w-24 h-24 bg-[#fffbdb]/10 rounded-full blur-2xl" />
         <div className="absolute top-[9%] right-[16%] w-3 h-3 bg-[#fffbdb]/25 rounded-full blur-[2px]" /> */}

        {/* Letterboxing "Widescreen" — fines bandes noires façon cinéma */}
        <div className="absolute top-0 inset-x-0 h-[10px] bg-black/75" />
        <div className="absolute bottom-0 inset-x-0 h-[10px] bg-black/75" />

        {/* Trame demi-teinte "Âge d'Or du Comic-Book" (Ben-Day dots) — très faible opacité */}
        <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#7776bc_1.1px,transparent_1.1px)] [background-size:9px_9px]" />

        {/* Usure "Vintage" — grain de pellicule + rayures verticales + poussière */}
        {/* <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#fffbdb_0.6px,transparent_0.6px)] [background-size:3px_3px]" />
        <div className="absolute top-0 left-[22%] w-[0.5px] h-full bg-white/10" />
        <div className="absolute top-0 left-[61%] w-[0.5px] h-full bg-white/8" />
        <div className="absolute top-0 left-[84%] w-[0.5px] h-full bg-white/6" /> */}
        {[
          [8, 15], [72, 25], [45, 60], [90, 72], [20, 85], [60, 40]
        ].map(([left, top], i) => (
          <div key={`dust-${i}`} className="absolute rounded-full bg-white/25"
            style={{ left: `${left}%`, top: `${top}%`, width: '1px', height: '1px' }} />
        ))}

        {/* ═══ ZONE CONFINÉE : en-tête + portrait uniquement (haut de la carte) ═══
            Tout élément à fort impact visuel (glitch, onomatopées, lignes de vitesse)
            reste dans le premier 58% de hauteur pour ne jamais recouvrir le badge
            de classe, les spécialités ou la boîte de texte/citation */}
        <div className="absolute top-0 left-0 right-0 h-[58%] overflow-hidden">

          {/* Lignes d'action "Mangasen" — rafale de vitesse depuis un coin */}
          {/* <svg className="absolute top-0 right-0 w-40 h-40 opacity-[0.16]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {Array.from({ length: 14 }).map((_, i) => {
              const angle = 180 + i * 7;
              const rad = (angle * Math.PI) / 180;
              const len = 60 + (i % 3) * 15;
              return (
                <line key={`speed-${i}`}
                  x1="100" y1="0"
                  x2={100 + len * Math.cos(rad)} y2={len * Math.sin(rad)}
                  stroke="#fffbdb" strokeWidth={i % 4 === 0 ? "1.1" : "0.5"} />
              );
            })}
          </svg> */}

          {/* Trames en éventail (complément mangasen, coin bas de la zone confinée) */}
          <svg className="absolute bottom-0 left-0 w-28 h-28 opacity-[0.12]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {Array.from({ length: 10 }).map((_, i) => {
              const angle = -10 + i * 8;
              const rad = (angle * Math.PI) / 180;
              const len = 50 + (i % 2) * 20;
              return (
                <line key={`fan-${i}`}
                  x1="0" y1="100"
                  x2={len * Math.cos(rad)} y2={100 - len * Math.sin(rad)}
                  stroke="#7776bc" strokeWidth="0.5" />
              );
            })}
          </svg>

          {/* Brume éthérée */}
          {/* <div className="absolute top-[10%] left-[10%] w-32 h-20 bg-[#cdc7e5]/10 blur-3xl rounded-full" />
          <div className="absolute top-[30%] right-[6%] w-28 h-16 bg-[#7776bc]/10 blur-3xl rounded-full" /> */}

          {/* Pixel Sorting & Datamosh — bandes de glitch horizontales discrètes */}
          <div className="absolute top-[18%] left-0 w-[38%] h-[3px] bg-[#7776bc]/25" style={{ transform: 'translateX(4px)' }} />
          <div className="absolute top-[18.5%] left-[38%] w-[20%] h-[3px] bg-[#ff2e63]/20" />
          <div className="absolute top-[44%] right-0 w-[30%] h-[2px] bg-[#00e0ff]/20" style={{ transform: 'translateX(-6px)' }} />
          <div className="absolute top-[44.4%] right-[30%] w-[15%] h-[2px] bg-[#fffbdb]/20" />
          <div className="absolute top-[52%] left-[12%] w-[22%] h-[2px] bg-[#7776bc]/18" />

          {/* Onomatopées flottantes (Katakana) */}
          <div className="absolute top-[8%] left-[8%] text-[#fffbdb] text-xl font-black opacity-30 rotate-[-8deg] select-none" style={{ fontFamily: 'sans-serif' }}>ドン!</div>
          <div className="absolute bottom-[14%] right-[10%] text-[#7776bc] text-2xl font-black opacity-25 rotate-[6deg] select-none" style={{ fontFamily: 'sans-serif' }}>バーン</div>
          <div className="absolute top-[38%] right-[20%] text-[#cdc7e5] text-base font-black opacity-20 rotate-[-4deg] select-none" style={{ fontFamily: 'sans-serif' }}>ズシャ</div>
        </div>

        <div className="absolute -inset-10 border-[6px] border-violet-500/10 blur-xl" />
        <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(23,20,19,0.65)] rounded-[24px]" />
      </div>
    )
  };
      
    case 'Penseur':
      return {
        fontTitle: "font-oswald font-extrabold tracking-wide uppercase text-[#ffff82]",
        fontData: "font-montserrat font-semibold",
        fontCitation: "font-playfair italic t-white",
        accentColor: "text-[#FFFF82]",
        accentBorder: "border-[#FFFF82]/80",
        innerBorder: "border-[#FFFF82]/30",
        outerBorder: "border-[#d97706]/80 shadow-[0_0_24px_rgba(217, 119, 6.45)]",
        themeBgGradient: "from-[#d97706]/95 via-[#d97706]/90 to-[#171413]/95",
        
        nameSectionStyle: "border-2 border-[#FFFF82]/80 bg-[#171413]/90 backdrop-blur-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.85)] rounded-xl",
        textBoxStyle: "border-2 border-[#A16207]/80 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.85),0_4px_6px_rgba(0,0,0,0.5)]",
        portraitBorderStyle: "border-2 border-[#d97706]/60 shadow-[0_0_12px_rgba(217, 119, 6.45)]",
        classBadgeStyle: "border-2 border-[#d97706]/80 bg-gradient-to-r from-[#171413] via-[#2a2420] to-[#171413]",
        specBoxStyle: "border-2 border-[#525174]/60",
        citationBoxStyle: "border border-[#A16207]/50 bg-[#171413]/55",
        iconContainerStyle: "border-[#FFFF82]/80 shadow-[0_0_8px_rgba(255, 255, 130,0.4)]",
        dividerStyle: "via-[#A16207]/30",
        failleColor: "text-[#FFFF82]",
        
        textBoxBgImage: `linear-gradient(to bottom, rgba(255, 255, 130, 0.02), rgba(23, 20, 19, 0.82)), url(${penseurBackground})`,
        textBoxBgBlendMode: 'multiply',
        quoteIconStyle: "text-[#A16207] drop-shadow-[0_0_6px_rgba(255, 255, 130,0.6)]",
        
        cornerStyle: 'rivet',
        showScratches: false,
        showBlood: false,
        showEmber: false,
  effectOverlay: (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-[24px]">
      {/* ═══ COUCHE DE LISIBILITÉ : voile protecteur sous les zones de texte ═══ */}
      {/* Renforce le fond derrière les textes pour garantir la lisibilité */}
      <div className="absolute bottom-0 inset-x-0 h-[42%] bg-gradient-to-t from-[#171413]/55 via-[#171413]/25 to-transparent" />

      {/* Teinte d'ambiance (réduite pour préserver la lisibilité) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFFF82]/[0.02] via-transparent to-[#d97706]/[0.01] mix-blend-overlay" />

      {/* Texture parchemin de fond — très subtile, pleine carte */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#A16207_0.6px,transparent_0.6px)] [background-size:6px_6px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(101,67,33,0.15)_100%)] mix-blend-multiply" />

      {/* ═══ ZONE CONFINÉE : en-tête + portrait uniquement ═══ */}
      <div className="absolute top-0 left-0 right-0 h-[58%] overflow-hidden">

        {/* ── Symbole Idée (ampoule) — point focal, coin haut-gauche ── */}
        <div className="absolute top-[6%] right-[82%] w-14 h-14 opacity-[0.45]" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}>
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Rayons d'idée — animation subtile */}
            <g stroke="#FFFF82" strokeWidth="2" strokeLinecap="round" opacity="0.35" style={{ animation: 'penseurGlow 4s ease-in-out infinite' }}>
              <line x1="50" y1="2" x2="50" y2="12" />
              <line x1="20" y1="14" x2="27" y2="21" />
              <line x1="80" y1="14" x2="73" y2="21" />
              <line x1="8" y1="42" x2="18" y2="42" />
              <line x1="92" y1="42" x2="82" y2="42" />
            </g>
            {/* Verre de l'ampoule */}
            <path d="M50,18 C64,18 74,29 74,42 C74,52 68,58 64,64 C61,68 60,72 60,76 L40,76 C40,72 39,68 36,64 C32,58 26,52 26,42 C26,29 36,18 50,18 Z"
              fill="#A16207" opacity="0.25" stroke="#d97706" strokeWidth="1.4" />
            {/* Filament stylisé */}
            <path d="M42,52 L46,42 L50,52 L54,42 L58,52" stroke="#FFFF82" strokeWidth="1.3" fill="none" opacity="0.75" />
            {/* Culot / vis */}
            <line x1="40" y1="78" x2="60" y2="78" stroke="#d97706" strokeWidth="1.6" />
            <line x1="41" y1="83" x2="59" y2="83" stroke="#d97706" strokeWidth="1.6" />
            <line x1="42" y1="88" x2="58" y2="88" stroke="#d97706" strokeWidth="1.6" />
            <rect x="44" y="90" width="12" height="5" rx="1.5" fill="#A16207" opacity="0.8" />
          </svg>
        </div>

        {/* ── Hiéroglyphes — glyphes redessinés, plus nets et reconnaissables ── */}
        <svg className="absolute top-[49%] left-[5%] w-10 h-48 opacity-[0.22]" viewBox="0 0 36 190" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Œil d'Horus (Oudjat) */}
          <g fill="none" stroke="#FFFF82" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round">
            <path d="M2,22 Q18,8 34,22 Q18,32 2,22 Z" />
            <circle cx="18" cy="22" r="4" fill="#FFFF82" opacity="0.75" />
            <path d="M2,22 Q-2,26 -1,32" />
            <path d="M18,32 L16,44 Q13,50 8,49" />
            <path d="M34,22 L38,18" />
          </g>

          {/* Ânkh (clé de vie) */}
          <g fill="none" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round">
            <ellipse cx="18" cy="72" rx="8" ry="10" />
            <line x1="18" y1="82" x2="18" y2="110" />
            <line x1="5" y1="93" x2="31" y2="93" />
          </g>

          {/* Faucon Horus stylisé */}
          <g fill="none" stroke="#A16207" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18,124 C24,122 29,126 30,132 C31,137 27,140 23,139" />
            <path d="M30,132 L36,129" />
            <ellipse cx="16" cy="138" rx="10" ry="7" />
            <path d="M8,140 Q3,144 2,150" />
            <path d="M22,143 L23,153" />
            <path d="M12,143 L11,153" />
          </g>

          {/* Scarabée (khepri) */}
          <g fill="none" stroke="#FFFF82" strokeWidth="1" strokeLinecap="round">
            <ellipse cx="18" cy="170" rx="9" ry="7" opacity="0.7" />
            <path d="M18,163 L18,177" opacity="0.5" />
            <path d="M9,166 Q4,162 3,157" opacity="0.6" />
            <path d="M27,166 Q32,162 33,157" opacity="0.6" />
            <path d="M9,174 Q4,178 3,183" opacity="0.6" />
            <path d="M27,174 Q32,178 33,183" opacity="0.6" />
          </g>
        </svg>

        {/* ── Ombre de plume d'oie — bas-gauche, courbe naturelle ── */}
        <svg className="absolute bottom-[3%] left-[8%] w-14 h-32 opacity-[0.15]" viewBox="0 0 60 130" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M46,4 C40,26 26,42 20,66 C15,86 18,108 12,126" stroke="#171413" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          {Array.from({ length: 10 }).map((_, i) => {
            const t = i / 9;
            const x = 46 - t * 30;
            const y = 8 + t * 112;
            const len = 10 + (1 - t) * 6;
            return (
              <path key={`barb-${i}`}
                d={`M${x},${y} q${-len},${len*0.35} ${-len*0.6},${len}`}
                stroke="#171413" strokeWidth="0.55" fill="none" opacity={0.5 + t * 0.3} />
            );
          })}
        </svg>

        {/* ── Lettrine enluminée médiévale — cadre orné, haut-droit ── */}
        <div className="absolute bottom-[56%] right-[4.5%] w-16 h-16 opacity-[0.25]">
          <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Cadre décoratif */}
            <rect x="3" y="3" width="74" height="74" rx="2" stroke="#d97706" strokeWidth="1.2" fill="#171413" fillOpacity="0.15" />
            <rect x="7" y="7" width="66" height="66" rx="1" stroke="#A16207" strokeWidth="0.6" strokeDasharray="2 2" />
            {/* Lettrine gothique stylisée */}
            <text x="40" y="56" fontSize="46" fill="#FFFF82" fontFamily="serif" fontWeight="bold" textAnchor="middle" opacity="0.75">A</text>
            {/* Enluminures aux coins */}
            <circle cx="10" cy="10" r="2" fill="#d97706" opacity="0.7" />
            <circle cx="70" cy="10" r="2" fill="#d97706" opacity="0.7" />
            <circle cx="10" cy="70" r="2" fill="#d97706" opacity="0.7" />
            <circle cx="70" cy="70" r="2" fill="#d97706" opacity="0.7" />
          </svg>
        </div>

        {/* ── NOUVEAU : Rouleau de parchemin déroulé — haut-gauche, subtil ── */}
        <div className="absolute top-[2%] left-[3%] w-12 h-20 opacity-[0.05]">
          <svg viewBox="0 0 48 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="8" width="32" height="64" rx="2" fill="#A16207" opacity="0.3" stroke="#d97706" strokeWidth="0.8" />
            <line x1="12" y1="18" x2="36" y2="18" stroke="#FFFF82" strokeWidth="0.5" opacity="0.5" />
            <line x1="12" y1="26" x2="32" y2="26" stroke="#FFFF82" strokeWidth="0.5" opacity="0.4" />
            <line x1="12" y1="34" x2="36" y2="34" stroke="#FFFF82" strokeWidth="0.5" opacity="0.4" />
            <line x1="12" y1="42" x2="30" y2="42" stroke="#FFFF82" strokeWidth="0.5" opacity="0.4" />
            <line x1="12" y1="50" x2="34" y2="50" stroke="#FFFF82" strokeWidth="0.5" opacity="0.4" />
            <line x1="12" y1="58" x2="32" y2="58" stroke="#FFFF82" strokeWidth="0.5" opacity="0.4" />
            <ellipse cx="8" cy="8" rx="4" ry="3" fill="#d97706" opacity="0.5" />
            <ellipse cx="40" cy="72" rx="4" ry="3" fill="#d97706" opacity="0.5" />
          </svg>
        </div>

        {/* ── NOUVEAU : Compas antique — symbole de quête du savoir, haut-droit ── */}
        <div className="absolute top-[4%] right-[4%] w-12 h-12 opacity-[0.15]">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="20" stroke="#d97706" strokeWidth="1" fill="none" opacity="0.6" />
            <circle cx="24" cy="24" r="14" stroke="#A16207" strokeWidth="0.5" fill="none" opacity="0.5" strokeDasharray="2 2" />
            <path d="M24,8 L20,24 L24,40 L28,24 Z" fill="#FFFF82" opacity="0.4" stroke="#d97706" strokeWidth="0.6" />
            <circle cx="24" cy="24" r="2" fill="#d97706" opacity="0.7" />
            <line x1="24" y1="4" x2="24" y2="8" stroke="#FFFF82" strokeWidth="0.8" opacity="0.5" />
            <line x1="24" y1="40" x2="24" y2="44" stroke="#FFFF82" strokeWidth="0.8" opacity="0.5" />
            <line x1="4" y1="24" x2="8" y2="24" stroke="#FFFF82" strokeWidth="0.8" opacity="0.5" />
            <line x1="40" y1="24" x2="44" y2="24" stroke="#FFFF82" strokeWidth="0.8" opacity="0.5" />
          </svg>
        </div>
      </div>

      {/* ── Ligne d'écriture gothique/médiévale — bandeau fin sous le portrait ── */}
      <svg className="absolute top-[56%] left-0 w-full h-6 opacity-[0.14]" viewBox="0 0 300 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="10" y="17" fontSize="13" fill="#FFFF82" fontFamily="serif" fontWeight="700" letterSpacing="1"
          style={{ fontFamily: 'Georgia, serif' }}>
          Sapientia · Veritas · Ratio · Lumen
        </text>
      </svg>

      {/* ── Constellations éphémères — quelques étoiles nettes, pleine carte ── */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.15]" viewBox="0 0 300 480" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#FFFF82" strokeWidth="0.4" opacity="0.5">
          <line x1="45" y1="55" x2="72" y2="85" />
          <line x1="72" y1="85" x2="58" y2="120" />
          <line x1="238" y1="105" x2="262" y2="135" />
          <line x1="262" y1="135" x2="250" y2="168" />
        </g>
        {[[45,55],[72,85],[58,120],[238,105],[262,135],[250,168]].map(([x,y], i) => (
          <g key={`star-${i}`}>
            <circle cx={x} cy={y} r="2.2" fill="#FFFF82" opacity="0.12" />
            <circle cx={x} cy={y} r="1" fill="#FFFF82" opacity="0.6" />
          </g>
        ))}
      </svg>

      {/* ── Synapses — discrètes, cantonnées au bas de carte ── */}
      <svg className="absolute bottom-0 inset-x-0 w-full h-[90px] opacity-[0.05]" viewBox="0 0 300 90" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#d97706" strokeWidth="0.5" fill="none">
          <path d="M60,20 Q85,8 105,22 Q125,36 148,18" />
          <path d="M148,18 Q160,35 145,50" />
        </g>
        {[[60,20],[105,22],[148,18],[145,50]].map(([x,y], i) => (
          <circle key={`syn-${i}`} cx={x} cy={y} r="1.8" fill="#FFFF82" opacity="0.1" />
        ))}
      </svg>

      {/* ── NOUVEAU : Particules de poussière de parchemin flottante ── */}
      {[
        [20, 30], [35, 45], [50, 25], [65, 40], [78, 28], [25, 55], [55, 50], [72, 60], [40, 65], [85, 50]
      ].map(([left, top], i) => (
        <div key={`penseur-dust-${i}`} className="absolute rounded-full bg-[#FFFF82]"
          style={{
            left: `${left}%`, top: `${top}%`,
            width: '1.5px', height: '1.5px',
            opacity: 0.15 + (i % 3) * 0.08,
            boxShadow: '0 0 3px rgba(255,255,130,0.2)',
            animation: `penseurDust ${4 + (i % 3)}s infinite ease-in-out`
          }} />
      ))}

      {/* ── NOUVEAU : Halo lumineux doré diffus (aura de réflexion) ── */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-48 h-48 bg-[radial-gradient(circle,rgba(255,255,130,0.06)_0%,transparent_70%)] blur-[20px] mix-blend-screen" />

      {/* ── NOUVEAU : Cadre de manuscrit ancien — bordure ornementale fine ── */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.10]" viewBox="0 0 300 480" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="280" height="460" rx="18" stroke="#d97706" strokeWidth="0.6" strokeDasharray="3 3" />
        {/* Ornements de coins */}
        <path d="M10,30 Q14,14 30,10" stroke="#FFFF82" strokeWidth="0.8" opacity="0.6" />
        <path d="M290,30 Q286,14 270,10" stroke="#FFFF82" strokeWidth="0.8" opacity="0.6" />
        <path d="M10,450 Q14,466 30,470" stroke="#FFFF82" strokeWidth="0.8" opacity="0.6" />
        <path d="M290,450 Q286,466 270,470" stroke="#FFFF82" strokeWidth="0.8" opacity="0.6" />
      </svg>

      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-amber-200/[0.04] via-transparent to-transparent" />
      <div className="absolute -top-8 left-[30%] w-40 h-32 bg-[#d97706]/[0.06] blur-[30px] rounded-full" />

      {/* Ombrage interne final — réduit pour préserver la lisibilité */}
      <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(23,20,19,0.15)] rounded-[24px]" />

      {/* Keyframes */}
      <style>{`
        @keyframes penseurGlow {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.55; }
        }
        @keyframes penseurDust {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.15; }
          50% { transform: translateY(-5px) scale(1.4); opacity: 0.15; }
        }
      `}</style>
    </div>
  )
      };
      
    case 'Dirigeant':
      return {
        fontTitle: "font-bebas tracking-wide uppercase text-[#fffbdb]",
        fontData: "font-montserrat font-semibold",
        fontCitation: "font-playfair italic",
        accentColor: "text-[#c670ff]",
        accentBorder: "border-[#c670ff]/80",
        innerBorder: "border-[#c670ff]/30",
        outerBorder: "border-[#ffd500]/80 shadow-[0_0_24px_rgba(255, 213, 0,0.45)]",
        themeBgGradient: "from-[#ffd500]/95 via-[#ffd500]/90 to-[#171413]/95",
        
        nameSectionStyle: "border-2 border-[#c670ff]/80 bg-[#171413]/90 backdrop-blur-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.85)] rounded-xl",
        textBoxStyle: "border-2 border-[#fdc500]/80 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.85),0_4px_6px_rgba(0,0,0,0.5)]",
        portraitBorderStyle: "border-2 border-[#ffd500]/60 shadow-[0_0_12px_rgba(255, 213, 0,0.45)]",
        classBadgeStyle: "border-2 border-[#ffd500]/80 bg-gradient-to-r from-[#171413] via-[#2a2420] to-[#171413]",
        specBoxStyle: "border-2 border-[#525174]/60",
        citationBoxStyle: "border border-[#fdc500]/50 bg-[#171413]/55",
        iconContainerStyle: "border-[#c670ff]/80 shadow-[0_0_8px_rgba(61, 0, 102,0.4)]",
        dividerStyle: "via-[#fdc500]/30",
        failleColor: "text-[#c670ff]",
        
        textBoxBgImage: `linear-gradient(to bottom, rgba(255, 213, 0, 0.08), rgba(23, 20, 19, 0.82)), url(${dirigeantBackground})`,
        textBoxBgBlendMode: 'normal',
        quoteIconStyle: "text-[#fdc500] drop-shadow-[0_0_6px_rgba(255, 213, 0,0.6)]",
        
        cornerStyle: 'rivet',
        showScratches: false,
        showBlood: false,
        showEmber: false,
        effectOverlay: (
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-[24px]">
            {/* ═══ PAPIER FILIGRANÉ (emblème d'État en transparence) ═══ */}
            <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-44 h-44 opacity-[0.04] text-[#fcd34d]">
              <svg viewBox="0 0 100 100" fill="currentColor">
                <path d="M50,10 L62,38 L92,38 L68,56 L78,86 L50,68 L22,86 L32,56 L8,38 L38,38 Z" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="50" cy="50" r="14" stroke="currentColor" strokeWidth="1" fill="none" />
                <path d="M50,36 V64 M36,50 H64" stroke="currentColor" strokeWidth="0.8" />
              </svg>
            </div>

            {/* ═══ CARTE TOPOGRAPHIQUE EN FILIGRANE (courbes de niveau) ═══ */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.07]" viewBox="0 0 300 480" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M-20,120 Q60,100 140,130 Q220,160 320,140" stroke="#fcd34d" strokeWidth="0.4" />
              <path d="M-20,150 Q70,130 150,160 Q230,190 320,170" stroke="#fcd34d" strokeWidth="0.4" />
              <path d="M-20,180 Q80,160 160,190 Q240,220 320,200" stroke="#fcd34d" strokeWidth="0.4" />
              <path d="M-20,210 Q90,190 170,220 Q250,250 320,230" stroke="#fcd34d" strokeWidth="0.4" />
              <path d="M-20,240 Q100,220 180,250 Q260,280 320,260" stroke="#fcd34d" strokeWidth="0.4" />
              <path d="M-20,270 Q110,250 190,280 Q270,310 320,290" stroke="#fcd34d" strokeWidth="0.4" />
              <path d="M-20,300 Q120,280 200,310 Q280,340 320,320" stroke="#fcd34d" strokeWidth="0.4" />
              <path d="M-20,330 Q130,310 210,340 Q290,370 320,350" stroke="#fcd34d" strokeWidth="0.4" />
              <path d="M-20,360 Q140,340 220,370 Q300,400 320,380" stroke="#fcd34d" strokeWidth="0.4" />
              <path d="M-20,390 Q150,370 230,400 Q310,430 320,410" stroke="#fcd34d" strokeWidth="0.4" />
            </svg>

            {/* ═══ LE PANTHÉON DES LÉGENDES (silhouettes de monuments) ═══ */}
            <div className="absolute bottom-[20%] left-0 right-0 h-32 opacity-[0.06]">
              <svg className="w-full h-full" viewBox="0 0 300 128" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Obélisque gauche */}
                <path d="M20,128 L20,40 L24,20 L28,40 L28,128 Z" fill="#fcd34d" />
                <path d="M22,20 L24,8 L26,20" fill="#fcd34d" />
                {/* Colonnade centrale */}
                <rect x="100" y="60" width="100" height="68" fill="#fcd34d" opacity="0.5" />
                {Array.from({ length: 7 }).map((_, i) => (
                  <rect key={`col-${i}`} x={104 + i * 13} y="50" width="6" height="78" fill="#fcd34d" />
                ))}
                <path d="M95,60 L150,40 L205,60 Z" fill="#fcd34d" opacity="0.6" />
                {/* Obélisque droit */}
                <path d="M272,128 L272,40 L276,20 L280,40 L280,128 Z" fill="#fcd34d" />
                <path d="M274,20 L276,8 L278,20" fill="#fcd34d" />
              </svg>
            </div>

            {/* ═══ L'OMBRE DU DRAPEAU (bannière drapée) ═══ */}
            <div className="absolute top-0 left-0 w-24 h-full opacity-[0.08]">
              <svg className="w-full h-full" viewBox="0 0 96 480" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0,0 L80,0 Q72,60 80,120 Q88,180 76,240 Q64,300 82,360 Q72,420 80,480 L0,480 Z" fill="#c670ff" opacity="0.6" />
                <path d="M10,40 Q70,50 70,60 M10,100 Q70,110 70,120 M10,160 Q70,170 70,180 M10,220 Q70,230 70,240 M10,280 Q70,290 70,300 M10,340 Q70,350 70,360 M10,400 Q70,410 70,420" stroke="#fcd34d" strokeWidth="0.5" opacity="0.4" fill="none" />
              </svg>
            </div>
            <div className="absolute top-0 right-0 w-20 h-full opacity-[0.07]">
              <svg className="w-full h-full" viewBox="0 0 80 480" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M80,0 L8,0 Q16,60 8,120 Q0,180 14,240 Q26,300 6,360 Q16,420 8,480 L80,480 Z" fill="#c670ff" opacity="0.6" />
                <path d="M70,40 Q10,50 10,60 M70,100 Q10,110 10,120 M70,160 Q10,170 10,180 M70,220 Q10,230 10,240 M70,280 Q10,290 10,300 M70,340 Q10,350 10,360 M70,400 Q10,410 10,420" stroke="#fcd34d" strokeWidth="0.5" opacity="0.4" fill="none" />
              </svg>
            </div>

            {/* ═══ LE TRÔNE INVISIBLE (ombre portée) ═══ */}
            <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-40 h-56 opacity-[0.07]">
              <svg viewBox="0 0 160 224" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M30,224 L30,80 Q30,40 50,30 L110,30 Q130,40 130,80 L130,224 Z" fill="#fcd34d" />
                <path d="M30,80 L20,80 L20,30 Q20,10 40,10 L120,10 Q140,10 140,30 L140,80 L130,80" fill="#fcd34d" opacity="0.7" />
                <rect x="40" y="90" width="80" height="100" fill="#171413" opacity="0.3" />
                <rect x="30" y="190" width="100" height="34" fill="#fcd34d" opacity="0.8" />
              </svg>
            </div>

            {/* ═══ RÉFLEXIONS DE MÉTAL PRÉCIEUX (anisotropie sur cadre) ═══ */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.20]" viewBox="0 0 300 480" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="6" width="288" height="468" rx="20" stroke="url(#goldAniso)" strokeWidth="1.5" />
              <rect x="10" y="10" width="280" height="460" rx="18" stroke="url(#goldAniso2)" strokeWidth="0.6" />
              <defs>
                <linearGradient id="goldAniso" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fcd34d" stopOpacity="0.9" />
                  <stop offset="25%" stopColor="#fde68a" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#fcd34d" stopOpacity="0.9" />
                  <stop offset="75%" stopColor="#fde68a" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#fcd34d" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="goldAniso2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fde68a" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#fcd34d" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#fde68a" stopOpacity="0.6" />
                </linearGradient>
              </defs>
            </svg>

            {/* ═══ LA COURONNE DE LAURIERS VIVANTE (animée) ═══ */}
            <div className="absolute top-[6%] left-1/2 -translate-x-1/2 w-28 h-16 opacity-[0.18]">
              <svg viewBox="0 0 112 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'dirigeantLaurel 6s ease-in-out infinite' }}>
                {/* Branche gauche */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <ellipse key={`l-l-${i}`} cx={20 + i * 2} cy={32 - i * 4} rx="8" ry="3" fill="#fcd34d" opacity="0.7"
                    transform={`rotate(${-50 + i * 8} ${20 + i * 2} ${32 - i * 4})`} />
                ))}
                {/* Branche droite */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <ellipse key={`l-r-${i}`} cx={92 - i * 2} cy={32 - i * 4} rx="8" ry="3" fill="#fcd34d" opacity="0.7"
                    transform={`rotate(${50 - i * 8} ${92 - i * 2} ${32 - i * 4})`} />
                ))}
                {/* Noeud central */}
                <circle cx="56" cy="40" r="3" fill="#fcd34d" />
              </svg>
            </div>

            {/* ═══ POUSSIÈRE DE GLOIRE (particules dorées + lens flare) ═══ */}
            {[
              [15, 20], [28, 35], [42, 15], [58, 28], [72, 18], [85, 32], [20, 50], [48, 45], [68, 55], [82, 48], [30, 68], [55, 72], [75, 65], [38, 82], [62, 85]
            ].map(([left, top], i) => (
              <div key={`dir-spark-${i}`} className="absolute rounded-full bg-[#fcd34d]"
                style={{
                  left: `${left}%`, top: `${top}%`,
                  width: `${(i % 3) + 1}px`, height: `${(i % 3) + 1}px`,
                  opacity: 0.2 + (i % 4) * 0.1,
                  boxShadow: '0 0 4px rgba(252,211,77,0.3)',
                  animation: `dirigeantDust ${3 + (i % 3)}s infinite ease-in-out`
                }} />
            ))}
            {/* Lens flare principal */}
            <div className="absolute top-[25%] left-[30%] w-16 h-16 bg-[radial-gradient(circle,rgba(252,211,77,0.15)_0%,transparent_70%)] blur-[4px] mix-blend-screen" />
            <div className="absolute top-[40%] right-[25%] w-12 h-12 bg-[radial-gradient(circle,rgba(252,211,77,0.12)_0%,transparent_70%)] blur-[3px] mix-blend-screen" />

            {/* ═══ TAMpons ENCREURS ET SCEAUX À CIRE ═══ */}
            {/* Tampon "APPROUVÉ" coin haut-gauche */}
            <div className="absolute top-[5%] left-[4%] w-16 h-16 opacity-[0.22] rotate-[-12deg]">
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="32" r="28" stroke="#dc2626" strokeWidth="2" fill="none" opacity="0.7" />
                <circle cx="32" cy="32" r="24" stroke="#dc2626" strokeWidth="1" fill="none" opacity="0.5" strokeDasharray="2 2" />
                <text x="32" y="36" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#dc2626" opacity="0.8" fontFamily="monospace">APPROUVÉ</text>
              </svg>
            </div>
            {/* Tampon "CONFIDENTIEL" coin haut-droit */}
            <div className="absolute top-[8%] right-[5%] w-20 h-12 opacity-[0.18] rotate-[8deg]">
              <svg viewBox="0 0 80 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="76" height="44" rx="3" stroke="#dc2626" strokeWidth="1.5" fill="none" opacity="0.7" />
                <text x="40" y="28" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#dc2626" opacity="0.8" fontFamily="monospace">CONFIDENTIEL</text>
              </svg>
            </div>
            {/* Sceau de cire rouge coin bas-droit */}
            <div className="absolute bottom-[14%] right-[6%] w-14 h-14 opacity-[0.35] rotate-[15deg]">
              <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M28,4 C40,4 52,14 52,28 C52,42 40,52 28,52 C16,52 4,42 4,28 C4,14 16,4 28,4 Z"
                  fill="#dc2626" opacity="0.7" />
                <path d="M28,4 C40,4 52,14 52,28 C52,42 40,52 28,52 C16,52 4,42 4,28 C4,14 16,4 28,4 Z"
                  fill="none" stroke="#7f1d1d" strokeWidth="1" opacity="0.5" />
                <path d="M28,16 L36,28 L28,40 L20,28 Z" fill="#7f1d1d" opacity="0.6" />
                <circle cx="28" cy="28" r="4" fill="#fcd34d" opacity="0.5" />
                {/* Imperfections de cire */}
                <circle cx="12" cy="20" r="2" fill="#dc2626" opacity="0.4" />
                <circle cx="44" cy="38" r="1.5" fill="#dc2626" opacity="0.3" />
              </svg>
            </div>
            {/* Sceau héraldique bas-gauche */}
            <div className="absolute bottom-[16%] left-[5%] w-12 h-12 opacity-[0.20] rotate-[-8deg]">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24,3 L30,18 L45,18 L33,27 L38,42 L24,33 L10,42 L15,27 L3,18 L18,18 Z" fill="#1a1a1a" opacity="0.6" stroke="#fcd34d" strokeWidth="0.8" />
                <circle cx="24" cy="24" r="5" fill="#fcd34d" opacity="0.4" />
              </svg>
            </div>

            {/* ═══ LA SIGNATURE MANUSCRITE (paraphe officiel) ═══ */}
            <div className="absolute bottom-[6%] left-1/2 -translate-x-1/2 w-56 h-10 opacity-[0.20]">
              <svg viewBox="0 0 224 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8,28 Q14,12 22,24 Q30,36 38,20 Q46,8 54,26 Q62,34 70,18 Q78,10 86,28 Q94,36 102,22 Q110,14 118,30 Q126,38 134,24 Q142,16 150,32 Q158,38 166,26 Q174,18 182,30 Q190,36 198,24 Q206,16 214,28"
                  stroke="#fcd34d" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.8" />
                <path d="M8,28 Q14,12 22,24 Q30,36 38,20 Q46,8 54,26 Q62,34 70,18 Q78,10 86,28 Q94,36 102,22 Q110,14 118,30 Q126,38 134,24 Q142,16 150,32 Q158,38 166,26 Q174,18 182,30 Q190,36 198,24 Q206,16 214,28"
                  stroke="#fde68a" strokeWidth="0.4" fill="none" strokeLinecap="round" opacity="0.5" />
                {/* Paraphe final */}
                <path d="M214,28 Q218,20 210,16 Q206,14 208,22" stroke="#fcd34d" strokeWidth="0.8" fill="none" opacity="0.7" strokeLinecap="round" />
              </svg>
            </div>

            {/* Vignettage de velours impérial */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(15,23,42,0.45)_100%)]" />

            {/* Ombrage interne final */}
            <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(15,23,42,0.5)] rounded-[24px]" />

            {/* Keyframes */}
            <style>{`
              @keyframes dirigeantDust {
                0%, 100% { transform: translateY(0) scale(1); opacity: 0.2; }
                50% { transform: translateY(-6px) scale(1.3); opacity: 0.5; }
              }
              @keyframes dirigeantLaurel {
                0%, 100% { transform: rotate(-1deg) scale(1); }
                50% { transform: rotate(1deg) scale(1.03); }
              }
            `}</style>
          </div>
        )
      };
      
    case 'Athlète':
      return {
        fontTitle: "font-anton tracking-wide uppercase text-[#C08A5A]",
        fontData: "font-montserrat font-semibold",
        fontCitation: "font-playfair italic",
        accentColor: "text-[#C08A5A]",
        accentBorder: "border-[#C08A5A]/80",
        innerBorder: "border-[#C08A5A]/30",
        outerBorder: "border-[#00A86B]/80 shadow-[0_0_24px_rgba(0, 168, 107,0.45)]",
        themeBgGradient: "from-[#00A86B]/95 via-[#00A86B]/90 to-[#171413]/95",
        
        nameSectionStyle: "border-2 border-[#C08A5A]/80 bg-[#171413]/90 backdrop-blur-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.85)] rounded-xl",
        textBoxStyle: "border-2 border-[#2bc016]/80 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.85),0_4px_6px_rgba(0,0,0,0.5)]",
        portraitBorderStyle: "border-2 border-[#00A86B]/60 shadow-[0_0_12px_rgba(0, 168, 107,0.45)]",
        classBadgeStyle: "border-2 border-[#00A86B]/80 bg-gradient-to-r from-[#171413] via-[#2a2420] to-[#171413]",
        specBoxStyle: "border-2 border-[#525174]/60",
        citationBoxStyle: "border border-[#2bc016]/50 bg-[#171413]/55",
        iconContainerStyle: "border-[#C08A5A]/80 shadow-[0_0_8px_rgba(108, 78, 45,0.4)]",
        dividerStyle: "via-[#2bc016]/30",
        failleColor: "text-[#C08A5A]",
        
        textBoxBgImage: `linear-gradient(to bottom, rgba(43, 192, 22, 0.08), rgba(23, 20, 19, 0.82)), url(${athleteBackground})`,
        textBoxBgBlendMode: 'normal',
        quoteIconStyle: "text-[#2bc016] drop-shadow-[0_0_6px_rgba(43, 192, 22,0.6)]",
        
        cornerStyle: 'rivet',
        showScratches: false,
        showBlood: false,
        showEmber: false,
        effectOverlay: (
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-[24px]">
            {/* ═══ AMBIANCE DE BASE ═══ */}
            {/* Teinte d'arène */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#00A86B]/[0.04] via-transparent to-[#C08A5A]/10 mix-blend-overlay" />

            {/* Grille technique (lignes de terrain) */}
            <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(rgba(255,255,255,0.2)_0.5px,transparent_0.5px),linear-gradient(90deg,rgba(255,255,255,0.2)_0.5px,transparent_0.5px)] [background-size:20px_20px]" />

            {/* ═══ BUÉE ET CONDENSATION (bords de vitre) ═══ */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(220,235,245,0.10)_100%)] mix-blend-screen" />
            <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-white/15 to-transparent blur-[2px]" />
            <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-white/12 to-transparent blur-[2px]" />
            <div className="absolute left-0 inset-y-0 w-8 bg-gradient-to-r from-white/10 to-transparent blur-[1.5px]" />
            <div className="absolute right-0 inset-y-0 w-8 bg-gradient-to-l from-white/10 to-transparent blur-[1.5px]" />
            {/* Gouttelettes de condensation */}
            {[
              [6, 12], [12, 28], [4, 45], [10, 62], [7, 78], [14, 88],
              [94, 10], [88, 24], [96, 40], [90, 58], [93, 74], [86, 90]
            ].map(([left, top], i) => (
              <div key={`drop-${i}`} className="absolute rounded-full bg-white/20 blur-[0.5px]"
                style={{ left: `${left}%`, top: `${top}%`, width: '3px', height: '4px' }} />
            ))}

            {/* ═══ PARTICULES DE PARKET / POUSSIÈRE (en suspension) ═══ */}
            {[
              [18, 22, 2], [32, 35, 1.5], [48, 18, 2.5], [62, 30, 1.5], [78, 25, 2],
              [25, 48, 1.5], [55, 42, 2], [72, 50, 1.5], [38, 55, 2], [85, 45, 1.5],
              [15, 68, 2], [42, 72, 1.5], [68, 65, 2], [88, 70, 1.5], [28, 82, 2]
            ].map(([left, top, size], i) => (
              <div key={`dust-${i}`} className="absolute rounded-full bg-[#C08A5A]/30"
                style={{ left: `${left}%`, top: `${top}%`, width: `${size}px`, height: `${size}px`,
                  boxShadow: '0 0 3px rgba(192,138,90,0.3)' }} />
            ))}

            {/* ═══ ZONE CONFINÉE : en-tête + portrait (haut 58%) ═══ */}
            <div className="absolute top-0 left-0 right-0 h-[58%] overflow-hidden">

              {/* ── Vapeur de sueur / Heat Map (aura de chaleur) ── */}
              <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-40 h-48 bg-[radial-gradient(ellipse_at_center,rgba(255,140,60,0.18)_0%,rgba(255,100,40,0.08)_40%,transparent_70%)] blur-[12px] mix-blend-screen" />

              {/* ── Électrodes / Biométrie ECG (rythme cardiaque) ── */}
              <svg className="absolute top-[20%] left-[6%] w-[180px] h-[60px] opacity-[0.22]" viewBox="0 0 180 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="0" y1="30" x2="180" y2="30" stroke="#00A86B" strokeWidth="0.4" opacity="0.5" />
                <path d="M0,30 L30,30 L36,30 L40,10 L46,50 L52,30 L70,30 L76,30 L80,15 L86,45 L92,30 L110,30 L116,30 L120,8 L126,52 L132,30 L150,30 L156,30 L160,18 L166,42 L172,30 L180,30"
                  stroke="#00A86B" strokeWidth="1" fill="none" />
              </svg>
              <svg className="absolute top-[35%] right-[8%] w-[140px] h-[40px] opacity-[0.18]" viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="0" y1="20" x2="140" y2="20" stroke="#2bc016" strokeWidth="0.4" opacity="0.5" />
                <path d="M0,20 L20,20 L24,20 L28,8 L32,32 L36,20 L55,20 L59,20 L63,12 L67,28 L71,20 L90,20 L94,20 L98,6 L102,34 L106,20 L125,20 L129,20 L133,14 L137,26 L140,20"
                  stroke="#2bc016" strokeWidth="0.9" fill="none" />
              </svg>

              {/* ── Traces de Speed Trails (lignes de mouvement) ── */}
              <svg className="absolute top-[10%] right-[5%] w-[120px] h-[180px] opacity-[0.20]" viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10,10 Q40,40 30,80 Q20,120 50,160" stroke="#00A86B" strokeWidth="1.5" fill="none" opacity="0.6" />
                <path d="M25,5 Q55,45 45,85 Q35,125 65,165" stroke="#2bc016" strokeWidth="1" fill="none" opacity="0.5" />
                <path d="M40,15 Q70,50 60,90 Q50,130 80,170" stroke="#C08A5A" strokeWidth="0.8" fill="none" opacity="0.4" />
              </svg>

              {/* ── Annotations Coach (cercles, flèches, lignes de passage) ── */}
              <svg className="absolute top-[8%] left-[8%] w-[100px] h-[100px] opacity-[0.20]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="30" cy="30" r="14" stroke="#C08A5A" strokeWidth="1.2" fill="none" strokeDasharray="3 2" />
                <circle cx="70" cy="60" r="10" stroke="#C08A5A" strokeWidth="1" fill="none" strokeDasharray="3 2" />
                <path d="M30,30 Q50,45 70,60" stroke="#C08A5A" strokeWidth="1" fill="none" />
                <path d="M65,55 L70,60 L65,65" stroke="#C08A5A" strokeWidth="1" fill="none" />
                <path d="M20,70 L40,80 L60,75" stroke="#C08A5A" strokeWidth="0.8" fill="none" strokeDasharray="2 3" />
              </svg>

              {/* ── Playbook en filigrane (pages tactiques) ── */}
              <svg className="absolute top-[30%] left-[10%] w-[80px] h-[100px] opacity-[0.10]" viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="72" height="92" stroke="#C08A5A" strokeWidth="0.6" fill="none" />
                <line x1="4" y1="20" x2="76" y2="20" stroke="#C08A5A" strokeWidth="0.4" />
                <line x1="4" y1="36" x2="76" y2="36" stroke="#C08A5A" strokeWidth="0.4" />
                <line x1="4" y1="52" x2="76" y2="52" stroke="#C08A5A" strokeWidth="0.4" />
                <line x1="4" y1="68" x2="76" y2="68" stroke="#C08A5A" strokeWidth="0.4" />
                <line x1="4" y1="84" x2="76" y2="84" stroke="#C08A5A" strokeWidth="0.4" />
                <circle cx="25" cy="28" r="4" stroke="#C08A5A" strokeWidth="0.5" fill="none" />
                <path d="M25,32 L40,45 L55,40" stroke="#C08A5A" strokeWidth="0.5" fill="none" />
                <path d="M52,36 L55,40 L50,42" stroke="#C08A5A" strokeWidth="0.5" fill="none" />
              </svg>
            </div>

            {/* ═══ ZONES DE CHALEUR (Heat Map) ═══ */}
            <div className="absolute top-[20%] left-[15%] w-24 h-24 bg-[radial-gradient(circle,rgba(59,130,246,0.18)_0%,transparent_70%)] blur-[8px] mix-blend-screen" />
            <div className="absolute top-[30%] right-[20%] w-28 h-28 bg-[radial-gradient(circle,rgba(250,204,21,0.16)_0%,transparent_70%)] blur-[8px] mix-blend-screen" />
            <div className="absolute top-[45%] left-[40%] w-32 h-32 bg-[radial-gradient(circle,rgba(239,68,68,0.14)_0%,transparent_70%)] blur-[10px] mix-blend-screen" />

            {/* ═══ LE FILET DE PANIER EN TRAME (maillage) ═══ */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.06]" viewBox="0 0 300 480" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
              {Array.from({ length: 24 }).map((_, i) => (
                <line key={`net-v-${i}`} x1={i * 12.5} y1="0" x2={i * 12.5} y2="480" stroke="#C08A5A" strokeWidth="0.3" />
              ))}
              {Array.from({ length: 38 }).map((_, i) => (
                <line key={`net-h-${i}`} x1="0" y1={i * 12.5} x2="300" y2={i * 12.5} stroke="#C08A5A" strokeWidth="0.3" />
              ))}
              {Array.from({ length: 24 }).map((_, i) => (
                <line key={`net-d-${i}`} x1={i * 12.5} y1="0" x2={i * 12.5 + 480} y2="480" stroke="#C08A5A" strokeWidth="0.2" opacity="0.5" />
              ))}
            </svg>

            {/* ═══ LE RUBAN DE VICTOIRE (satin) ═══ */}
            <div className="absolute top-[8%] -right-2 w-10 h-40 opacity-[0.25]">
              <svg viewBox="0 0 40 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12,0 Q20,20 12,40 Q4,60 12,80 Q20,100 12,120 Q4,140 12,160" stroke="#C08A5A" strokeWidth="6" fill="none" opacity="0.7" />
                <path d="M12,0 Q20,20 12,40 Q4,60 12,80 Q20,100 12,120 Q4,140 12,160" stroke="#fcd34d" strokeWidth="2" fill="none" opacity="0.5" />
                <circle cx="12" cy="20" r="3" fill="#fcd34d" opacity="0.6" />
                <circle cx="12" cy="80" r="3" fill="#fcd34d" opacity="0.6" />
                <circle cx="12" cy="140" r="3" fill="#fcd34d" opacity="0.6" />
              </svg>
            </div>

            {/* ═══ L'OMBRE DU TROPHÉE ═══ */}
            <div className="absolute bottom-[18%] left-1/2 -translate-x-1/2 w-24 h-32 opacity-[0.08]">
              <svg viewBox="0 0 96 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M30,8 L66,8 L66,28 Q66,48 48,52 Q30,48 30,28 Z" fill="#C08A5A" opacity="0.6" />
                <line x1="48" y1="52" x2="48" y2="72" stroke="#C08A5A" strokeWidth="3" opacity="0.6" />
                <rect x="32" y="72" width="32" height="8" rx="2" fill="#C08A5A" opacity="0.6" />
                <rect x="24" y="80" width="48" height="12" rx="2" fill="#C08A5A" opacity="0.5" />
                <path d="M30,20 Q18,22 18,32 Q18,42 30,40" stroke="#C08A5A" strokeWidth="2" fill="none" opacity="0.5" />
                <path d="M66,20 Q78,22 78,32 Q78,42 66,40" stroke="#C08A5A" strokeWidth="2" fill="none" opacity="0.5" />
              </svg>
            </div>

            {/* ═══ EFFET BÉTON ET GRAFF (street-ball) ═══ */}
            <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(135deg,rgba(200,200,200,0.3)_1px,transparent_1px),linear-gradient(45deg,rgba(200,200,200,0.3)_1px,transparent_1px)] [background-size:4px_4px]" />
            {/* Lignes de playground peintes à la bombe */}
            <svg className="absolute top-[50%] left-[5%] w-[90%] h-[40%] opacity-[0.10]" viewBox="0 0 270 160" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10,80 Q135,40 260,80" stroke="#C08A5A" strokeWidth="1.5" fill="none" />
              <path d="M10,80 Q135,120 260,80" stroke="#C08A5A" strokeWidth="1.5" fill="none" />
              <line x1="135" y1="20" x2="135" y2="140" stroke="#C08A5A" strokeWidth="1" />
              <circle cx="135" cy="80" r="20" stroke="#C08A5A" strokeWidth="1" fill="none" />
              <rect x="40" y="30" width="190" height="100" stroke="#C08A5A" strokeWidth="0.8" fill="none" />
            </svg>

            {/* ═══ TEXTURE DE BALLON (cuir granuleux) ═══ */}
            <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#1a1a1a_0.8px,transparent_0.8px)] [background-size:3px_3px] mix-blend-multiply" />

            {/* ═══ LE JUMBOTRON / SCOREBOARD (ligne défilante) ═══ */}
            {/* <div className="absolute bottom-3 left-2 right-2 h-5 bg-black/70 rounded-sm overflow-hidden border border-[#00A86B]/30">
              <div className="absolute inset-0 flex items-center whitespace-nowrap overflow-hidden">
                <div className="flex items-center gap-8 px-3 text-[8px] font-mono font-bold text-[#00A86B] tracking-wider"
                  style={{ animation: 'athleteTicker 18s linear infinite' }}>
                  <span>● LIVE</span>
                  <span>PTS: 42</span>
                  <span>REB: 12</span>
                  <span>AST: 8</span>
                  <span>STL: 3</span>
                  <span>BLK: 2</span>
                  <span>FG%: 58.3</span>
                  <span>3P%: 41.2</span>
                  <span>FT%: 87.5</span>
                  <span>MIN: 34:12</span>
                  <span>● LIVE</span>
                  <span>PTS: 42</span>
                  <span>REB: 12</span>
                  <span>AST: 8</span>
                  <span>STL: 3</span>
                  <span>BLK: 2</span>
                  <span>FG%: 58.3</span>
                  <span>3P%: 41.2</span>
                  <span>FT%: 87.5</span>
                  <span>MIN: 34:12</span>
                </div>
              </div>
            </div> */}

            {/* ═══ SPOTLIGHT DU STADE ═══ */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-56 h-64 bg-gradient-to-b from-white/10 via-[#00A86B]/[0.04] to-transparent opacity-50 mix-blend-screen"
              style={{ clipPath: 'polygon(42% 0%, 58% 0%, 100% 100%, 0% 100%)' }} />

            {/* Ombre interne finale */}
            <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(23,20,19,0.65)] rounded-[24px]" />

            {/* Keyframes pour le ticker */}
            <style>{`
              @keyframes athleteTicker {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
            `}</style>
          </div>
        )
      };
      
    case 'Guerrier':
    default:
      return {
        fontTitle: "font-bebas text-amber-500 tracking-wider uppercase",
        fontData: "font-montserrat font-semibold",
        fontCitation: "font-serif",
        accentColor: "text-amber-500",

        accentBorder: "border-amber-500/80",
        innerBorder: "border-white/5",
        outerBorder: "border-[#ff0000] neon-blood-border",
        themeBgGradient: activeTheme.bgGradient || "from-red-950/60 to-black/90",

        nameSectionStyle: "border-2 border-amber-500/80 bg-black/85 backdrop-blur-[12px] shadow-[0_0_12px_rgba(212,175,55,0.2),inset_0_1px_2.5px_rgba(255,255,255,0.2),0_4px_10px_rgba(0,0,0,0.85)] rounded-xl",
        textBoxStyle: "border-2 border-amber-600/75 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.85),0_4px_6px_rgba(0,0,0,0.5)]",
        portraitBorderStyle: "border-2 border-[#ff0000]/60 shadow-[0_0_12px_rgba(255,0,0,0.35),inset_0_0_10px_rgba(138,3,3,0.5)]",
        classBadgeStyle: "border-2 border-[#8a0303]/80 bg-gradient-to-r from-[#171413] via-[#2a2420] to-[#171413]",
        specBoxStyle: "border-2 border-neutral-500/60",
        citationBoxStyle: "border border-[#8a0303]/30 bg-black/45",
        iconContainerStyle: "border-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.45),inset_0_1px_2px_rgba(255,255,255,0.15)]",
        dividerStyle: "via-amber-600/20",
        failleColor: "text-[#ff0000]",

        textBoxBgImage: `linear-gradient(to bottom, rgba(212, 175, 55, 0.45), rgba(101, 67, 33, 0.9)), url(${cardBackground})`,
        textBoxBgBlendMode: 'multiply',
        quoteIconStyle: "text-amber-400 drop-shadow-[0_0_6px_#f59e0b] animate-pulse",

        cornerStyle: 'rivet',
        showScratches: true,
        showBlood: true,
        showEmber: true,
        effectOverlay: null
      };
  }
};

// ─── Statuts de synchronisation Supabase ─────────────────────────────────────
type SyncStatus = 'idle' | 'loading' | 'saving' | 'error' | 'synced';

export default function LegendGenerator() {
  // ─── État des cartes ─────────────────────────────────────────────────────
  const [cards, setCards] = useState<WarriorCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // ─── État UI ──────────────────────────────────────────────────────────────
  const [isExporting, setIsExporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [exportBackground, setExportBackground] = useState<'transparent' | 'filled'>('filled');

  // ─── État synchronisation Supabase ────────────────────────────────────────
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');
  const [syncMessage, setSyncMessage] = useState<string>('');
  // liste des ids locaux modifiés (à sauvegarder manuellement)
  const [dirtyIds, setDirtyIds] = useState<number[]>([]);

  // ─── Anti-doublons : avertissement en temps réel ──────────────────────────
  // null = pas de doublon ; string = message d'avertissement
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // cache des URLs de portrait pour éviter de charger toutes les images au démarrage
  const [portraitCache, setPortraitCache] = useState<Record<number, string>>({});

  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeCard = cards[currentIndex] || cards[0];
  const [formData, setFormData] = useState<WarriorCard>(activeCard ? { ...activeCard } : { ...INITIAL_CARDS[0] });

  // ─── Chargement initial depuis Supabase uniquement ────────────────────────
  useEffect(() => {
    const initCards = async () => {
      setSyncStatus('loading');
      setSyncMessage('Chargement depuis Supabase...');
      try {
        const supabaseCards = await loadLegendCards();

        if (supabaseCards.length > 0) {
          // Renuméroter séquentiellement selon l'ordre reçu
          const renumbered = renumberCards(supabaseCards);
          // Extraire et mettre en cache les portraits pour chargement lazy
          const cache: Record<number, string> = {};
          const cardsWithoutPortraits = renumbered.map(c => {
            cache[c.id] = c.portraitUrl || '';
            return { ...c, portraitUrl: '' } as WarriorCard;
          });
          setPortraitCache(cache);
          setCards(cardsWithoutPortraits);
          setFormData({ ...cardsWithoutPortraits[0], portraitUrl: cache[cardsWithoutPortraits[0].id] || '' });
          setCurrentIndex(0);
          setSyncStatus('synced');
          setSyncMessage(`${renumbered.length} carte(s) chargée(s)`);
        } else {
          // Supabase est vide : collection vide, pas de sauvegarde automatique
          setCards([]);
          setSyncStatus('synced');
          setSyncMessage('Aucune carte — créez votre première légende !');
        }
      } catch (err) {
        console.warn('[LegendGenerator] Supabase inaccessible', err);
        setCards([]);
        setSyncStatus('error');
        setSyncMessage('Erreur de connexion à Supabase');
      }
    };

    initCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // ─── Sync formData quand currentIndex / cards change (lazy portrait load)
  useEffect(() => {
    if (activeCard) {
      const portrait = portraitCache[activeCard.id] ?? activeCard.portraitUrl ?? '';
      setFormData({ ...activeCard, portraitUrl: portrait });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, cards, portraitCache]);

  // ─── Renumérotation séquentielle des cartes ───────────────────────────────
  const renumberCards = (cardList: WarriorCard[]): WarriorCard[] => {
    return cardList.map((c, i) => ({
      ...c,
      id: i + 1,
      numero: String(i + 1).padStart(3, '0'),
    }));
  };

  // ─── Réinitialisation ─────────────────────────────────────────────────────
  const handleResetToDefault = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir réinitialiser l'application ? Toutes vos cartes seront supprimées de Supabase.")) {
      // Supprimer toutes les cartes Supabase
      const toDelete = cards.filter(c => c.supabaseId);
      if (toDelete.length > 0) {
        setSyncStatus('saving');
        setSyncMessage('Suppression en cours...');
        await Promise.all(toDelete.map(c => deleteLegendCard(c.supabaseId!)));
      }
      setCards([]);
      setCurrentIndex(0);
      setSyncStatus('synced');
      setSyncMessage('Collection réinitialisée');
    }
  };

  const filteredCards = cards.filter(card => {
    const matchesSearch = 
      card.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.surnom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.classe.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleSelectCard = (indexInFiltered: number) => {
    const cardSelected = filteredCards[indexInFiltered];
    if (cardSelected) {
      const realIndex = cards.findIndex(c => c.id === cardSelected.id);
      if (realIndex !== -1) setCurrentIndex(realIndex);
    }
  };

  // ─── Marquer une carte comme modifiée (sauvegarde manuelle via le bouton)
  const markDirty = useCallback((cardId: number) => {
    setDirtyIds(prev => Array.from(new Set([...prev, cardId])));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      const updatedCards = [...cards];
      const activeIdx = cards.findIndex(c => c.id === prev.id);
      if (activeIdx !== -1) {
        if (name === 'hp' || name === 'atk') {
          updated[name as 'hp' | 'atk'] = Math.min(100, Math.max(0, Number(value) || 0));
        }
        updatedCards[activeIdx] = updated;
        setCards(updatedCards);
        markDirty(updatedCards[activeIdx].id);
        // mettre à jour le cache de portrait si l'utilisateur a saisi une URL
        if (name === 'portraitUrl') {
          setPortraitCache(prev => ({ ...prev, [updatedCards[activeIdx].id]: updated.portraitUrl }));
        }
      }

      // ─── Vérification doublon en temps réel (sur le champ « nom ») ───────────
      if (name === 'nom') {
        const trimmedValue = value.trim();
        if (trimmedValue.length < 2) {
          setDuplicateWarning(null);
        } else {
          const normalizedNew = normalizeLegendName(trimmedValue);
          const duplicate = cards.find(
            c => c.id !== prev.id && normalizeLegendName(c.nom) === normalizedNew
          );
          if (duplicate) {
            setDuplicateWarning(
              `⚠️ Une carte "${duplicate.nom}" existe déjà dans la collection. Choisissez un nom unique.`
            );
          } else {
            setDuplicateWarning(null);
          }
        }
      }
      // ─────────────────────────────────────────────────────────────────────────

      return updated;
    });
  };

  const handleAddNewCard = async () => {
    if (cards.length >= 100) { alert("Limite maximale de 100 cartes atteinte !"); return; }
    const newPosition = cards.length + 1;
    const newCard: WarriorCard = {
      id: newPosition,
      numero: String(newPosition).padStart(3, '0'),
      nom: "NOUVELLE LÉGENDE",
      rarete: "L",
      surnom: "Le Héros de l'Ombre",
      portraitUrl: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?auto=format&fit=crop&w=500&q=80",
      classe: "Guerrier / Soldat",
      specialite1: "Assaut agile",
      specialite2: "Survie extrême",
      iconSpecialite1: "shield",
      iconSpecialite2: "sparkles",
      realisation: "A accompli des exploits extraordinaires consignés dans les manuscrits sacrés.",
      faille: "Est vulnérable face aux attaques magiques ou spirituelles.",
      citation: "Dans l'obscurité, je trouve ma véritable lumière.",
      theme: "void",
      hp: 70,
      atk: 75
    };
    // Ajouter localement sans sauvegarde automatique (utilisateur devra appuyer sur "Sauvegarder les cartes")
    const cardWithId = { ...newCard, supabaseId: undefined };
    const newCollection = [...cards, cardWithId];
    // Renuméroter toute la collection
    const renumbered = renumberCards(newCollection);
    setCards(renumbered);
    const newIdx = renumbered.length - 1;
    setCurrentIndex(newIdx);
    setFormData({ ...renumbered[newIdx] });
    setDirtyIds(prev => Array.from(new Set([...prev, renumbered[newIdx].id])));
    setSyncStatus('idle');
    setSyncMessage('Carte ajoutée localement (pensez à sauvegarder)');
  };

  const handleDuplicateCard = async () => {
    if (cards.length >= 100) { alert("Limite maximale de 100 cartes atteinte !"); return; }
    const newPosition = cards.length + 1;
    const duplicated: WarriorCard = {
      ...formData,
      id: newPosition,
      numero: String(newPosition).padStart(3, '0'),
      nom: `${formData.nom} (COPIE)`,
      supabaseId: undefined,   // la copie est une nouvelle entrée locale
    };
    // Ajouter localement sans sauvegarde automatique
    setSyncStatus('idle');
    setSyncMessage('Duplication locale réalisée');
    const cardWithId = { ...duplicated };
    const newCollection = [...cards, cardWithId];
    // Renuméroter toute la collection
    const renumbered = renumberCards(newCollection);
    setCards(renumbered);
    const newIdx = renumbered.length - 1;
    setCurrentIndex(newIdx);
    setFormData({ ...renumbered[newIdx] });
    setDirtyIds(prev => Array.from(new Set([...prev, renumbered[newIdx].id])));
  };

  const handleDeleteCard = async () => {
    if (cards.length <= 1) { alert("Vous devez conserver au moins une carte dans votre studio !"); return; }
    if (window.confirm(`Voulez-vous vraiment supprimer la carte de "${formData.nom}" ?`)) {
      const toDelete = formData;
      // Supprimer de Supabase en premier
      if (toDelete.supabaseId) {
        setSyncStatus('saving');
        setSyncMessage('Suppression...');
        const ok = await deleteLegendCard(toDelete.supabaseId);
        if (!ok) {
          setSyncStatus('error');
          setSyncMessage('Erreur de suppression Supabase');
          return;
        }
      }
      // Retirer localement et renuméroter
      const filtered = cards.filter(c => c.id !== toDelete.id);
      const renumbered = renumberCards(filtered);
      const newIdx = Math.max(0, currentIndex - 1);
      setCards(renumbered);
      setCurrentIndex(newIdx);
      setSyncStatus('synced');
      setSyncMessage('Carte supprimée');
    }
  };

  const applyJsonData = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      
      let citation = parsed.citation || "";
      if (citation.includes("Traduction française :")) {
         const parts = citation.split("Traduction française :");
         citation = parts[parts.length - 1].trim().replace(/^"|"$/g, "").trim();
      }

      setFormData(prev => {
        const updated = {
          ...prev,
          surnom: parsed.surnom || prev.surnom,
          nom: parsed.nom_personnage_fourni || prev.nom,
          classe: parsed.classe || prev.classe,
          specialite1: parsed.specialite1 || prev.specialite1,
          iconSpecialite1: parsed.iconSpecialite1?.iconName || parsed.iconSpecialite1 || prev.iconSpecialite1,
          specialite2: parsed.specialite2 || prev.specialite2,
          iconSpecialite2: parsed.iconSpecialite2?.iconName || parsed.iconSpecialite2 || prev.iconSpecialite2,
          realisation: parsed.realisation || prev.realisation,
          faille: parsed.faille || prev.faille,
          citation: citation || prev.citation
        };

        const updatedCards = [...cards];
        const activeIdx = cards.findIndex(c => c.id === prev.id);
        if (activeIdx !== -1) {
          updatedCards[activeIdx] = updated;
          setCards(updatedCards);
          markDirty(updatedCards[activeIdx].id);
        }
        return updated;
      });
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleImportJson = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) throw new Error("empty clipboard");
      
      if (!applyJsonData(text)) {
        throw new Error("invalid json");
      }
    } catch (err) {
      const manualInput = window.prompt("Collez votre JSON ici :");
      if (manualInput) {
        if (!applyJsonData(manualInput)) {
          alert("JSON invalide.");
        }
      }
    }
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) { alert('Veuillez sélectionner un fichier image valide.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        const base64Url = e.target.result;
        setFormData(prev => {
          const updated = { ...prev, portraitUrl: base64Url };
          const updatedCards = [...cards];
          const activeIdx = cards.findIndex(c => c.id === prev.id);
          if (activeIdx !== -1) {
            updatedCards[activeIdx] = updated;
            setCards(updatedCards);
            setPortraitCache(prev => ({ ...prev, [updatedCards[activeIdx].id]: base64Url }));
            markDirty(updatedCards[activeIdx].id);
          }
          return updated;
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false);
    if (e.dataTransfer.files?.[0]) handleImageFile(e.dataTransfer.files[0]);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
  };
  const handleSelectPreset = (url: string) => {
    setFormData(prev => {
      const updated = { ...prev, portraitUrl: url };
      const updatedCards = [...cards];
      const activeIdx = cards.findIndex(c => c.id === prev.id);
      if (activeIdx !== -1) {
        updatedCards[activeIdx] = updated;
        setCards(updatedCards);
        setPortraitCache(prev => ({ ...prev, [updatedCards[activeIdx].id]: url }));
        markDirty(updatedCards[activeIdx].id);
      }
      return updated;
    });
  };

  // ─── Sauvegarder toutes les cartes modifiées / non sauvegardées vers Supabase
  const handleSaveAll = async () => {
    if (cards.length === 0 || syncStatus === 'saving') return;

    // ── Vérification anti-doublon locale AVANT de contacter Supabase ──────────
    // Regrouper les noms normalisés des cartes à sauvegarder
    const dirtyCards = cards.filter(c => dirtyIds.includes(c.id));
    const normalizedDirtyNames = dirtyCards.map(c => normalizeLegendName(c.nom));

    // Chercher si deux cartes dirty ont le même nom
    const hasSelfDuplicate = normalizedDirtyNames.some(
      (n, i) => normalizedDirtyNames.indexOf(n) !== i
    );

    // Chercher si une carte dirty entre en conflit avec une carte déjà sauvegardée
    const savedCards = cards.filter(c => c.supabaseId && !dirtyIds.includes(c.id));
    const conflictsWithSaved = dirtyCards.some(dirty =>
      savedCards.some(
        saved => normalizeLegendName(saved.nom) === normalizeLegendName(dirty.nom)
      )
    );

    if (hasSelfDuplicate || conflictsWithSaved) {
      const duplicates = dirtyCards.filter((dirty, idx, arr) =>
        arr.findIndex(c => normalizeLegendName(c.nom) === normalizeLegendName(dirty.nom)) !== idx ||
        savedCards.some(saved => normalizeLegendName(saved.nom) === normalizeLegendName(dirty.nom))
      );
      const names = [...new Set(duplicates.map(d => `"${d.nom}"`))];
      setSyncStatus('error');
      setSyncMessage(
        `Doublon détecté : ${names.join(', ')}. Renommez la carte avant de sauvegarder.`
      );
      setDuplicateWarning(
        `⚠️ Impossible de sauvegarder : une carte portant ce nom existe déjà. Choisissez un nom unique.`
      );
      return;
    }
    // ─────────────────────────────────────────────────────────────────────────

    setSyncStatus('saving');
    setSyncMessage('Sauvegarde des cartes en cours...');
    try {
      const updatedCollection: WarriorCard[] = [];
      for (const c of cards) {
        if (dirtyIds.includes(c.id)) {
          if (c.supabaseId) {
            // Mettre à jour uniquement les cartes modifiées
            const ok = await updateLegendCard(c.supabaseId, c);
            if (!ok) console.warn('Échec mise à jour carte', c.id);
            updatedCollection.push(c);
          } else {
            // Nouvel enregistrement
            const supabaseId = await saveLegendCard(c);
            updatedCollection.push({ ...c, supabaseId: supabaseId ?? undefined });
          }
        } else {
          // Conserver intactes les cartes non modifiées sans faire d'appels API superflus
          updatedCollection.push(c);
        }
      }
      const renumbered = renumberCards(updatedCollection);
      setCards(renumbered);
      setDirtyIds([]);
      setDuplicateWarning(null);
      setSyncStatus('synced');
      setSyncMessage('Toutes les cartes ont été sauvegardées');
    } catch (err) {
      console.error('Erreur sauvegarde globale', err);
      // ── Cas spécial : DuplicateLegendError levée par le service ─────────────
      if (err instanceof DuplicateLegendError) {
        setSyncStatus('error');
        setSyncMessage(err.message);
        setDuplicateWarning(`⚠️ ${err.message}`);
      } else {
        setSyncStatus('error');
        setSyncMessage('Erreur pendant la sauvegarde');
      }
    }
  };

  const exportCard = async (format: 'png' | 'jpeg') => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const originalBg = cardRef.current.style.background;
      const originalShadow = cardRef.current.style.boxShadow;
      if (exportBackground === 'transparent') {
        cardRef.current.style.background = 'transparent';
        cardRef.current.style.boxShadow = 'none';
      }
      await new Promise(resolve => setTimeout(resolve, 150));
      const options = { pixelRatio: 3, cacheBust: true, style: { transform: 'scale(1)', transformOrigin: 'top left' } };
      let dataUrl = "";
      if (format === 'jpeg') {
        dataUrl = await toJpeg(cardRef.current, { ...options, quality: 0.95, backgroundColor: '#120e0a' });
      } else {
        dataUrl = await toPng(cardRef.current, { ...options, backgroundColor: 'transparent' });
      }
      if (exportBackground === 'transparent') {
        cardRef.current.style.background = originalBg;
        cardRef.current.style.boxShadow = originalShadow;
      }
      const link = document.createElement('a');
      const safeName = formData.nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-');
      link.download = `carte-${safeName}-${formData.numero}.${format === 'jpeg' ? 'jpg' : 'png'}`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Erreur d'exportation:", error);
      alert("Erreur de rendu. Utilisez une image locale (drag & drop) pour éviter les restrictions CORS.");
    } finally {
      setIsExporting(false);
    }
  };

  const themesConfig = {
    gold: {
      bgGradient: "from-[#542c1e] via-[#6d0000] to-[#61000e]",
      border: "border-[#871f00]/60",
      accentText: "text-[#ff0000] font-bold",
      badgeBg: "bg-[#76140c]/50 border-[#b53700]/50 text-amber-100",
      bannerGradient: "from-[#7a150e] via-[#b53700] to-[#7a150e]",
      innerBox: "from-[#542c1e] to-[#61000e]",
      glow: "shadow-[0_0_40px_rgba(135,31,0,0.25)]",
      glowingBorder: "border-[#b53700]/70 shadow-[0_0_15px_rgba(181,55,0,0.4)]",
    },
    fire: {
      bgGradient: "from-[#6f0000] via-[#7a150e] to-[#61000e]",
      border: "border-[#ff0000]/55",
      accentText: "text-red-400 font-bold",
      badgeBg: "bg-[#670000]/60 border-[#76140c]/60 text-red-100",
      bannerGradient: "from-[#6d0000] via-[#ff0000] to-[#6d0000]",
      innerBox: "from-[#61000e] to-[#542c1e]",
      glow: "shadow-[0_0_45px_rgba(255,0,0,0.3)]",
      glowingBorder: "border-[#ff0000]/80 shadow-[0_0_20px_rgba(255,0,0,0.5)]",
    },
    void: {
      bgGradient: "from-[#61000e] via-[#542c1e] to-[#6d0000]",
      border: "border-[#670000]/50",
      accentText: "text-[#b53700] font-bold",
      badgeBg: "bg-[#542c1e]/50 border-[#6f0000]/50 text-neutral-200",
      bannerGradient: "from-[#61000e] via-[#871f00] to-[#61000e]",
      innerBox: "from-[#542c1e] to-[#542c1e]",
      glow: "shadow-[0_0_40px_rgba(84,44,30,0.3)]",
      glowingBorder: "border-[#871f00]/60 shadow-[0_0_15px_rgba(135,31,0,0.35)]",
    },
    ice: {
      bgGradient: "from-[#542c1e] via-[#61000e] to-[#670000]",
      border: "border-[#871f00]/50",
      accentText: "text-[#ff0000] font-bold",
      badgeBg: "bg-[#670000]/50 border-[#76140c]/50 text-rose-200",
      bannerGradient: "from-[#6d0000] via-[#871f00] to-[#6d0000]",
      innerBox: "from-[#61000e] to-[#542c1e]",
      glow: "shadow-[0_0_40px_rgba(109,0,0,0.25)]",
      glowingBorder: "border-[#871f00]/60 shadow-[0_0_15px_rgba(135,31,0,0.35)]",
    },
    emerald: {
      bgGradient: "from-[#542c1e] via-[#670000] to-[#76140c]",
      border: "border-[#b53700]/50",
      accentText: "text-[#ff0000] font-bold",
      badgeBg: "bg-[#6f0000]/40 border-[#871f00]/40 text-neutral-100",
      bannerGradient: "from-[#670000] via-[#b53700] to-[#670000]",
      innerBox: "from-[#670000] to-[#542c1e]",
      glow: "shadow-[0_0_40px_rgba(181,55,0,0.25)]",
      glowingBorder: "border-[#b53700]/65 shadow-[0_0_18px_rgba(181,55,0,0.4)]",
    }
  };

  const activeTheme = themesConfig[formData.theme] || themesConfig.gold;
  const cardAmbiance = getCardAmbiance(formData.classe, activeTheme);

  const rarityLabels = {
    C: { label: "Commun", color: "text-neutral-400 border-neutral-600 bg-neutral-900/80" },
    R: { label: "Rare", color: "text-blue-400 border-blue-600 bg-blue-950/50" },
    E: { label: "Épique", color: "text-purple-400 border-purple-600 bg-purple-950/50" },
    L: { label: "Légendaire", color: "text-amber-500 border-amber-600 bg-amber-950/50" },
    G: { label: "Divin", color: "text-rose-500 border-rose-600 bg-rose-950/50 animate-pulse" }
  };

  const { mainClass } = parseClasse(formData.classe);

const backgroundMap = {
  Explorateur: explorateurBackground,
  Savant: savantBackground,
  Artiste: artisteBackground,
  Fictionnel: fictionnelBackground,
  Penseur: penseurBackground,
  Dirigeant: dirigeantBackground,
  Athlète: athleteBackground,
};

const background = backgroundMap[mainClass] ?? cardBackground;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1c0003] via-[#0f0001] to-[#060000] text-neutral-200 font-sans p-4 sm:p-6 lg:p-8 selection:bg-[#7a150e] selection:text-neutral-100">
      
      {/* HEADER */}
      <header className="max-w-7xl mx-auto mb-8 border-b border-[#76140c]/30 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-transparent">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-gradient-to-br from-amber-500 to-amber-700 rounded-lg text-neutral-950 shadow-md">
              <Swords className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-amber-500 tracking-wider uppercase">
              Studio des Légendes
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1.5 tracking-widest font-semibold uppercase">
            FORGE LÉGENDAIRE ET ÉDITION DE CARTES DE COMBAT
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
          <button onClick={handleSaveAll} disabled={dirtyIds.length === 0 || !!duplicateWarning || syncStatus === 'saving'}
            title={
              duplicateWarning ? 'Doublon détecté — renommez la carte avant de sauvegarder' :
              syncStatus === 'saving' ? 'Sauvegarde en cours...' :
              dirtyIds.length === 0 ? 'Aucune modification à sauvegarder' :
              `Sauvegarder ${dirtyIds.length} carte(s)`
            }
            className={`flex items-center gap-2 text-xs border border-neutral-800 px-4 py-2 rounded-md font-bold transition ${
              duplicateWarning
                ? 'bg-orange-950/40 text-orange-400 border-orange-700/50 cursor-not-allowed'
                : syncStatus === 'saving'
                  ? 'bg-neutral-800 text-neutral-400 cursor-wait'
                  : dirtyIds.length === 0
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-black'
            }`}>
            {duplicateWarning ? <AlertTriangle className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
            <span>Sauvegarder les cartes</span>
            {dirtyIds.length > 0 && !duplicateWarning && <span className="ml-1 inline-block bg-black/60 text-[11px] px-2 py-0.5 rounded-full font-mono">{dirtyIds.length}</span>}
          </button>
          {/* Indicateur de synchronisation Supabase */}
          <div className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-2 rounded-md border transition-all ${
            syncStatus === 'loading' ? 'bg-neutral-900 border-neutral-700 text-neutral-400' :
            syncStatus === 'saving'  ? 'bg-amber-950/30 border-amber-600/40 text-amber-400' :
            syncStatus === 'synced'  ? 'bg-emerald-950/30 border-emerald-600/40 text-emerald-400' :
            syncStatus === 'error'   ? 'bg-red-950/30 border-red-600/40 text-red-400' :
            'bg-neutral-900 border-neutral-700 text-neutral-500'
          }`}>
            {syncStatus === 'loading' && <Loader2 className="w-3 h-3 animate-spin" />}
            {syncStatus === 'saving'  && <Loader2 className="w-3 h-3 animate-spin" />}
            {syncStatus === 'synced'  && <CloudCheck className="w-3 h-3" />}
            {syncStatus === 'error'   && <CloudOff className="w-3 h-3" />}
            {syncStatus === 'idle'    && <CloudCheck className="w-3 h-3" />}
            <span className="hidden sm:inline">{syncMessage || 'Supabase'}</span>
          </div>
          <button onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-1.5 text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-4 py-2 rounded-md font-bold transition text-amber-500/90 cursor-pointer">
            <HelpCircle className="w-4 h-4" />
            {showGuide ? "Masquer l'aide" : "Guide d'export"}
          </button>
          <button onClick={handleResetToDefault}
            className="flex items-center gap-1.5 text-xs bg-neutral-900 hover:bg-red-950/40 hover:text-red-400 border border-neutral-800 hover:border-red-900/60 px-4 py-2 rounded-md font-bold transition cursor-pointer">
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </button>

        </div>
      </header>

      {showGuide && (
        <div className="max-w-7xl mx-auto mb-6 bg-gradient-to-r from-amber-950/20 via-neutral-900/80 to-amber-950/10 border border-amber-600/30 p-4 rounded-xl text-xs leading-relaxed text-neutral-300 shadow-md">
          <h3 className="font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Comment obtenir le meilleur export d'image ?
          </h3>
          <ul className="list-disc list-inside space-y-1 ml-1 text-neutral-300">
            <li><strong className="text-amber-300">Zéro problème de CORS :</strong> Les images provenant d'Internet peuvent bloquer le téléchargement.</li>
            <li><strong className="text-[#C08A5A]">Solution ultime :</strong> Glissez-déposez ou importez une image depuis votre appareil (stockage base64 local).</li>
            <li><strong className="text-amber-300">Rendu Ultra HD :</strong> Carte générée à <span className="font-bold">3X sa résolution d'affichage</span>.</li>
          </ul>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLONNE GAUCHE */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* RECHERCHE & LISTE */}
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5 flex flex-col gap-4 shadow-lg backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                <input type="text" placeholder="RECHERCHER PAR NOM, CLASSE, SURNOM..."
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-2.5 text-xs font-bold tracking-wider text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div className="relative">
              <span className="block text-[10px] font-black uppercase text-neutral-500 tracking-widest mb-2">
                SÉLECTIONNER PARMI LES LÉGENDES ({filteredCards.length})
              </span>
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-amber-600 scrollbar-track-neutral-950 max-h-[110px]">
                {filteredCards.length === 0 ? (
                  <div className="w-full text-center py-4 text-xs text-neutral-500 italic bg-neutral-950/40 rounded-xl border border-neutral-800/50">
                    Aucune légende ne correspond à vos critères.
                  </div>
                ) : (
                  filteredCards.map((c, i) => {
                    const isSelected = activeCard.id === c.id;
                    const rType = rarityLabels[c.rarete] || rarityLabels.C;
                    return (
                      <button key={c.id} type="button" onClick={() => handleSelectCard(i)}
                        className={`flex-none w-[170px] bg-neutral-950 p-2.5 rounded-xl border transition-all text-left relative flex gap-2 items-center cursor-pointer ${
                          isSelected ? 'border-amber-500 bg-amber-950/10 shadow-[0_0_12px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20' : 'border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/50'
                        }`}>
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-900 border border-neutral-800">
                          <img src={portraitCache[c.id] ?? c.portraitUrl} alt="" className="w-full h-full object-cover object-top" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 justify-between">
                            <span className="text-[10px] text-neutral-500 font-mono font-bold">#{c.numero}</span>
                          </div>
                          <h4 className="text-xs font-serif font-black text-neutral-200 uppercase truncate mt-0.5">{c.nom}</h4>
                          <p className="text-[9px] text-neutral-400 truncate italic">{c.surnom}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-1 flex gap-2 justify-end">
              <button type="button" onClick={handleAddNewCard}
                className="flex items-center gap-1.5 text-xs bg-amber-600 hover:bg-amber-500 text-black font-black uppercase tracking-tight px-5 py-2.5 rounded-md transition shadow-md active:scale-95 cursor-pointer">
                <Plus className="w-4 h-4 stroke-[3px]" />
                + Nouvelle Légende
              </button>
            </div>
          </div>

          {/* FORMULAIRE */}
          <div className="bg-neutral-900/40 p-6 rounded-2xl border border-neutral-800 shadow-xl backdrop-blur-sm relative">
            <div className="absolute top-4 right-4 flex gap-1.5">
              <button type="button" onClick={handleImportJson}
                className="p-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-emerald-500 rounded-lg transition cursor-pointer" title="Importer depuis JSON (Presse-papier)">
                <ClipboardPaste className="w-4 h-4" />
              </button>
              <button type="button" onClick={handleDuplicateCard}
                className="p-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-amber-500 rounded-lg transition cursor-pointer" title="Dupliquer">
                <Copy className="w-4 h-4" />
              </button>
              <button type="button" onClick={handleDeleteCard}
                className="p-2 bg-neutral-950 hover:bg-red-950/50 border border-neutral-800 text-neutral-500 hover:text-red-400 rounded-lg transition cursor-pointer" title="Supprimer">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-6 border-b border-neutral-800 pb-3">
              <Settings className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-serif font-bold text-neutral-200 uppercase tracking-widest">
                Caractéristiques de <span className="text-amber-500">{formData.nom || "Nouvelle Légende"}</span>
              </h2>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              
              {/* NOM, RARETÉ, INDEX */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-black uppercase text-neutral-500 tracking-widest block mb-1.5">Nom de la Légende</label>
                  <input type="text" name="nom" value={formData.nom} onChange={handleInputChange}
                    className={`w-full bg-neutral-950 border rounded-lg px-3.5 py-2.5 text-xs uppercase font-serif tracking-wider font-bold focus:outline-none transition-colors ${
                      duplicateWarning
                        ? 'border-orange-500 focus:border-orange-400 text-orange-300'
                        : 'border-neutral-800 focus:border-amber-500 text-neutral-200'
                    }`} required />
                  {/* Avertissement doublon */}
                  {duplicateWarning && (
                    <div className="mt-1.5 flex items-start gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-orange-400 font-semibold leading-tight">{duplicateWarning}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-neutral-500 tracking-widest block mb-1.5">N° Index</label>
                  <input type="text" name="numero" value={formData.numero} onChange={handleInputChange}
                    placeholder="001" maxLength={3}
                    className="w-full text-center bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2.5 text-xs font-mono font-bold text-neutral-200 focus:border-amber-500 focus:outline-none transition-colors" required />
                </div>
              </div>

              {/* SURNOM & THÈME */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-black uppercase text-neutral-500 tracking-widest block mb-1.5">Surnom ou Épithète</label>
                  <input type="text" name="surnom" value={formData.surnom} onChange={handleInputChange}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs italic text-neutral-200 focus:border-amber-500 focus:outline-none transition-colors" required />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-neutral-500 tracking-widest block mb-1.5">Thème Visuel</label>
                  <select name="theme" value={formData.theme} onChange={handleInputChange}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2.5 text-xs font-bold text-amber-500 focus:border-amber-500 focus:outline-none transition-colors cursor-pointer">
                    <option value="gold">Or Antique</option>
                    <option value="fire">Feu d'Héphaïstos</option>
                    <option value="void">Obsidienne Abyssale</option>
                    <option value="ice">Glace Arctique</option>
                    <option value="emerald">Émeraude Mystique</option>
                  </select>
                </div>
              </div>

              {/* PORTRAIT */}
              <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800/85 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                    Portrait de la Légende
                  </span>
                  <span className="text-[9px] text-neutral-500 font-medium uppercase tracking-wider">Format : Portrait (4:5 ou 1:1)</span>
                </div>
                <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded-lg p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${isDragOver ? 'border-amber-500 bg-amber-500/10' : 'border-neutral-850 hover:border-neutral-750 bg-neutral-900/30 hover:bg-neutral-900/50'}`}>
                  <Upload className="w-6 h-6 text-neutral-500" />
                  <div className="text-xs"><span className="text-amber-500 font-bold">Cliquez pour importer</span> ou glissez une image locale</div>
                  <p className="text-[9px] text-neutral-500 uppercase tracking-wider">Recommandé pour éviter les restrictions CORS</p>
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-neutral-500 tracking-widest block mb-1">Ou collez un lien URL :</label>
                  <input type="url" name="portraitUrl" value={formData.portraitUrl} onChange={handleInputChange}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-blue-400 font-mono focus:border-amber-500 focus:outline-none transition-colors" />
                </div>
                <div className="pt-2">
                  <span className="text-[9px] font-black uppercase text-neutral-500 tracking-widest block mb-2">Bibliothèque de portraits thématiques :</span>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {PORTRAIT_PRESETS.map((p, idx) => (
                      <button key={idx} type="button" onClick={() => handleSelectPreset(p.url)} title={`Portrait: ${p.name}`}
                        className="group relative aspect-square rounded-lg overflow-hidden border border-neutral-800 hover:border-amber-500 transition-all focus:outline-none bg-neutral-900 cursor-pointer">
                        <img src={p.url} alt="" className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/45 group-hover:bg-transparent transition-all flex items-end justify-center">
                          <span className="text-[8px] font-bold text-neutral-300 group-hover:text-white truncate p-0.5 bg-black/60 w-full text-center uppercase tracking-tighter">{p.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CLASSE & STATS */}
              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-2.5">
                  <div>
                    <label className="text-[10px] font-black uppercase text-neutral-500 tracking-widest block mb-1">Classe (Archétype)</label>
                    <div className="relative">
                      <select value={parseClasse(formData.classe).mainClass}
                        onChange={(e) => {
                          const newMainClass = e.target.value as ArchetypeType;
                          const defaultSubType = CLASSES_CONFIG[newMainClass].subTypes[0];
                          setFormData(prev => ({ ...prev, classe: `${newMainClass} / ${defaultSubType}` }));
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-3 pr-8 py-2 text-xs text-neutral-200 focus:border-amber-500 focus:outline-none transition-colors appearance-none cursor-pointer font-bold">
                        {Object.keys(CLASSES_CONFIG).map((k) => {
                          const key = k as ArchetypeType;
                          return <option key={key} value={key}>{CLASSES_CONFIG[key].emoji} {CLASSES_CONFIG[key].label}</option>;
                        })}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-neutral-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-neutral-500 tracking-widest block mb-1">Sous-type ({parseClasse(formData.classe).mainClass})</label>
                    <div className="relative">
                      <select
                        value={(() => {
                          const { mainClass, subType } = parseClasse(formData.classe);
                          return CLASSES_CONFIG[mainClass].subTypes.includes(subType) ? subType : "custom";
                        })()}
                        onChange={(e) => {
                          const val = e.target.value;
                          const { mainClass } = parseClasse(formData.classe);
                          setFormData(prev => ({ ...prev, classe: `${mainClass} / ${val === "custom" ? "Personnalisé" : val}` }));
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-3 pr-8 py-2 text-xs text-neutral-200 focus:border-amber-500 focus:outline-none transition-colors appearance-none cursor-pointer font-medium">
                        {CLASSES_CONFIG[parseClasse(formData.classe).mainClass].subTypes.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                        <option value="custom">✍️ Nouveau / Personnalisé...</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-neutral-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                  {(() => {
                    const { mainClass, subType } = parseClasse(formData.classe);
                    const isCustom = !CLASSES_CONFIG[mainClass].subTypes.includes(subType);
                    if (isCustom) return (
                      <div className="flex items-center gap-1.5 bg-amber-500/5 border border-amber-500/20 rounded-lg p-1.5">
                        <span className="text-[8.5px] text-amber-500 uppercase font-black tracking-wider whitespace-nowrap">{mainClass} /</span>
                        <input type="text" placeholder="Ex: Demi-dieu" maxLength={25}
                          value={subType === 'Personnalisé' ? '' : subType}
                          onChange={(e) => setFormData(prev => ({ ...prev, classe: `${mainClass} / ${e.target.value || 'Personnalisé'}` }))}
                          className="flex-1 bg-neutral-950 border border-neutral-850 rounded px-2 py-0.5 text-[11px] text-neutral-100 focus:border-amber-500 focus:outline-none" />
                      </div>
                    );
                    return null;
                  })()}
                </div>


              </div>

              {/* SPÉCIALITÉS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Spécialité 1 */}
                <div>
                  <label className="text-[10px] font-black uppercase text-neutral-500 tracking-widest block mb-1.5">Spécialité Primaire</label>
                  <div className="flex gap-2">
                    <input type="text" name="specialite1" value={formData.specialite1} onChange={handleInputChange}
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:border-amber-500 focus:outline-none transition-colors" required />
                    <div className="relative flex-shrink-0 w-28">
                      <select name="iconSpecialite1"
                        value={AVAILABLE_SPECIALTY_ICONS.some(item => item.id === formData.iconSpecialite1 && item.id !== 'custom') ? (formData.iconSpecialite1 || 'shield') : 'custom'}
                        onChange={(e) => { const val = e.target.value; setFormData(prev => ({ ...prev, iconSpecialite1: val === 'custom' ? '⭐' : val })); }}
                        className="w-full h-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-2 py-2 text-xs text-neutral-300 focus:border-amber-500 focus:outline-none transition-colors appearance-none cursor-pointer font-medium">
                        {AVAILABLE_SPECIALTY_ICONS.map(item => (
                          <option key={item.id} value={item.id} className="bg-neutral-950 text-neutral-300">{item.label}</option>
                        ))}
                      </select>
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-amber-500">
                        {renderSpecialtyIcon(formData.iconSpecialite1, 'shield', 'w-4 h-4')}
                      </div>
                    </div>
                  </div>
                  {!AVAILABLE_SPECIALTY_ICONS.some(item => item.id === formData.iconSpecialite1 && item.id !== 'custom') && (
                    <div className="mt-1.5 flex flex-col gap-1.5 bg-amber-950/20 border border-amber-600/30 rounded-lg p-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-neutral-400 uppercase font-black tracking-wider whitespace-nowrap">Emoji/Texte :</span>
                        <input type="text" placeholder="Ex: 🐉" maxLength={6}
                          value={(!formData.iconSpecialite1?.startsWith('data:') && formData.iconSpecialite1 !== 'custom') ? formData.iconSpecialite1 : ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, iconSpecialite1: e.target.value || 'custom' }))}
                          className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2 py-0.5 text-xs text-neutral-100 focus:border-amber-500 focus:outline-none" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-neutral-400 uppercase font-black tracking-wider whitespace-nowrap">Téléverser :</span>
                        <label className="flex-1 flex items-center justify-center gap-1.5 border border-neutral-800 hover:border-amber-500 rounded px-2 py-1 text-[10px] text-neutral-300 hover:text-white cursor-pointer transition-colors">
                          <Upload className="w-3 h-3 text-amber-500" />
                          <span className="truncate">{formData.iconSpecialite1?.startsWith('data:') ? 'Icône chargée ✓' : 'Choisir image...'}</span>
                          <input type="file" accept="image/*" className="hidden"
                            onChange={(e) => { const file = e.target.files?.[0]; if (file) { const r = new FileReader(); r.onload = (ev) => { if (ev.target?.result) setFormData(prev => ({ ...prev, iconSpecialite1: ev.target!.result as string })); }; r.readAsDataURL(file); } }} />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
                {/* Spécialité 2 */}
                <div>
                  <label className="text-[10px] font-black uppercase text-neutral-500 tracking-widest block mb-1.5">Spécialité Secondaire</label>
                  <div className="flex gap-2">
                    <input type="text" name="specialite2" value={formData.specialite2} onChange={handleInputChange}
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:border-amber-500 focus:outline-none transition-colors" required />
                    <div className="relative flex-shrink-0 w-28">
                      <select name="iconSpecialite2"
                        value={AVAILABLE_SPECIALTY_ICONS.some(item => item.id === formData.iconSpecialite2 && item.id !== 'custom') ? (formData.iconSpecialite2 || 'sparkles') : 'custom'}
                        onChange={(e) => { const val = e.target.value; setFormData(prev => ({ ...prev, iconSpecialite2: val === 'custom' ? '🔥' : val })); }}
                        className="w-full h-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-2 py-2 text-xs text-neutral-300 focus:border-amber-500 focus:outline-none transition-colors appearance-none cursor-pointer font-medium">
                        {AVAILABLE_SPECIALTY_ICONS.map(item => (
                          <option key={item.id} value={item.id} className="bg-neutral-950 text-neutral-300">{item.label}</option>
                        ))}
                      </select>
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-rose-400">
                        {renderSpecialtyIcon(formData.iconSpecialite2, 'sparkles', 'w-4 h-4')}
                      </div>
                    </div>
                  </div>
                  {!AVAILABLE_SPECIALTY_ICONS.some(item => item.id === formData.iconSpecialite2 && item.id !== 'custom') && (
                    <div className="mt-1.5 flex flex-col gap-1.5 bg-rose-950/20 border border-rose-600/30 rounded-lg p-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-neutral-400 uppercase font-black tracking-wider whitespace-nowrap">Emoji/Texte :</span>
                        <input type="text" placeholder="Ex: 💀" maxLength={6}
                          value={(!formData.iconSpecialite2?.startsWith('data:') && formData.iconSpecialite2 !== 'custom') ? formData.iconSpecialite2 : ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, iconSpecialite2: e.target.value || 'custom' }))}
                          className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2 py-0.5 text-xs text-neutral-100 focus:border-amber-500 focus:outline-none" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-neutral-400 uppercase font-black tracking-wider whitespace-nowrap">Téléverser :</span>
                        <label className="flex-1 flex items-center justify-center gap-1.5 border border-neutral-800 hover:border-amber-500 rounded px-2 py-1 text-[10px] text-neutral-300 hover:text-white cursor-pointer transition-colors">
                          <Upload className="w-3 h-3 text-rose-400" />
                          <span className="truncate">{formData.iconSpecialite2?.startsWith('data:') ? 'Icône chargée ✓' : 'Choisir image...'}</span>
                          <input type="file" accept="image/*" className="hidden"
                            onChange={(e) => { const file = e.target.files?.[0]; if (file) { const r = new FileReader(); r.onload = (ev) => { if (ev.target?.result) setFormData(prev => ({ ...prev, iconSpecialite2: ev.target!.result as string })); }; r.readAsDataURL(file); } }} />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RÉALISATION */}
              <div>
                <label className="text-[10px] font-black uppercase text-neutral-500 tracking-widest block mb-1.5">Réalisation Majeure / Fait d'Armes</label>
                <textarea name="realisation" value={formData.realisation} onChange={handleInputChange} rows={2}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-neutral-200 focus:border-amber-500 focus:outline-none resize-none transition-colors h-16 leading-relaxed"
                  maxLength={150} required />
              </div>

              {/* FAILLE */}
              <div>
                <label className="text-[10px] font-black uppercase text-red-500/90 tracking-widest block mb-1.5">Faille Critique ou Vulnérabilité</label>
                <textarea name="faille" value={formData.faille} onChange={handleInputChange} rows={2}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-neutral-200 focus:border-amber-500 focus:outline-none resize-none transition-colors h-16 leading-relaxed"
                  maxLength={150} required />
              </div>

              {/* CITATION */}
              <div>
                <label className="text-[10px] font-black uppercase text-amber-500/80 tracking-widest block mb-1.5 flex justify-between">
                  <span>« Citation de combat du Héros »</span>
                  <span className="text-[9px] text-neutral-500 italic lowercase font-normal">Saisie multiligne</span>
                </label>
                <textarea name="citation" value={formData.citation} onChange={handleInputChange} rows={3} maxLength={180}
                  placeholder="Saisissez une citation marquante de votre guerrier..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs italic text-neutral-200 focus:border-amber-500 focus:outline-none transition-colors scrollbar-thin leading-relaxed"
                  required />
              </div>

              <div className="pt-2">
                <div className={`p-3.5 rounded-lg border text-[10px] italic font-medium uppercase tracking-wider text-center flex items-center justify-center gap-2 transition-all ${
                  syncStatus === 'loading' ? 'bg-neutral-900/60 border-neutral-700/40 text-neutral-500' :
                  syncStatus === 'saving'  ? 'bg-amber-950/20 border-amber-600/25 text-amber-400' :
                  syncStatus === 'synced'  ? 'bg-emerald-950/20 border-emerald-600/25 text-emerald-400' :
                  syncStatus === 'error'   ? 'bg-red-950/20 border-red-600/25 text-red-400' :
                  'bg-amber-500/5 border-amber-600/20 text-amber-500/80'
                }`}>
                  {syncStatus === 'loading' && <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />}
                  {syncStatus === 'saving'  && <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />}
                  {syncStatus === 'synced'  && <CloudCheck className="w-3 h-3 flex-shrink-0" />}
                  {syncStatus === 'error'   && <CloudOff className="w-3 h-3 flex-shrink-0" />}
                  {!syncStatus              && <span>💡</span>}
                  <span>
                    {syncStatus === 'loading' && 'Chargement depuis Supabase...'}
                    {syncStatus === 'saving'  && (syncMessage || 'Synchronisation...')}
                    {syncStatus === 'synced'  && (syncMessage || 'Sauvegardé dans Supabase')}
                    {syncStatus === 'error'   && (syncMessage || 'Mode hors-ligne (localStorage)')}
                    {syncStatus === 'idle'    && 'Synchronisation Supabase active'}
                  </span>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* COLONNE DROITE — APERÇU CARTE */}
        <div className="lg:col-span-5 flex flex-col items-center sticky top-6">
          
          {/* EXPORT */}
          <div className="bg-neutral-900/40 p-5 rounded-2xl border border-neutral-800 shadow-lg backdrop-blur-sm w-full max-w-[430px] mb-6 space-y-4">
            <div className="flex justify-end">
              <button onClick={handleSaveAll} disabled={dirtyIds.length === 0 || !!duplicateWarning || syncStatus === 'saving'}
                title={
                  duplicateWarning ? 'Doublon détecté — renommez la carte avant de sauvegarder' :
                  syncStatus === 'saving' ? 'Sauvegarde en cours...' :
                  dirtyIds.length === 0 ? 'Aucune modification à sauvegarder' :
                  `Sauvegarder ${dirtyIds.length} carte(s)`
                }
                className={`flex items-center gap-2 text-xs border border-neutral-800 px-3 py-2 rounded-md font-bold transition ${
                  duplicateWarning
                    ? 'bg-orange-950/40 text-orange-400 border-orange-700/50 cursor-not-allowed'
                    : syncStatus === 'saving'
                      ? 'bg-neutral-800 text-neutral-400 cursor-wait'
                      : dirtyIds.length === 0
                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-black'
                }`}>
                {duplicateWarning ? <AlertTriangle className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                <span>Sauvegarder les cartes</span>
                {dirtyIds.length > 0 && !duplicateWarning && <span className="ml-1 inline-block bg-black/60 text-[11px] px-2 py-0.5 rounded-full font-mono">{dirtyIds.length}</span>}
              </button>
            </div>
            <span className="block text-[10px] font-black uppercase text-neutral-500 tracking-widest mb-1">Options d'exportation d'image</span>
            <div className="grid grid-cols-2 gap-2 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
              <button type="button" onClick={() => setExportBackground('filled')}
                className={`py-1.5 px-3 rounded-md text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${exportBackground === 'filled' ? 'bg-amber-600 text-black shadow' : 'text-neutral-500 hover:text-neutral-200'}`}>
                <Eye className="w-3.5 h-3.5" /> FOND SOMBRE
              </button>
              <button type="button" onClick={() => setExportBackground('transparent')}
                className={`py-1.5 px-3 rounded-md text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${exportBackground === 'transparent' ? 'bg-amber-600 text-black shadow' : 'text-neutral-500 hover:text-neutral-200'}`}>
                <FileImage className="w-3.5 h-3.5" /> SANS FOND (PNG)
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => exportCard('png')} disabled={isExporting}
                className="py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500 rounded-lg text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 cursor-pointer text-neutral-200">
                <Download className="w-3.5 h-3.5 text-amber-500" />
                {isExporting ? "RENDU..." : "TÉLÉCHARGER PNG"}
              </button>
              <button onClick={() => exportCard('jpeg')} disabled={isExporting}
                className="py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500 rounded-lg text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 cursor-pointer text-neutral-200">
                <Download className="w-3.5 h-3.5 text-amber-500" />
                {isExporting ? "RENDU..." : "TÉLÉCHARGER JPEG"}
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              RENDU DE LA CARTE — Cible de capture via cardRef
          ═══════════════════════════════════════════════════════════════ */}
          <div className="relative">
            <div ref={cardRef} id="warrior-card-container"
              className={`relative w-[360px] sm:w-[430px] h-[580px] sm:h-[670px] bg-[#0c0a09] rounded-[24px] p-[10px] sm:p-[12px] transition-all duration-300 overflow-hidden flex flex-col justify-between border-[5px] sm:border-[6px] ${cardAmbiance.outerBorder}`}>
              
              {/* FOND GOTHIQUE */}
              <div className="absolute inset-0 z-0 select-none pointer-events-none">
                <img
                  src={background}
                  alt="Epic Background"
                  className="w-full h-full object-cover brightness-[0.7] contrast-[1.1] saturate-[0.85] transition-all duration-300"
                />
                <div className={`absolute inset-0 bg-gradient-to-b ${cardAmbiance.themeBgGradient} mix-blend-color opacity-85 transition-all duration-300`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/70" />
                <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
              </div>

              {/* Texture brossée */}
              <div className="absolute inset-0 brushed-metal pointer-events-none opacity-20 z-10" />

              {/* Explosion glow (Guerrier seulement) */}
              {cardAmbiance.showEmber && <div className="explosion-glow" />}

              {/* Overlays de classe */}
              {cardAmbiance.effectOverlay}

              {/* Rivets */}
              {cardAmbiance.cornerStyle === 'rivet' && (
                <>
                  <div className="armor-rivet top-3.5 left-3.5" />
                  <div className="armor-rivet top-3.5 right-3.5" />
                  <div className="armor-rivet bottom-3.5 left-3.5" />
                  <div className="armor-rivet bottom-3.5 right-3.5" />
                </>
              )}

              {/* Balafres (Guerrier seulement) */}
              {cardAmbiance.showScratches && (
                <>
                  <div className="metal-scratch top-[18%] left-[15%] w-[45%] rotate-[20deg] opacity-35" />
                  <div className="metal-scratch top-[10%] left-[55%] w-[25%] rotate-[6deg] opacity-30" />
                  <div className="metal-scratch top-[58%] left-[70%] w-[25%] rotate-[-30deg] opacity-30" />
                  <div className="metal-scratch top-[52%] left-[18%] w-[50%] rotate-[-8deg] opacity-40" />
                  <div className="metal-scratch top-[75%] left-[20%] w-[55%] rotate-[10deg] opacity-35" />
                </>
              )}

              {/* Sparkles de feu (Guerrier seulement) */}
              {cardAmbiance.showEmber && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[24px] z-25">
                  {[...Array(10)].map((_, i) => {
                    const size = Math.random() * 2.5 + 1.5;
                    const left = Math.random() * 100;
                    const duration = Math.random() * 2 + 3;
                    const delay = Math.random() * -5;
                    const drift = Math.random() * 24 - 12;
                    return (
                      <div key={i} className="fire-sparkle"
                        style={{ width: `${size}px`, height: `${size}px`, left: `${left}%`, bottom: `-10px`,
                          '--duration': `${duration}s`, '--drift': `${drift}px`, animationDelay: `${delay}s`,
                          filter: 'blur(0.4px) drop-shadow(0 0 2px #f97316)', opacity: 0.65
                        } as React.CSSProperties} />
                    );
                  })}
                </div>
              )}

              {/* ── Coulures de sang (Guerrier seulement) ─────────────────── */}
              {cardAmbiance.showBlood && (
                <>
                  <div className="absolute top-[285px] left-[24px] w-[3px] h-14 bg-gradient-to-b from-[#ff0000] to-transparent opacity-85 z-[1] pointer-events-none rounded-full" />
                  <div className="absolute top-[295px] left-[24px] w-[5px] h-[5px] bg-[#ff0000] rounded-full z-[1] pointer-events-none shadow-[0_0_8px_#ff0000]" />
                  <div className="absolute top-[280px] right-[32px] w-[2px] h-10 bg-gradient-to-b from-[#6f0000] to-transparent opacity-75 z-[1] pointer-events-none rounded-full" />
                  <div className="absolute bottom-[20px] left-[20px] w-16 h-16 pointer-events-none z-[1] opacity-60 text-[#6f0000]">
                    <svg viewBox="0 0 100 100" fill="currentColor">
                      <path d="M40,50 C45,42 55,45 60,38 C65,31 58,22 68,18 C78,14 82,25 80,35 C78,45 88,48 84,58 C80,68 70,62 62,72 C54,82 42,78 35,70 C28,62 32,58 40,50 Z" />
                      <circle cx="20" cy="40" r="2" />
                      <circle cx="50" cy="85" r="1.5" />
                    </svg>
                  </div>
                </>
              )}

              {/* ── Bordure intérieure métallique ─────────────────────────── */}
              <div className={`absolute inset-[4px] sm:inset-[5px] border-[2px] rounded-[20px] pointer-events-none transition-colors duration-300 z-20 ${cardAmbiance.accentBorder}`} />
              <div className="absolute inset-[8px] sm:inset-[10px] border border-white/5 rounded-[16px] pointer-events-none z-20" />

              {/* Ornements d'angle */}
              <div className={`absolute top-[10px] left-[10px] sm:top-[12px] sm:left-[12px] w-4 h-4 border-t border-l z-20 opacity-80 ${cardAmbiance.accentBorder.split(' ')[0]}`} />
              <div className={`absolute top-[10px] right-[10px] sm:top-[12px] sm:right-[12px] w-4 h-4 border-t border-r z-20 opacity-80 ${cardAmbiance.accentBorder.split(' ')[0]}`} />
              <div className={`absolute bottom-[10px] left-[10px] sm:bottom-[12px] sm:left-[12px] w-4 h-4 border-b border-l z-20 opacity-80 ${cardAmbiance.accentBorder.split(' ')[0]}`} />
              <div className={`absolute bottom-[10px] right-[10px] sm:bottom-[12px] sm:right-[12px] w-4 h-4 border-b border-r z-20 opacity-80 ${cardAmbiance.accentBorder.split(' ')[0]}`} />

              {/* ══════════════════════ CONTENU CARTE ══════════════════════ */}
              <div className="w-full h-full flex flex-col justify-between relative z-10">
                
                {/* ── EN-TÊTE NOM ──────────────────────────────────────────── */}
                <div className={`p-1.5 sm:p-2 pb-1.5 flex flex-col relative bg-black/85 backdrop-blur-[12px] mx-2 mt-2 overflow-hidden ${cardAmbiance.nameSectionStyle}`}>
                  
                  {/* Ornements d'angle internes */}
                  <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 border-t border-l border-white/10 pointer-events-none" />
                  <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 border-t border-r border-white/10 pointer-events-none" />
                  <div className="absolute bottom-0.5 left-0.5 w-1.5 h-1.5 border-b border-l border-white/10 pointer-events-none" />
                  <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 border-b border-r border-white/10 pointer-events-none" />

                  {/* Tache de sang (Guerrier) */}
                  {cardAmbiance.showBlood && (
                    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-25 select-none">
                      <div className="absolute -bottom-2 -left-2 w-14 h-14 text-[#8a0303]/30">
                        <svg viewBox="0 0 100 100" fill="currentColor">
                          <path d="M30,50 C40,40 60,45 50,70 C40,80 20,70 30,50 Z" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Tache de sang derrière icône (Guerrier) */}
                  {cardAmbiance.showBlood && (
                    <div className="absolute top-[-5px] right-[-5px] w-16 h-16 pointer-events-none z-0 opacity-30 text-[#8a0303]">
                      <svg viewBox="0 0 100 100" fill="currentColor">
                        <path d="M50,30 C55,20 62,15 70,25 C75,32 68,40 75,48 C80,55 90,52 88,65 C85,75 75,70 65,82 C55,90 45,95 35,88 C25,80 32,70 25,62 C18,55 8,58 10,48 C12,38 25,45 32,35 C38,25 45,40 50,30 Z" />
                      </svg>
                    </div>
                  )}

                  <div className="flex justify-between items-center gap-2 relative z-10 w-full">
                    <div className="min-w-0 flex-1 pl-1">
                      <h2 className={`text-lg sm:text-xl font-black tracking-wider text-neutral-100 uppercase truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${cardAmbiance.fontTitle}`}>
                        {formData.nom || "SANS NOM"}
                      </h2>
                      <p className={`text-[8.5px] sm:text-[9.5px] font-bold italic tracking-wider mt-0.5 truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${cardAmbiance.accentColor} ${cardAmbiance.fontCitation}`}>
                        {formData.surnom || "Le Héros Mystique"}
                      </p>
                    </div>
                    
                    {/* Icône de classe + Index */}
                    <div className="flex flex-col items-end gap-0.5 flex-shrink-0 relative z-10 pr-0.5">
                      <div className={`bg-gradient-to-b from-[#1a1512] via-[#2d221a] to-[#120e0b] border-[2px] p-1 sm:p-1.5 rounded-full flex items-center justify-center hover:scale-110 transition-transform relative before:absolute before:inset-[1px] before:border before:border-white/5 before:rounded-full ${cardAmbiance.iconContainerStyle}`}
                        title={`Classe: ${formData.classe}`}>
                        {getClassIcon(formData.classe, "w-4.5 h-4.5 sm:w-5.5 h-5.5 relative z-10")}
                      </div>
                      <span className="text-[6.5px] sm:text-[7.5px] text-neutral-400 font-mono tracking-widest bg-black/85 px-1 py-0.5 rounded border border-white/5 mt-0.5">
                        N° {formData.numero}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── PORTRAIT ─────────────────────────────────────────────── */}
                <div className={`mx-2 relative flex-1 min-h-[220px] sm:min-h-[270px] rounded-xl overflow-hidden mt-1.5 bg-[#120101] ${cardAmbiance.portraitBorderStyle}`}>
                  
                  {/* Overlays sang portrait (Guerrier) */}
                  {cardAmbiance.showBlood && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#7a0303]/40 via-transparent to-[#7a0303]/20 mix-blend-overlay z-10 pointer-events-none" />
                      <div className="absolute inset-0 bg-[#ff0000]/10 mix-blend-color z-10 pointer-events-none" />
                      <div className="absolute top-0 left-[25%] w-[1.5px] h-8 bg-gradient-to-b from-[#8a0303]/80 to-transparent z-10 pointer-events-none" />
                      <div className="absolute top-0 left-[25%] w-1 h-1 bg-[#8a0303] rounded-full z-10 pointer-events-none shadow-[0_0_4px_rgba(255,0,0,0.8)]" />
                      <div className="absolute top-0 right-[30%] w-[1px] h-5 bg-gradient-to-b from-[#8a0303]/70 to-transparent z-10 pointer-events-none" />
                      <div className="absolute top-0 right-[30%] w-2.5 h-2.5 bg-[#8a0303]/90 rounded-full z-10 pointer-events-none" />
                      <div className="absolute top-2 left-3 text-[#ff0000]/35 z-10 pointer-events-none">
                        <svg className="w-10 h-10" viewBox="0 0 100 100" fill="currentColor">
                          <path d="M10,10 C25,25 35,20 28,45 C22,55 18,35 8,60 C4,70 14,75 20,65 C26,55 32,80 42,70 C52,60 40,40 37,30 C34,20 27,10 10,10 Z" />
                        </svg>
                      </div>
                      <div className="absolute bottom-0 right-0 text-[#8a0303]/45 z-10 pointer-events-none">
                        <svg className="w-14 h-7" viewBox="0 0 100 50" fill="currentColor">
                          <path d="M5,45 C15,35 30,48 45,35 C60,22 55,5 75,10 C95,15 85,38 95,45 C80,48 65,42 50,48 C35,48 20,40 5,45 Z" />
                        </svg>
                      </div>
                    </>
                  )}

                  {formData.portraitUrl ? (
                    <img src={getCORSUrl(formData.portraitUrl)} alt={formData.nom}
                      className="w-full h-full object-cover object-top transition-all duration-500 hover:scale-105"
                      crossOrigin="anonymous" />
                  ) : (
                    <div className="w-full h-full bg-[#120101] flex flex-col items-center justify-center gap-2 text-neutral-500">
                      <ImageIcon className={`w-10 h-10 stroke-1 ${cardAmbiance.accentColor}`} />
                      <span className="text-xs text-neutral-400">Aucun portrait sélectionné</span>
                    </div>
                  )}
                </div>

                {/* ── BADGE CLASSE ─────────────────────────────────────────── */}
                <div className="px-4 text-center mt-2.5 mb-1">
                  <span className={`inline-block text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-black px-4 py-1 rounded-lg ${cardAmbiance.classBadgeStyle} text-[#f5f5f4] backdrop-blur-md relative overflow-hidden shadow-md ${cardAmbiance.fontData}`}>
                    {/* Texture acier brossé (Guerrier seulement) */}
                    {cardAmbiance.cornerStyle === 'rivet' && (
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.05)_75%,transparent_75%,transparent)] bg-[length:4px_4px] opacity-15 pointer-events-none" />
                    )}
                  <span className="relative z-10 flex items-center justify-center gap-2 px-2">
                    <span className={`${cardAmbiance.accentColor} text-[10px] filter drop-shadow-md`}>●</span>
                    {formData.classe || "SANS CLASSE"}
                    <span className={`${cardAmbiance.accentColor} text-[10px] filter drop-shadow-md`}>●</span>
                  </span>
                  </span>
                </div>

                {/* ── SPÉCIALITÉS ──────────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-2 px-2 sm:px-3 mt-0.5">
                  {/* Spé 1 */}
                  <div className={`bg-black/75 backdrop-blur-[4px] rounded-lg py-1 px-2 flex items-center justify-center gap-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.5)] ${cardAmbiance.specBoxStyle}`}>
                    <span className={`${cardAmbiance.accentColor} flex-shrink-0`}>
                      {renderSpecialtyIcon(formData.iconSpecialite1, 'shield', 'w-5 h-5')}
                    </span>
                    <span className={`text-[8px] sm:text-[9.5px] font-black tracking-wide uppercase truncate text-neutral-100 ${cardAmbiance.fontData}`}>
                      {formData.specialite1 || "SPÉCIALITÉ 1"}
                    </span>
                  </div>

                  {/* Spé 2 */}
                  <div className={`bg-black/55 backdrop-blur-[2px] rounded-lg py-1 px-2 flex items-center justify-center gap-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_1.5px_3px_rgba(0,0,0,0.4)] ${cardAmbiance.specBoxStyle}`}>
                    <span className={`${cardAmbiance.accentColor} flex-shrink-0`}>
                      {renderSpecialtyIcon(formData.iconSpecialite2, 'sparkles', 'w-5 h-5')}
                    </span>
                    <span className={`text-[8px] sm:text-[9.5px] font-black tracking-wide uppercase truncate text-neutral-300 ${cardAmbiance.fontData}`}>
                      {formData.specialite2 || "SPÉCIALITÉ 2"}
                    </span>
                  </div>
                </div>

                {/* ── BOÎTE TEXTE (Réalisation / Faille / Citation) ────────── */}
                <div className={`m-2 p-2 sm:p-2.5 border-2 rounded-xl flex flex-col gap-1.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.85),0_4px_6px_rgba(0,0,0,0.5)] relative overflow-hidden ${cardAmbiance.textBoxStyle}`}
                  style={{
                    backgroundImage: cardAmbiance.textBoxBgImage,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundBlendMode: cardAmbiance.textBoxBgBlendMode as any,
                  }}>

                  {/* Ember dans la boîte texte (Guerrier) */}
                  {cardAmbiance.showEmber && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl z-0">
                      {[...Array(12)].map((_, i) => {
                        const size = Math.random() * 4 + 2;
                        const left = Math.random() * 100;
                        const duration = Math.random() * 3 + 3;
                        const delay = Math.random() * -6;
                        const drift = Math.random() * 40 - 20;
                        return (
                          <div key={i} className="fire-ember"
                            style={{ width: `${size}px`, height: `${size}px`, left: `${left}%`, bottom: `-10px`,
                              '--ember-duration': `${duration}s`, '--ember-drift': `${drift}px`, animationDelay: `${delay}s`,
                              filter: 'blur(0.5px) drop-shadow(0 0 3px #ff0000)'
                            } as React.CSSProperties} />
                        );
                      })}
                    </div>
                  )}

                  {/* Taches de sang dans texte (Guerrier) */}
                  {cardAmbiance.showBlood && (
                    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-25 select-none">
                      <div className="absolute top-[20%] left-[25%] w-20 h-20 text-[#8a0303]/25 blur-[1px]">
                        <svg viewBox="0 0 100 100" fill="currentColor">
                          <path d="M50,30 C65,20 80,35 70,55 C60,75 40,70 35,55 C30,40 40,35 50,30 Z" />
                        </svg>
                      </div>
                      <div className="absolute bottom-[15%] right-[15%] w-16 h-16 text-[#8a0303]/20 blur-[1.5px]">
                        <svg viewBox="0 0 100 100" fill="currentColor">
                          <path d="M20,40 C40,30 50,50 40,70 C30,80 10,60 20,40 Z" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Trace d'épée sur Réalisation (Guerrier) */}
                  {cardAmbiance.showScratches && (
                    <div className="absolute inset-0 pointer-events-none z-0 opacity-15">
                      <div className="absolute top-[25%] left-2 right-2 h-[1px] bg-white rotate-[-2deg]" />
                    </div>
                  )}

                  {/* RÉALISATION CLEF */}
                  <div className="relative z-10">
                    <h4 className={`text-[7.5px] sm:text-[8px] font-black tracking-widest uppercase mb-0.5 opacity-100 drop-shadow-[0_0_3px_rgba(245,158,11,0.6)] ${cardAmbiance.fontTitle} ${cardAmbiance.accentColor}`}>
                      RÉALISATION CLEF
                    </h4>
                    <p className={`text-[9.5px] sm:text-[10.5px] text-neutral-200 leading-tight line-clamp-2 ${cardAmbiance.fontData}`}>
                      {formData.realisation || "Aucun fait d'armes connu n'a été répertorié pour cette légende."}
                    </p>
                  </div>

                  <div className={`h-[1px] bg-gradient-to-r from-transparent ${cardAmbiance.dividerStyle} to-transparent relative z-10`} />

                  {/* Traces d'épée sur Faille (Guerrier) */}
                  {cardAmbiance.showScratches && (
                    <div className="absolute inset-0 pointer-events-none z-0 opacity-25">
                      <div className="absolute top-[65%] left-4 right-4 h-[1px] bg-red-500 rotate-[4deg]" />
                      <div className="absolute top-[75%] left-2 right-2 h-[1px] bg-red-700 rotate-[-3deg]" />
                    </div>
                  )}

                  {/* FAILLE CRITIQUE */}
                  <div className="relative z-10">
                    <h4 className={`text-[7.5px] sm:text-[8px] font-black tracking-widest uppercase mb-0.5 opacity-100 ${cardAmbiance.fontTitle} ${cardAmbiance.failleColor}`}>
                      FAILLE CRITIQUE
                    </h4>
                    <p className={`text-[9.5px] sm:text-[10.5px] text-neutral-300 leading-tight line-clamp-2 ${cardAmbiance.fontData}`}>
                      {formData.faille || "Sa faille reste mystérieuse et indéterminée."}
                    </p>
                  </div>

                  <div className={`h-[1px] bg-gradient-to-r from-transparent ${cardAmbiance.dividerStyle} to-transparent relative z-10`} />

                  {/* ── CITATION ── */}
                  <div className={`pt-1.5 pb-1.5 text-left flex items-start justify-start gap-2 px-2.5 relative z-10 rounded-lg shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.6),0_0_8px_rgba(138,3,3,0.15)] ${cardAmbiance.citationBoxStyle}`}>
                    <Quote className={`w-4 h-4 sm:w-4.5 sm:h-4.5 flex-shrink-0 mt-0.5 ${cardAmbiance.quoteIconStyle}`} />
                    <p
                      className={`italic text-rose-100/95 tracking-wide whitespace-normal text-left w-full break-words ${cardAmbiance.fontCitation}`}
                      style={{
                        fontSize: `${getCitationFontSize(formData.citation)}px`,
                        lineHeight: 1.25,
                      }}
                    >
                      {formData.citation || "Saisissez votre citation épique..."}
                    </p>
                  </div>

                </div>
              </div>
            </div>
            
            {/* Reflet ambiant */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none rounded-[28px] ring-1 ring-white/10 shadow-[inset_0_2px_3px_rgba(255,255,255,0.05)] z-20" />
          </div>

          <p className="text-[10px] text-neutral-500 text-center mt-3 font-medium">
            Aperçu HD fidèle à l'exportation. Utilisez l'image générée dans vos jeux de rôle ou d'aventure.
          </p>
        </div>

      </div>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto mt-16 border-t border-neutral-900 pt-6 text-center text-xs text-neutral-500 pb-8 flex flex-col sm:flex-row justify-between items-center gap-3">
        <p className="font-medium">© 2026 Studio des Légendes • Réalisé de manière artisanale</p>
        <div className="flex gap-4 font-bold text-neutral-400">
          <span className="hover:text-amber-500 transition cursor-default">Jeu de Rôle</span>
          <span>•</span>
          <span className="hover:text-amber-500 transition cursor-default">Éditeur HD</span>
          <span>•</span>
          <span className="hover:text-emerald-400 transition cursor-default">Supabase Sync</span>
        </div>
      </footer>
    </div>
  );
}
