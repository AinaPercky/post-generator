import React, { useState, useRef, useEffect } from 'react';
import { toPng, toJpeg } from 'html-to-image';
// @ts-ignore
import cardBackground from '../assets/card_background_1782290811054.jpg';
import explorateurBackground from '../assets/fond_explorateur.png';
import { 
  Sparkles, 
  Upload, 
  Download, 
  Plus, 
  Trash2, 
  Copy, 
  Search, 
  Image as ImageIcon, 
  RotateCcw, 
  Swords, 
  Shield, 
  Quote, 
  Heart, 
  Check, 
  AlertTriangle, 
  Filter,
  Eye,
  Settings,
  HelpCircle,
  FileImage,
  Crown,
  Skull,
  Crosshair,
  Axe,
  Flame,
  Zap,
  Wind,
  Target,
  Feather,
  Compass,
  FlaskConical,
  Palette,
  Film,
  BookOpen,
  Trophy
} from 'lucide-react';

// Structure de données d'une carte de guerrier
interface WarriorCard {
  id: number;
  numero: string;
  nom: string;
  rarete: 'C' | 'R' | 'E' | 'L' | 'G'; // C: Commun, R: Rare, E: Épique, L: Légendaire, G: Divin
  surnom: string;
  portraitUrl: string;
  classe: string;
  specialite1: string;
  specialite2: string;
  iconSpecialite1?: string;
  iconSpecialite2?: string;
  realisation: string;
  faille: string;
  citation: string;
  theme: 'gold' | 'fire' | 'void' | 'ice' | 'emerald';
  hp: number;
  atk: number;
}

const INITIAL_CARDS: WarriorCard[] = [
  {
    id: 1,
    numero: "001",
    nom: "ACHILLE",
    rarete: "G",
    surnom: "Héros Invincible",
    portraitUrl: "https://images.unsplash.com/photo-1599733589046-10c005739ef9?auto=format&fit=crop&w=500&q=80",
    classe: "Guerrier / Demi-dieu",
    specialite1: "Combat Rapproché",
    specialite2: "Vitesse Divine",
    realisation: "Seul guerrier grec capable de vaincre Hector devant les murs de Troie.",
    faille: "Son talon non protégé reste sa seule vulnérabilité fatale.",
    citation: "La gloire éternelle vaut bien une vie brève.",
    theme: "gold",
    hp: 98,
    atk: 99
  },
  {
    id: 2,
    numero: "002",
    nom: "LÉONIDAS",
    rarete: "L",
    surnom: "Roi de Sparte",
    portraitUrl: "https://images.unsplash.com/photo-1580130379624-3a069adbffc5?auto=format&fit=crop&w=500&q=80",
    classe: "Guerrier / Hoplite",
    specialite1: "Mur de Boucliers",
    specialite2: "Ténacité Absolue",
    realisation: "A tenu tête à l'immense armée persane aux Thermopyles avec seulement 300 hommes.",
    faille: "Le sacrifice ultime par honneur ne laisse aucune chance de survie.",
    citation: "Molon Labe — Viens les prendre.",
    theme: "fire",
    hp: 95,
    atk: 92
  },
  {
    id: 3,
    numero: "003",
    nom: "SUN TZU",
    rarete: "E",
    surnom: "Le Maître de la Guerre",
    portraitUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=500&q=80",
    classe: "Penseur / Théoricien",
    specialite1: "Grande Stratégie",
    specialite2: "Guerre Psychologique",
    realisation: "A rédigé l'Art de la Guerre, le traité militaire le plus influent de l'Histoire.",
    faille: "Préfère la théorie pure et l'évitement du conflit à l'action physique directe.",
    citation: "Tout l'art de la guerre repose sur la duperie.",
    theme: "emerald",
    hp: 75,
    atk: 88
  },
  {
    id: 4,
    numero: "004",
    nom: "MUSASHI MIYAMOTO",
    rarete: "L",
    surnom: "Le Saint au Sabre",
    portraitUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=500&q=80",
    classe: "Guerrier / Combattant",
    specialite1: "Style à Deux Sabres",
    specialite2: "Discipline Mentale",
    realisation: "Invaincu au cours de 61 duels de vie ou de mort et auteur du Traité des Cinq Roues.",
    faille: "Son dédain des conventions et son isolement spirituel extrême.",
    citation: "Sous le sabre levé se trouve l'enfer, faites un pas et c'est le paradis.",
    theme: "void",
    hp: 85,
    atk: 96
  },
  {
    id: 5,
    numero: "005",
    nom: "JEANNE D'ARC",
    rarete: "R",
    surnom: "La Pucelle d'Orléans",
    portraitUrl: "https://images.unsplash.com/photo-1608155686393-8fdd966d784d?auto=format&fit=crop&w=500&q=80",
    classe: "Dirigeant / Chef révolutionnaire",
    specialite1: "Ferveur Spirituelle",
    specialite2: "Inspiration des Troupes",
    realisation: "A libéré Orléans et unifié la France durant la guerre de Cent Ans à seulement 17 ans.",
    faille: "Sa foi inébranlable la guidant parfois vers des risques sacrificiels insensés.",
    citation: "Je n'ai pas peur, je suis née pour faire ceci.",
    theme: "ice",
    hp: 89,
    atk: 80
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
    fontTitle: "font-anton text-fuchsia-400",
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
    fontTitle: "font-bebas text-purple-400",
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
    fontTitle: "font-oswald text-amber-600",
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
    fontTitle: "font-bebas text-yellow-500",
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
    fontTitle: "font-anton text-emerald-400",
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

const getClassIcon = (classeName: string, iconClassName: string = "w-4 h-4") => {
  const { mainClass } = parseClasse(classeName);
  switch (mainClass) {
    case 'Explorateur': return <Compass className={`${iconClassName} text-[#88d498]`} />;
    case 'Savant': return <FlaskConical className={`${iconClassName} text-blue-400`} />;
    case 'Artiste': return <Palette className={`${iconClassName} text-fuchsia-400`} />;
    case 'Fictionnel': return <Film className={`${iconClassName} text-purple-400`} />;
    case 'Penseur': return <BookOpen className={`${iconClassName} text-amber-600`} />;
    case 'Dirigeant': return <Crown className={`${iconClassName} text-yellow-500`} />;
    case 'Athlète': return <Trophy className={`${iconClassName} text-emerald-400`} />;
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
        return <Skull className={`${iconClassName} text-purple-400`} />;
      }
      if (normalized.includes('archère') || normalized.includes('archer') || normalized.includes('chasseur') || normalized.includes('tireur') || normalized.includes('fusil') || normalized.includes('éclaireur')) {
        return <Crosshair className={`${iconClassName} text-emerald-400`} />;
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
        portraitBorderStyle: "border-2 border-[#bce784]/60 shadow-[0_0_12px_rgba(188,231,132,0.35)]",
        classBadgeStyle: "border-2 border-[#bce784]/80 bg-gradient-to-r from-[#171413] via-[#2a2420] to-[#171413]",
        specBoxStyle: "border-2 border-[#525174]/60",
        citationBoxStyle: "border border-[#5dd39e]/50 bg-[#171413]/55",
        iconContainerStyle: "border-[#bce784]/80 shadow-[0_0_8px_rgba(188,231,132,0.4)]",
        dividerStyle: "via-[#5dd39e]/30",
        failleColor: "text-[#bce784]",
        
        textBoxBgImage: `linear-gradient(to bottom, rgba(81, 59, 86, 0.5), rgba(23, 20, 19, 0.92)), url(${explorateurBackground})`,
        textBoxBgBlendMode: 'normal',
        quoteIconStyle: "text-[#5dd39e] drop-shadow-[0_0_6px_rgba(93,211,158,0.6)]",
        
        cornerStyle: 'rivet',
        showScratches: false,
        showBlood: false,
        showEmber: false,
        effectOverlay: (
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-[24px]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#bce784]/[0.04] via-transparent to-[#348aa7]/20 mix-blend-overlay" />
            <svg className="absolute inset-0 w-full h-full opacity-[0.06]" viewBox="0 0 300 480" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
              {[60, 120, 180, 240, 300, 360, 420].map(y => <line key={`lat-${y}`} x1="0" y1={y} x2="300" y2={y} stroke="#bce784" strokeWidth="0.5" strokeDasharray="6 4" />)}
              {[50, 100, 150, 200, 250].map(x => <line key={`lon-${x}`} x1={x} y1="0" x2={x} y2="480" stroke="#bce784" strokeWidth="0.5" strokeDasharray="6 4" />)}
              <line x1="0" y1="480" x2="300" y2="0" stroke="#5dd39e" strokeWidth="0.4" strokeDasharray="8 6" opacity="0.5" />
              <line x1="0" y1="0" x2="300" y2="480" stroke="#5dd39e" strokeWidth="0.4" strokeDasharray="8 6" opacity="0.3" />
              <line x1="0" y1="240" x2="300" y2="60" stroke="#348aa7" strokeWidth="0.35" strokeDasharray="5 8" opacity="0.4" />
            </svg>
            <div className="absolute top-0 left-[18%] w-16 h-56 bg-gradient-to-b from-[#bce784]/10 via-[#5dd39e]/04 to-transparent rotate-[-10deg] origin-top" />
            <div className="absolute top-0 left-[48%] w-12 h-44 bg-gradient-to-b from-[#bce784]/08 via-[#348aa7]/03 to-transparent rotate-[5deg] origin-top" />
            <div className="absolute top-0 right-[14%] w-8 h-36 bg-gradient-to-b from-[#5dd39e]/07 via-transparent to-transparent rotate-[12deg] origin-top" />
            
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
        fontTitle: "font-oswald font-bold tracking-wider uppercase text-blue-400",
        fontData: "font-montserrat font-semibold",
        fontCitation: "font-sans font-medium",
        accentColor: "text-cyan-400",
        accentBorder: "border-cyan-500/80",
        innerBorder: "border-blue-600/40",
        outerBorder: "border-cyan-500/80 shadow-[0_0_25px_rgba(6,182,212,0.65),inset_0_1px_3px_rgba(255,255,255,0.2)]",
        themeBgGradient: "from-blue-950/85 via-slate-900/90 to-cyan-950/95",
        
        nameSectionStyle: "border border-cyan-500/50 bg-slate-950/95 shadow-[0_0_12px_rgba(6,182,212,0.35),inset_0_1px_2px_rgba(255,255,255,0.1)] rounded-md",
        textBoxStyle: "border border-blue-500/40 bg-slate-950/95 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.9),0_0_10px_rgba(30,58,138,0.4)] rounded-md",
        portraitBorderStyle: "border-2 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.4)]",
        classBadgeStyle: "border-2 border-cyan-500/80 bg-gradient-to-r from-[#171413] via-[#2a2420] to-[#171413]",
        specBoxStyle: "border-2 border-cyan-500/50",
        citationBoxStyle: "border border-blue-500/20 bg-black/45",
        iconContainerStyle: "border-cyan-500/80",
        dividerStyle: "via-cyan-500/20",
        failleColor: "text-[#ff0000]",
        
        quoteIconStyle: "text-cyan-400",
        cornerStyle: 'rivet',
        showScratches: false,
        showBlood: false,
        showEmber: false,
        effectOverlay: (
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-[24px]">
            <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-[0.08]" />
            <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-blue-500/10 to-transparent" />
          </div>
        )
      };
      
    case 'Artiste':
      return {
        fontTitle: "font-anton tracking-wide uppercase text-fuchsia-400",
        fontData: "font-montserrat font-semibold",
        fontCitation: "font-playfair italic",
        accentColor: "text-fuchsia-400",
        accentBorder: "border-fuchsia-500/70",
        innerBorder: "border-purple-500/30",
        outerBorder: "border-fuchsia-500/80 shadow-[0_0_25px_rgba(217,70,239,0.5),inset_0_0_10px_rgba(217,70,239,0.3)]",
        themeBgGradient: "from-purple-950/85 via-fuchsia-950/80 to-rose-950/90",
        
        nameSectionStyle: "border-2 border-fuchsia-500/70 bg-neutral-950/90 shadow-[0_4px_12px_rgba(217,70,239,0.25)] rounded-[18px]",
        textBoxStyle: "border-2 border-purple-500/60 bg-neutral-950/95 shadow-[inset_0_2px_4px_rgba(0,0,0,0.85)] rounded-[18px]",
        portraitBorderStyle: "border-2 border-fuchsia-500/60 shadow-[0_0_12px_rgba(217,70,239,0.3)] rounded-lg",
        classBadgeStyle: "border-2 border-fuchsia-500/80 bg-gradient-to-r from-[#171413] via-[#2a2420] to-[#171413]",
        specBoxStyle: "border-2 border-fuchsia-500/50",
        citationBoxStyle: "border border-fuchsia-500/20 bg-black/45",
        iconContainerStyle: "border-fuchsia-500/70",
        dividerStyle: "via-fuchsia-500/20",
        failleColor: "text-[#ff0000]",
        
        quoteIconStyle: "text-fuchsia-400",
        cornerStyle: 'rivet',
        showScratches: false,
        showBlood: false,
        showEmber: false,
        effectOverlay: (
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-[24px]">
            <div className="absolute -top-12 -left-12 w-40 h-40 bg-fuchsia-500/10 blur-[40px] rounded-full" />
            <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-purple-500/10 blur-[45px] rounded-full" />
            <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-yellow-400/5 blur-[35px] rounded-full" />
          </div>
        )
      };
      
    case 'Fictionnel':
      return {
        fontTitle: "font-bebas tracking-wider uppercase text-purple-400",
        fontData: "font-montserrat font-semibold",
        fontCitation: "font-serif",
        accentColor: "text-purple-400",
        accentBorder: "border-purple-500/80",
        innerBorder: "border-indigo-500/40",
        outerBorder: "border-violet-600/90 shadow-[0_0_28px_rgba(139,92,246,0.7),inset_0_0_12px_rgba(139,92,246,0.4)]",
        themeBgGradient: "from-indigo-950/90 via-violet-950/85 to-neutral-950/95",
        
        nameSectionStyle: "border-2 border-violet-500/80 bg-neutral-950/90 shadow-[0_4px_15px_rgba(139,92,246,0.3)] rounded-xl",
        textBoxStyle: "border-2 border-indigo-500/60 bg-neutral-950/95 shadow-[inset_0_2.5px_5px_rgba(0,0,0,0.9)] rounded-xl",
        portraitBorderStyle: "border-2 border-violet-500/60 shadow-[0_0_12px_rgba(139,92,246,0.4)]",
        classBadgeStyle: "border-2 border-violet-500/80 bg-gradient-to-r from-[#171413] via-[#2a2420] to-[#171413]",
        specBoxStyle: "border-2 border-violet-500/50",
        citationBoxStyle: "border border-violet-500/20 bg-black/45",
        iconContainerStyle: "border-purple-500/80",
        dividerStyle: "via-purple-500/20",
        failleColor: "text-[#ff0000]",
        
        quoteIconStyle: "text-purple-400",
        cornerStyle: 'rivet',
        showScratches: false,
        showBlood: false,
        showEmber: false,
        effectOverlay: (
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-[24px]">
            <div className="absolute inset-0 bg-violet-500/5 mix-blend-color-dodge opacity-50" />
            <div className="absolute -inset-10 border-[6px] border-violet-500/10 blur-xl" />
          </div>
        )
      };
      
    case 'Penseur':
      return {
        fontTitle: "font-oswald font-extrabold tracking-wide uppercase text-amber-600",
        fontData: "font-sourcesans font-semibold",
        fontCitation: "font-playfair italic",
        accentColor: "text-amber-600",
        accentBorder: "border-amber-700/60",
        innerBorder: "border-amber-800/35",
        outerBorder: "border-stone-700/80 shadow-[0_0_15px_rgba(120,113,108,0.4)]",
        themeBgGradient: "from-stone-900/95 via-amber-950/40 to-stone-950/95",
        
        nameSectionStyle: "border-2 border-stone-700 bg-stone-950/95 shadow-[0_4px_8px_rgba(0,0,0,0.85)] rounded-[4px]", 
        textBoxStyle: "border-2 border-stone-700 bg-stone-950/95 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.9)] rounded-[4px]",
        portraitBorderStyle: "border-2 border-stone-700/80 shadow-[0_0_10px_rgba(217,119,6,0.15)]",
        classBadgeStyle: "border-2 border-stone-700/80 bg-gradient-to-r from-[#171413] via-[#2a2420] to-[#171413]",
        specBoxStyle: "border-2 border-stone-600/50",
        citationBoxStyle: "border border-amber-700/20 bg-black/45",
        iconContainerStyle: "border-amber-700/60",
        dividerStyle: "via-amber-600/20",
        failleColor: "text-[#ff0000]",
        
        textBoxBgImage: `linear-gradient(to bottom, rgba(217, 119, 6, 0.2), rgba(28, 25, 23, 0.95)), url(${cardBackground})`,
        textBoxBgBlendMode: 'multiply',
        quoteIconStyle: "text-amber-600",
        
        cornerStyle: 'rivet',
        showScratches: false,
        showBlood: false,
        showEmber: false,
        effectOverlay: (
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-[24px]">
            <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.06]" />
            <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-amber-200/10 via-transparent to-transparent" />
          </div>
        )
      };
      
    case 'Dirigeant':
      return {
        fontTitle: "font-bebas tracking-widest uppercase text-yellow-500",
        fontData: "font-montserrat font-semibold",
        fontCitation: "font-serif",
        accentColor: "text-yellow-500",
        accentBorder: "border-yellow-600/80",
        innerBorder: "border-yellow-700/40",
        outerBorder: "border-yellow-600/90 shadow-[0_0_30px_rgba(234,179,8,0.6),inset_0_0_15px_rgba(234,179,8,0.3)]",
        themeBgGradient: "from-blue-950/80 via-yellow-950/20 to-neutral-950/95",
        
        nameSectionStyle: "border-2 border-yellow-600 bg-neutral-950/90 shadow-[0_4px_12px_rgba(234,179,8,0.25)] rounded-lg",
        textBoxStyle: "border-2 border-yellow-700/60 bg-neutral-950/95 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] rounded-lg",
        portraitBorderStyle: "border-2 border-yellow-600/80 shadow-[0_0_15px_rgba(234,179,8,0.3)]",
        classBadgeStyle: "border-2 border-yellow-600/80 bg-gradient-to-r from-[#171413] via-[#2a2420] to-[#171413]",
        specBoxStyle: "border-2 border-yellow-600/50",
        citationBoxStyle: "border border-yellow-600/20 bg-black/45",
        iconContainerStyle: "border-yellow-600/80",
        dividerStyle: "via-yellow-600/20",
        failleColor: "text-[#ff0000]",
        
        quoteIconStyle: "text-yellow-500",
        cornerStyle: 'rivet',
        showScratches: false,
        showBlood: false,
        showEmber: false,
        effectOverlay: (
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-[24px]">
            <div className="absolute top-0 right-4 w-28 h-64 bg-gradient-to-b from-yellow-300/10 via-transparent to-transparent transform rotate-[25deg] origin-top" />
            <div className="absolute -bottom-10 -left-10 w-36 h-36 border border-yellow-500/15 rounded-full opacity-20" />
          </div>
        )
      };
      
    case 'Athlète':
      return {
        fontTitle: "font-anton tracking-wide uppercase text-emerald-400",
        fontData: "font-montserrat font-semibold",
        fontCitation: "font-sans font-medium",
        accentColor: "text-emerald-400",
        accentBorder: "border-emerald-500/80",
        innerBorder: "border-emerald-600/30",
        outerBorder: "border-emerald-500/90 shadow-[0_0_22px_rgba(16,185,129,0.5),inset_0_0_12px_rgba(16,185,129,0.2)]",
        themeBgGradient: "from-zinc-900/90 via-[#0a0f0d]/90 to-zinc-950/95",
        
        nameSectionStyle: "border-2 border-zinc-800 bg-black/95 shadow-[0_4px_10px_rgba(0,0,0,0.95)] rounded-[4px] skew-x-[-4deg]", 
        textBoxStyle: "border border-zinc-800 bg-black/95 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.9)] rounded-[4px]",
        portraitBorderStyle: "border-2 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.3)]",
        classBadgeStyle: "border-2 border-emerald-500/80 bg-gradient-to-r from-[#171413] via-[#2a2420] to-[#171413]",
        specBoxStyle: "border-2 border-emerald-500/40",
        citationBoxStyle: "border border-emerald-500/20 bg-black/45",
        iconContainerStyle: "border-emerald-500/80",
        dividerStyle: "via-emerald-500/20",
        failleColor: "text-[#ff0000]",
        
        quoteIconStyle: "text-emerald-400",
        cornerStyle: 'rivet',
        showScratches: false,
        showBlood: false,
        showEmber: false,
        effectOverlay: (
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-[24px]">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent" />
            <div className="absolute bottom-12 left-0 right-0 h-0.5 bg-emerald-500/20 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
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

export default function LegendGenerator() {
  const [cards, setCards] = useState<WarriorCard[]>(() => {
    const saved = localStorage.getItem('warrior_cards');
    return saved ? JSON.parse(saved) : INITIAL_CARDS;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const [isExporting, setIsExporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [exportBackground, setExportBackground] = useState<'transparent' | 'filled'>('filled');

  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeCard = cards[currentIndex] || cards[0] || INITIAL_CARDS[0];
  const [formData, setFormData] = useState<WarriorCard>({ ...activeCard });

  useEffect(() => {
    localStorage.setItem('warrior_cards', JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    if (activeCard) {
      setFormData({ ...activeCard });
    }
  }, [currentIndex, cards]);

  const handleResetToDefault = () => {
    if (window.confirm("Êtes-vous sûr de vouloir réinitialiser l'application ? Toutes vos cartes personnalisées seront perdues et remplacées par la collection de base.")) {
      setCards(INITIAL_CARDS);
      setCurrentIndex(0);
      setFormData({ ...INITIAL_CARDS[0] });
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
      }
      return updated;
    });
  };

  const handleAddNewCard = () => {
    if (cards.length >= 100) { alert("Limite maximale de 100 cartes atteinte !"); return; }
    const maxId = cards.reduce((max, c) => c.id > max ? c.id : max, 0);
    const newId = maxId + 1;
    const newCard: WarriorCard = {
      id: newId,
      numero: String(newId).padStart(3, '0'),
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
    const newCollection = [...cards, newCard];
    setCards(newCollection);
    setCurrentIndex(newCollection.length - 1);
    setFormData(newCard);
  };

  const handleDuplicateCard = () => {
    if (cards.length >= 100) { alert("Limite maximale de 100 cartes atteinte !"); return; }
    const maxId = cards.reduce((max, c) => c.id > max ? c.id : max, 0);
    const newId = maxId + 1;
    const duplicated: WarriorCard = { ...formData, id: newId, numero: String(newId).padStart(3, '0'), nom: `${formData.nom} (COPIE)` };
    const newCollection = [...cards, duplicated];
    setCards(newCollection);
    setCurrentIndex(newCollection.length - 1);
    setFormData(duplicated);
  };

  const handleDeleteCard = () => {
    if (cards.length <= 1) { alert("Vous devez conserver au moins une carte dans votre studio !"); return; }
    if (window.confirm(`Voulez-vous vraiment supprimer la carte de "${formData.nom}" ?`)) {
      const filtered = cards.filter(c => c.id !== formData.id);
      setCards(filtered);
      setCurrentIndex(Math.max(0, currentIndex - 1));
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
          if (activeIdx !== -1) { updatedCards[activeIdx] = updated; setCards(updatedCards); }
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
      if (activeIdx !== -1) { updatedCards[activeIdx] = updated; setCards(updatedCards); }
      return updated;
    });
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
            <li><strong className="text-emerald-400">Solution ultime :</strong> Glissez-déposez ou importez une image depuis votre appareil (stockage base64 local).</li>
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
                          <img src={c.portraitUrl} alt="" className="w-full h-full object-cover object-top" />
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
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs uppercase font-serif tracking-wider font-bold focus:border-amber-500 focus:outline-none transition-colors" required />
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
                <div className="p-3.5 bg-amber-500/5 rounded-lg border border-amber-600/20 text-[10px] text-amber-500/80 italic font-medium uppercase tracking-wider text-center">
                  💡 Sauvegarde locale active en temps réel.
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* COLONNE DROITE — APERÇU CARTE */}
        <div className="lg:col-span-5 flex flex-col items-center sticky top-6">
          
          {/* EXPORT */}
          <div className="bg-neutral-900/40 p-5 rounded-2xl border border-neutral-800 shadow-lg backdrop-blur-sm w-full max-w-[430px] mb-6 space-y-4">
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
                  src={parseClasse(formData.classe).mainClass === 'Explorateur' ? explorateurBackground : cardBackground}
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
                  <div className="metal-scratch top-[32%] left-[25%] w-[35%] rotate-[-25deg] opacity-30" />
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
                      <h2 className={`text-xl sm:text-2xl font-black tracking-wider text-neutral-100 uppercase truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${cardAmbiance.fontTitle}`}>
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
                      <div className="absolute bottom-2 right-3 text-[#8a0303]/45 z-10 pointer-events-none">
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
                  <span className="relative z-10 flex items-center justify-center px-2">
                    {formData.classe || "SANS CLASSE"}
                  </span>
                  </span>
                </div>

                {/* ── SPÉCIALITÉS ──────────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-2 px-2 sm:px-3 mt-0.5">
                  {/* Spé 1 */}
                  <div className={`bg-black/75 backdrop-blur-[4px] rounded-lg py-1 px-2 flex items-center justify-center gap-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.5)] ${cardAmbiance.specBoxStyle}`}>
                    <span className={`${cardAmbiance.accentColor} flex-shrink-0`}>
                      {renderSpecialtyIcon(formData.iconSpecialite1, 'shield', 'w-3.5 h-3.5')}
                    </span>
                    <span className={`text-[8px] sm:text-[9.5px] font-black tracking-wide uppercase truncate text-neutral-100 ${cardAmbiance.fontData}`}>
                      {formData.specialite1 || "SPÉCIALITÉ 1"}
                    </span>
                  </div>

                  {/* Spé 2 */}
                  <div className={`bg-black/55 backdrop-blur-[2px] rounded-lg py-1 px-2 flex items-center justify-center gap-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_1.5px_3px_rgba(0,0,0,0.4)] ${cardAmbiance.specBoxStyle}`}>
                    <span className={`${cardAmbiance.accentColor} flex-shrink-0`}>
                      {renderSpecialtyIcon(formData.iconSpecialite2, 'sparkles', 'w-3.5 h-3.5')}
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
                  <div className={`pt-1.5 pb-1 text-center flex items-center justify-start gap-2 px-2.5 relative z-10 rounded-lg shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.6),0_0_8px_rgba(138,3,3,0.15)] ${cardAmbiance.citationBoxStyle}`}>
                    <Quote className={`w-4.5 h-4.5 sm:w-5 h-5 flex-shrink-0 ${cardAmbiance.quoteIconStyle}`} />
                    <p className={`text-[10px] sm:text-[12px] italic text-rose-100/95 tracking-wide leading-relaxed whitespace-normal text-left w-full max-h-[50px] overflow-y-auto pr-0.5 scrollbar-thin ${cardAmbiance.fontCitation}`}>
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
          <span className="hover:text-amber-500 transition cursor-default">Local Persistence</span>
        </div>
      </footer>
    </div>
  );
}
