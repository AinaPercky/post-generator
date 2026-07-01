import React from 'react';
// ─── CHARTE GRAPHIQUE PAR CLASSE ────────────────────────────────────────────────

/**
 * Interface simplifiée pour définir la charte graphique d'une classe.
 * 
 * Le développeur spécifie les couleurs principales :
 * - primary : couleur dominante utilisée pour les bordures, les effets de lueur (glow), et le texte des titres
 * - secondary : variante plus claire ou froide utilisée pour les accents intérieurs et les états de survol (hover)
 * - accent : couleur d'accentuation optionnelle (calculée automatiquement si non fournie)
 * - background : couleur de fond optionnelle (calculée automatiquement si non fournie)
 * - danger : couleur de danger optionnelle (calculée automatiquement si non fournie)
 * 
 * @example
 * const guerrierTheme: SimpleClassTheme = {
 *   primary: '#ff0000',    // Rouge vif pour l'agressivité et la force
 *   secondary: '#8a0303',  // Rouge sombre pour les nuances
 *   accent: '#f59e0b',    // Orange pour les points d'intérêt (optionnel)
 *   background: '#171413', // Noir/gris très sombre (optionnel)
 *   danger: '#ff0000'     // Rouge pour les éléments de danger (optionnel)
 * };
 */
export interface SimpleClassTheme {
  /** Couleur dominante - bordures, lueurs, texte des titres */
  primary:    string;
  /** Variante plus claire/froide - accents intérieurs, états hover */
  secondary:  string;
  /** Couleur d'accentuation optionnelle - icônes de citation, surbrillances */
  accent?:     string;
  /** Couleur de base sombre optionnelle - arrière-plan des cartes, overlays */
  background?: string;
  /** Couleur d'alerte optionnelle - failles, éléments de danger */
  danger?:     string;
}

/**
 * Interface complète définissant la charte graphique (palette de couleurs) pour chaque classe de personnage.
 * 
 * Cette interface est générée automatiquement à partir de SimpleClassTheme.
 * Chaque classe possède une identité visuelle unique basée sur une palette de 5 couleurs :
 * - primary : couleur dominante utilisée pour les bordures, les effets de lueur (glow), et le texte des titres
 * - secondary : variante plus claire ou froide utilisée pour les accents intérieurs et les états de survol (hover)
 * - accent : couleur d'accentuation pour les éléments pop comme les icônes de citation et les surbrillances
 * - background : couleur de base sombre utilisée pour l'arrière-plan des cartes et les overlays
 * - danger : couleur utilisée pour les alertes, les failles et les éléments de danger
 */
export default interface ClassTheme {
  /** Couleur dominante - bordures, lueurs, texte des titres */
  primary:    string;
  /** Variante plus claire/froide - accents intérieurs, états hover */
  secondary:  string;
  /** Couleur d'accentuation - icônes de citation, surbrillances */
  accent:     string;
  /** Couleur de base sombre - arrière-plan des cartes, overlays */
  background: string;
  /** Couleur d'alerte - failles, éléments de danger */
  danger:     string;
}

// ─── UTILITAIRES DE CALCUL DE COULEURS ─────────────────────────────────────────

/**
 * Convertit une couleur hexadécimale en RGB.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

/**
 * Assombrit une couleur hexadécimale d'un pourcentage donné.
 */
function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  const factor = 1 - percent / 100;
  const r = Math.round(rgb.r * factor);
  const g = Math.round(rgb.g * factor);
  const b = Math.round(rgb.b * factor);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Éclaircit une couleur hexadécimale d'un pourcentage donné.
 */
function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  const factor = 1 + percent / 100;
  const r = Math.min(255, Math.round(rgb.r * factor));
  const g = Math.min(255, Math.round(rgb.g * factor));
  const b = Math.min(255, Math.round(rgb.b * factor));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Convertit une couleur hexadécimale en HSL.
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const rgb = hexToRgb(hex);
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Convertit HSL en hexadécimal.
 */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Calcule automatiquement la couleur d'accentuation.
 * Utilise une teinte complémentaire ou analogue à la couleur primaire.
 */
function calculateAccent(primary: string, secondary: string): string {
  const hsl = hexToHsl(primary);
  // Utiliser la teinte secondaire si elle est différente, sinon une teinte complémentaire
  const secondaryHsl = hexToHsl(secondary);
  if (Math.abs(hsl.h - secondaryHsl.h) > 30) {
    return secondary;
  }
  // Teinte complémentaire (+180 degrés)
  const complementaryH = (hsl.h + 180) % 360;
  return hslToHex(complementaryH, hsl.s, hsl.l);
}

/**
 * Calcule automatiquement la couleur de fond sombre.
 * Assombrit significativement la couleur primaire.
 */
function calculateBackground(primary: string): string {
  return darkenColor(primary, 85);
}

/**
 * Calcule automatiquement la couleur de danger.
 * Utilise généralement le rouge ou une variante très saturée de la couleur primaire.
 */
function calculateDanger(primary: string): string {
  // Si la couleur primaire est déjà rouge/orange, l'utiliser
  const hsl = hexToHsl(primary);
  if ((hsl.h >= 0 && hsl.h <= 30) || (hsl.h >= 330 && hsl.h <= 360)) {
    return primary;
  }
  // Sinon, utiliser rouge comme couleur de danger par défaut
  return '#ff0000';
}

/**
 * Convertit une SimpleClassTheme en ClassTheme complète.
 * Les couleurs manquantes sont calculées automatiquement.
 */
export function expandClassTheme(simple: SimpleClassTheme): ClassTheme {
  return {
    primary: simple.primary,
    secondary: simple.secondary,
    accent: simple.accent || calculateAccent(simple.primary, simple.secondary),
    background: simple.background || calculateBackground(simple.primary),
    danger: simple.danger || calculateDanger(simple.primary),
  };
}

/**
 * Configuration des effets visuels pour une classe.
 * Cette interface permet de définir de manière déclarative les effets appliqués
 * sans écrire de JSX. Les couleurs sont automatiquement appliquées depuis ClassTheme.
 */
export interface EffectConfig {
  /** Type de grille : 'none', 'dots', 'lines', 'coordinates' */
  gridType?: 'none' | 'dots' | 'lines' | 'coordinates';
  /** Taille de la grille en pixels */
  gridSize?: number;
  /** Opacité de la grille (0-1) */
  gridOpacity?: number;
  
  /** Type de boussole : 'none', 'simple', 'detailed' */
  compassType?: 'none' | 'simple' | 'detailed';
  /** Position de la boussole : 'bottom-right', 'bottom-left', 'top-right', 'top-left' */
  compassPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  
  /** Type de dégradé de fond : 'none', 'top', 'bottom', 'radial' */
  gradientType?: 'none' | 'top' | 'bottom' | 'radial';
  /** Opacité du dégradé (0-1) */
  gradientOpacity?: number;
  
  /** Type de taches de couleur : 'none', 'blur-circles' */
  blurType?: 'none' | 'blur-circles';
  /** Nombre de taches floues */
  blurCount?: number;
  
  /** Mode de mélange CSS : 'none', 'overlay', 'color-dodge', 'multiply' */
  blendMode?: 'none' | 'overlay' | 'color-dodge' | 'multiply';
  
  /** Bordure floue : true/false */
  hasBlurBorder?: boolean;
  
  /** Rayon de lumière : true/false */
  hasLightRay?: boolean;
  
  /** Ligne brillante en bas : true/false */
  hasGlowLine?: boolean;
  
  /** Code binaire pour Savant : true/false */
  showBinaryCode?: boolean;
  
  /** Snippet de code pour Savant : true/false */
  showCodeSnippet?: boolean;
  
  /** Cercles concentriques animés pour Savant portrait : true/false */
  showOrbitalCircles?: boolean;
}

export const CLASS_THEMES: Record<string, SimpleClassTheme> = {
  Guerrier:    { primary: '#ff0000', secondary: '#8a0303', accent: '#f59e0b', background: '#171413', danger: '#ff0000' },
  Explorateur: { primary: '#348aa7', secondary: '#bce784', accent: '#5dd39e', background: '#171413', danger: '#bce784' },
  Savant:      { primary: '#00ffff', secondary: '#ffff33', accent: '#ffcc33', background: '#023047', danger: '#fb8500' },
  Artiste:     { primary: '#820263', secondary: '#fb8b24', accent: '#d90368', background: '#0a0008', danger: '#ff0000' },
  Fictionnel:  { primary: '#7776bc', secondary: '#fffbdb', accent: '#cdc7e5', background: '#0d0a1a', danger: '#ff0000' },
  Penseur:     { primary: '#d97706', secondary: '#FFFF82', accent: '#A16207', background: '#1c1917', danger: '#ff0000' },
  Dirigeant:   { primary: '#ffd500', secondary: '#5c0099', accent: '#fdc500', background: '#0a0a0a', danger: '#ff0000' },
  Athlète:     { primary: '#00A86B', secondary: '#6C4E2D', accent: '#2bc016', background: '#0a0f0d', danger: '#ff0000' },
};

// ─── CONFIGURATIONS D'AMBIANCE PAR CLASSE ─────────────────────────────────────────

/**
 * Configuration d'ambiance complète pour une classe.
 * Permet de personnaliser tous les aspects visuels d'une classe de personnage.
 */
export interface ClassAmbianceConfig {
  /** Identifiant unique de la classe */
  id: string;
  /** Nom d'affichage de la classe */
  displayName: string;
  /** Description de l'identité de la classe */
  identity: string;
  /** Liste des sous-types associés à cette classe */
  subtypes: string[];
  /** Thème de couleurs simplifié */
  theme: SimpleClassTheme;
  /** Configuration des effets visuels */
  effects: EffectConfig;
  /** URL de l'image de fond par défaut */
  backgroundImage?: string;
  /** Police principale pour les titres */
  titleFont?: 'oswald' | 'bebas' | 'anton' | 'montserrat';
  /** Style de coin */
  cornerStyle?: 'rivet' | 'compass' | 'none';
  /** Afficher les rayures de style guerrier */
  showScratches?: boolean;
  /** Afficher les effets de sang/brasier */
  showBlood?: boolean;
  /** Afficher les braises animées */
  showEmber?: boolean;
  /** Surcharges additionnelles pour CardAmbiance */
  overrides?: Partial<CardAmbiance>;
}

/**
 * Registre des configurations d'ambiance par classe.
 * Chaque classe a une configuration complète qui définit son identité visuelle.
 */
export const CLASS_AMBIANCE_CONFIGS: Record<string, ClassAmbianceConfig> = {
  Guerrier: {
    id: 'Guerrier',
    displayName: 'Guerrier',
    identity: 'Combat · Stratégie · Domination physique',
    subtypes: ['Soldat', 'Stratège', 'Conquérant', 'Chef de guerre', 'Héros mythologique', 'Anti-héros'],
    theme: CLASS_THEMES.Guerrier,
    effects: CLASS_EFFECT_CONFIGS.Guerrier,
    titleFont: 'bebas',
    cornerStyle: 'rivet',
    showScratches: true,
    showBlood: true,
    showEmber: true,
  },
  Explorateur: {
    id: 'Explorateur',
    displayName: 'Explorateur',
    identity: 'Découverte · Aventure · Liberté',
    subtypes: ['Navigateur', 'Cartographe', 'Terrestre', 'Maritime', 'Spatial', 'Numérique', 'Pionnier'],
    theme: CLASS_THEMES.Explorateur,
    effects: CLASS_EFFECT_CONFIGS.Explorateur,
    titleFont: 'oswald',
    cornerStyle: 'compass',
  },
  Savant: {
    id: 'Savant',
    displayName: 'Savant',
    identity: 'Logique · Innovation · Découverte',
    subtypes: ['Physicien', 'Mathématicien', 'Ingénieur', 'Inventeur', 'Économiste', 'Informaticien'],
    theme: CLASS_THEMES.Savant,
    effects: CLASS_EFFECT_CONFIGS.Savant,
    titleFont: 'oswald',
    cornerStyle: 'rivet',
  },
  Artiste: {
    id: 'Artiste',
    displayName: 'Artiste',
    identity: 'Créativité · Expression · Culture',
    subtypes: ['Peintre', 'Sculpteur', 'Musicien', 'Chanteur', 'Acteur', 'Écrivain', 'Cinéaste', 'Danseur', 'Architecte'],
    theme: CLASS_THEMES.Artiste,
    effects: CLASS_EFFECT_CONFIGS.Artiste,
    titleFont: 'anton',
    cornerStyle: 'rivet',
  },
  Fictionnel: {
    id: 'Fictionnel',
    displayName: 'Fictionnel',
    identity: 'Imaginaire · Pouvoir · Univers',
    subtypes: ['Super-héros', 'Anti-héros', 'Créature', 'Guerrier fictif', 'Entité cosmique', 'Sorcier/Mage', 'Vilain', 'IA fictive'],
    theme: CLASS_THEMES.Fictionnel,
    effects: CLASS_EFFECT_CONFIGS.Fictionnel,
    titleFont: 'bebas',
    cornerStyle: 'rivet',
  },
  Penseur: {
    id: 'Penseur',
    displayName: 'Penseur',
    identity: 'Sagesse · Vision · Réflexion',
    subtypes: ['Philosophe', 'Idéologue', 'Réformateur social', 'Leader non-violent', 'Théologien', 'Visionnaire'],
    theme: CLASS_THEMES.Penseur,
    effects: CLASS_EFFECT_CONFIGS.Penseur,
    titleFont: 'oswald',
    cornerStyle: 'rivet',
  },
  Dirigeant: {
    id: 'Dirigeant',
    displayName: 'Dirigeant',
    identity: 'Pouvoir · Gouvernance · Empire',
    subtypes: ['Roi', 'Empereur', 'Président', 'Dictateur', 'Chef révolutionnaire', 'Tyran', 'Fondateur d\'État'],
    theme: CLASS_THEMES.Dirigeant,
    effects: CLASS_EFFECT_CONFIGS.Dirigeant,
    titleFont: 'bebas',
    cornerStyle: 'rivet',
  },
  Athlète: {
    id: 'Athlète',
    displayName: 'Athlète',
    identity: 'Performance · Compétition · Dépassement',
    subtypes: ['Basketball', 'Football', 'Athlétisme', 'Boxe/MMA', 'Tennis', 'Natation', 'Cyclisme', 'F1', 'Rugby', 'Baseball', 'Golf', 'Sport extrême'],
    theme: CLASS_THEMES.Athlète,
    effects: CLASS_EFFECT_CONFIGS.Athlète,
    titleFont: 'anton',
    cornerStyle: 'rivet',
  },
};
/**
 * Configuration des effets visuels pour chaque classe.
 * Le développeur ne configure que les types d'effets, les couleurs sont appliquées automatiquement
 * depuis CLASS_THEMES.
 */
export const CLASS_EFFECT_CONFIGS: Record<string, EffectConfig> = {
  Guerrier: {
    gridType: 'none',
    compassType: 'none',
    gradientType: 'none',
    blurType: 'none',
    blendMode: 'none',
    hasBlurBorder: false,
    hasLightRay: false,
    hasGlowLine: false,
  },
  Explorateur: {
    gridType: 'coordinates',
    gridSize: 20,
    gridOpacity: 0.06,
    compassType: 'detailed',
    compassPosition: 'bottom-right',
    gradientType: 'bottom',
    gradientOpacity: 0.12,
    blendMode: 'overlay',
  },
  Savant: {
    gridType: 'dots',
    gridSize: 24,
    gridOpacity: 0.08,
    compassType: 'none',
    gradientType: 'bottom',
    gradientOpacity: 0.1,
    blendMode: 'none',
    showBinaryCode: true,
    showCodeSnippet: true,
    showOrbitalCircles: true,
  },
  Artiste: {
    gridType: 'none',
    blurType: 'blur-circles',
    blurCount: 3,
    blendMode: 'none',
  },
  Fictionnel: {
    gridType: 'none',
    blendMode: 'color-dodge',
    hasBlurBorder: true,
  },
  Penseur: {
    gridType: 'dots',
    gridSize: 32,
    gridOpacity: 0.06,
    gradientType: 'top',
    gradientOpacity: 0.1,
    blendMode: 'none',
  },
  Dirigeant: {
    gridType: 'none',
    hasLightRay: true,
    blendMode: 'none',
  },
  Athlète: {
    gridType: 'lines',
    gridSize: 20,
    gridOpacity: 0.4,
    hasGlowLine: true,
    gradientType: 'top',
    gradientOpacity: 0.05,
    blendMode: 'none',
  },
};


// legendGenerator.tsx

/**
 * Interface définissant l'ambiance visuelle complète d'une carte de personnage.
 * 
 * Cette interface regroupe tous les styles et effets visuels appliqués à une carte,
 * dérivés de la charte graphique de la classe (ClassTheme).
 * 
 * @section Typography
 * - fontTitle : Style CSS pour les titres (généralement Oswald, gras, majuscules)
 * - fontData : Style CSS pour les données et statistiques (généralement Montserrat)
 * - fontCitation : Style CSS pour les citations (généralement Playfair Display, italique)
 * 
 * @section Colors & Borders
 * - accentColor : Classe Tailwind pour la couleur d'accentuation du texte
 * - accentBorder : Classe Tailwind pour les bordures d'accentuation
 * - innerBorder : Classe Tailwind pour les bordures intérieures
 * - outerBorder : Classe Tailwind pour les bordures extérieures avec effet de lueur
 * - failleColor : Classe Tailwind pour la couleur des failles/erreurs
 * 
 * @section Backgrounds
 * - themeBgGradient : Classe Tailwind pour le dégradé de fond de la carte
 * - textBoxBgImage : Image de fond pour la zone de texte (optionnel)
 * - textBoxBgBlendMode : Mode de mélange pour l'image de fond (optionnel)
 * 
 * @section Component Styles
 * - nameSectionStyle : Style CSS pour la section du nom du personnage
 * - textBoxStyle : Style CSS pour les zones de texte
 * - portraitBorderStyle : Style CSS pour la bordure du portrait
 * - classBadgeStyle : Style CSS pour le badge de classe
 * - specBoxStyle : Style CSS pour les boîtes de spécifications
 * - citationBoxStyle : Style CSS pour les boîtes de citation
 * - iconContainerStyle : Style CSS pour les conteneurs d'icônes
 * - dividerStyle : Style CSS pour les séparateurs
 * - quoteIconStyle : Style CSS pour les icônes de citation
 * 
 * @section Decorative Effects
 * - cornerStyle : Type de décoration des coins ('rivet' | 'compass' | 'none')
 * - showScratches : Afficher les effets de rayures
 * - showBlood : Afficher les effets de sang
 * - showEmber : Afficher les effets de braises
 * - effectOverlay : Composant React pour l'overlay d'effets spécifiques à la classe
 */
export interface CardAmbiance {
  /** Style CSS pour les titres (Oswald, gras, majuscules) */
  fontTitle: string;
  /** Style CSS pour les données et statistiques (Montserrat) */
  fontData: string;
  /** Style CSS pour les citations (Playfair Display, italique) */
  fontCitation: string;
  /** Classe Tailwind pour la couleur d'accentuation du texte */
  accentColor: string;
  /** Classe Tailwind pour les bordures d'accentuation */
  accentBorder: string;
  /** Classe Tailwind pour les bordures intérieures */
  innerBorder: string;
  /** Classe Tailwind pour les bordures extérieures avec effet de lueur */
  outerBorder: string;
  /** Classe Tailwind pour le dégradé de fond de la carte */
  themeBgGradient: string;
  
  /** Style CSS pour la section du nom du personnage */
  nameSectionStyle: string;
  /** Style CSS pour les zones de texte */
  textBoxStyle: string;
  /** Style CSS pour la bordure du portrait */
  portraitBorderStyle: string;
  /** Style CSS pour le badge de classe */
  classBadgeStyle: string;
  /** Style CSS pour les boîtes de spécifications */
  specBoxStyle: string;
  /** Style CSS pour les boîtes de citation */
  citationBoxStyle: string;
  /** Style CSS pour les conteneurs d'icônes */
  iconContainerStyle: string;
  /** Style CSS pour les séparateurs */
  dividerStyle: string;
  /** Classe Tailwind pour la couleur des failles/erreurs */
  failleColor: string;

  /** Image de fond pour la zone de texte (optionnel) */
  textBoxBgImage?: string;
  /** Mode de mélange pour l'image de fond (optionnel) */
  textBoxBgBlendMode?: string;

  /** Style CSS pour les icônes de citation */
  quoteIconStyle: string;

  /** Type de décoration des coins ('rivet' | 'compass' | 'none') */
  cornerStyle: 'rivet' | 'compass' | 'none';
  /** Afficher les effets de rayures */
  showScratches: boolean;
  /** Afficher les effets de sang */
  showBlood: boolean;
  /** Afficher les effets de braises */
  showEmber: boolean;
  /** Composant React pour l'overlay d'effets spécifiques à la classe */
  effectOverlay: React.ReactNode;
}



// ─── GÉNÉRATEUR D'OVERLAY ───────────────────────────────────────────────────────

/**
 * Fonction génératrice d'overlay basée sur la configuration déclarative.
 * Cette fonction génère automatiquement le JSX des effets visuels en appliquant
 * les couleurs de SimpleClassTheme à la configuration EffectConfig.
 * 
 * @param config - Configuration des effets (EffectConfig)
 * @param theme - Charte graphique simplifiée de la classe (SimpleClassTheme)
 * @returns Composant React avec l'overlay généré
 */
export const generateEffectOverlay = (config: EffectConfig, theme: SimpleClassTheme): React.ReactNode => {
  // Étendre le thème simplifié en thème complet
  const fullTheme = expandClassTheme(theme);
  const elements: React.ReactNode[] = [];
  
  // Grille
  if (config.gridType === 'dots' && config.gridSize) {
    elements.push(
      <div key="grid-dots" className="absolute inset-0 bg-[radial-gradient(var(--grid-color)_1.5px,transparent_1.5px)]" 
           style={{ 
             backgroundSize: `${config.gridSize}px ${config.gridSize}px`, 
             opacity: config.gridOpacity || 0.08,
             '--grid-color': fullTheme.primary 
           } as any} />
    );
  } else if (config.gridType === 'lines' && config.gridSize) {
    elements.push(
      <div key="grid-lines" className="absolute inset-0" 
           style={{ 
             background: `linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)`,
             backgroundSize: `${config.gridSize}px ${config.gridSize}px`,
             opacity: config.gridOpacity || 0.4
           }} />
    );
  } else if (config.gridType === 'coordinates' && config.gridSize) {
    elements.push(
      <svg key="grid-coords" className="absolute inset-0 w-full h-full" 
           style={{ opacity: config.gridOpacity || 0.06 }}
           viewBox="0 0 300 480" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
        {[60, 120, 180, 240, 300, 360, 420].map(y => 
          <line key={`lat-${y}`} x1="0" y1={y} x2="300" y2={y} 
                stroke={fullTheme.primary} strokeWidth="0.5" strokeDasharray="6 4" />
        )}
        {[50, 100, 150, 200, 250].map(x => 
          <line key={`lon-${x}`} x1={x} y1="0" x2={x} y2="480" 
                stroke={fullTheme.primary} strokeWidth="0.5" strokeDasharray="6 4" />
        )}
        <line x1="0" y1="480" x2="300" y2="0" stroke={fullTheme.secondary} strokeWidth="0.4" strokeDasharray="8 6" opacity="0.5" />
        <line x1="0" y1="0" x2="300" y2="480" stroke={fullTheme.secondary} strokeWidth="0.4" strokeDasharray="8 6" opacity="0.3" />
        <line x1="0" y1="240" x2="300" y2="60" stroke={fullTheme.accent} strokeWidth="0.35" strokeDasharray="5 8" opacity="0.4" />
      </svg>
    );
    // Rayons lumineux pour Explorateur
    elements.push(
      <div key="ray-1" className="absolute top-0 left-[18%] w-16 h-56" 
           style={{ 
             background: `linear-gradient(to bottom, ${fullTheme.primary}10, ${fullTheme.secondary}04, transparent)`,
             transform: 'rotate(-10deg)',
             transformOrigin: 'top'
           }} />
    );
    elements.push(
      <div key="ray-2" className="absolute top-0 left-[48%] w-12 h-44" 
           style={{ 
             background: `linear-gradient(to bottom, ${fullTheme.primary}08, ${fullTheme.accent}03, transparent)`,
             transform: 'rotate(5deg)',
             transformOrigin: 'top'
           }} />
    );
    elements.push(
      <div key="ray-3" className="absolute top-0 right-[14%] w-8 h-36" 
           style={{ 
             background: `linear-gradient(to bottom, ${fullTheme.secondary}07, transparent)`,
             transform: 'rotate(12deg)',
             transformOrigin: 'top'
           }} />
    );
  }
  
  // Boussole
  if (config.compassType === 'detailed' && config.compassPosition === 'bottom-right') {
    elements.push(
      <div key="compass" className="absolute bottom-4 right-4 w-24 h-24" style={{ opacity: 0.22 }}>
        <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="48" cy="48" r="44" stroke={fullTheme.primary} strokeWidth="0.6" strokeDasharray="3 2.5" />
          <circle cx="48" cy="48" r="34" stroke={fullTheme.secondary} strokeWidth="0.4" />
          <circle cx="48" cy="48" r="22" stroke={fullTheme.accent} strokeWidth="0.5" />
          {[0,22.5,45,67.5,90,112.5,135,157.5,180,202.5,225,247.5,270,292.5,315,337.5].map((angle, i) => {
            const rad = (angle - 90) * Math.PI / 180;
            const inner = i % 4 === 0 ? 26 : i % 2 === 0 ? 30 : 34;
            return (
              <line key={angle}
                x1={48 + inner * Math.cos(rad)} y1={48 + inner * Math.sin(rad)}
                x2={48 + 42 * Math.cos(rad)}   y2={48 + 42 * Math.sin(rad)}
                stroke={i % 4 === 0 ? fullTheme.secondary : fullTheme.primary}
                strokeWidth={i % 4 === 0 ? "0.8" : "0.4"}
              />
            );
          })}
          <polygon points="48,6 45,48 48,42 51,48" fill={fullTheme.secondary} opacity="0.95" />
          <polygon points="48,90 45,48 48,54 51,48" fill={fullTheme.primary} opacity="0.55" />
          <polygon points="90,48 48,45 54,48 48,51" fill={fullTheme.accent} opacity="0.5" />
          <polygon points="6,48 48,45 42,48 48,51" fill={fullTheme.accent} opacity="0.5" />
          <circle cx="48" cy="48" r="3.5" fill={fullTheme.accent} opacity="0.9" />
          <circle cx="48" cy="48" r="1.5" fill={fullTheme.primary} opacity="0.8" />
          <text x="46" y="4"  fontSize="5" fill={fullTheme.secondary} opacity="0.8" fontFamily="serif">N</text>
          <text x="46" y="95" fontSize="5" fill={fullTheme.primary} opacity="0.6" fontFamily="serif">S</text>
          <text x="88" y="50" fontSize="5" fill={fullTheme.accent} opacity="0.6" fontFamily="serif">E</text>
          <text x="2"  y="50" fontSize="5" fill={fullTheme.accent} opacity="0.6" fontFamily="serif">O</text>
        </svg>
      </div>
    );
  }
  
  // Dégradé de fond
  if (config.gradientType === 'top' && config.gradientOpacity) {
    elements.push(
      <div key="gradient-top" className="absolute top-0 inset-x-0" 
           style={{ 
             height: '40%',
             background: `linear-gradient(to bottom, ${fullTheme.primary}15, transparent)`,
             opacity: config.gradientOpacity
           }} />
    );
  } else if (config.gradientType === 'bottom' && config.gradientOpacity) {
    elements.push(
      <div key="gradient-bottom" className="absolute bottom-0 inset-x-0" 
           style={{ 
             height: '28%',
             background: `linear-gradient(to top, ${fullTheme.primary}10, transparent)`,
             opacity: config.gradientOpacity
           }} />
    );
  }
  
  // Taches floues (Artiste)
  if (config.blurType === 'blur-circles' && config.blurCount) {
    const blurColors = [fullTheme.primary, fullTheme.secondary, fullTheme.accent];
    const positions = [
      { top: '-12px', left: '-12px', size: '40px' },
      { bottom: '-16px', right: '-16px', size: '48px' },
      { top: '33%', left: '25%', size: '32px' }
    ];
    for (let i = 0; i < Math.min(config.blurCount, positions.length); i++) {
      const pos = positions[i];
      const color = blurColors[i % blurColors.length];
      elements.push(
        <div key={`blur-${i}`} 
             className="absolute rounded-full" 
             style={{ 
               ...pos,
               width: pos.size,
               height: pos.size,
               background: `${color}10`,
               filter: 'blur(35px)'
             }} />
      );
    }
  }
  
  // Mode de mélange
  if (config.blendMode === 'overlay') {
    elements.unshift(
      <div key="blend-overlay" className="absolute inset-0" 
           style={{ 
             background: `linear-gradient(to bottom right, ${fullTheme.primary}04, transparent, ${fullTheme.accent}20)`,
             mixBlendMode: 'overlay'
           }} />
    );
  } else if (config.blendMode === 'color-dodge') {
    elements.unshift(
      <div key="blend-color-dodge" className="absolute inset-0" 
           style={{ 
             background: `${fullTheme.primary}05`,
             mixBlendMode: 'color-dodge',
             opacity: 0.5
           }} />
    );
  }
  
  // Bordure floue (Fictionnel)
  if (config.hasBlurBorder) {
    elements.push(
      <div key="blur-border" className="absolute -inset-10" 
           style={{ 
             border: '6px solid',
             borderColor: `${fullTheme.primary}10`,
             filter: 'blur(20px)'
           }} />
    );
  }
  
  // Rayon de lumière (Dirigeant)
  if (config.hasLightRay) {
    elements.push(
      <div key="light-ray" className="absolute top-0 right-4" 
           style={{ 
             width: '28px',
             height: '64px',
             background: `linear-gradient(to bottom, ${fullTheme.primary}10, transparent)`,
             transform: 'rotate(25deg)',
             transformOrigin: 'top'
           }} />
    );
    elements.push(
      <div key="light-circle" className="absolute -bottom-10 -left-10" 
           style={{ 
             width: '36px',
             height: '36px',
             border: `1px solid ${fullTheme.primary}15`,
             borderRadius: '50%',
             opacity: 0.2
           }} />
    );
  }
  
  // Ligne brillante (Athlète)
  if (config.hasGlowLine) {
    elements.push(
      <div key="glow-line" className="absolute bottom-12 left-0 right-0" 
           style={{ 
             height: '0.5px',
             background: `${fullTheme.primary}20`,
             boxShadow: `0 0 6px ${fullTheme.primary}66`
           }} />
    );
  }
  
  // Ombre intérieure pour tous les overlays
  elements.push(
    <div key="inner-shadow" className="absolute inset-0 rounded-[24px]" 
         style={{ 
           boxShadow: 'inset 0 0 50px rgba(23,20,19,0.65)'
         }} />
  );
  
  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-[24px]">
      {elements}
    </div>
  );
};

/**
 * Fonction génératrice d'overlay spécifique pour le portrait de Savant.
 * Cette fonction ajoute des éléments spécifiques au portrait (code binaire, cercles orbitaux).
 * 
 * @param config - Configuration des effets (EffectConfig)
 * @param theme - Charte graphique simplifiée de la classe (SimpleClassTheme)
 * @returns Composant React avec l'overlay de portrait généré
 */
export const generatePortraitOverlay = (config: EffectConfig, theme: SimpleClassTheme): React.ReactNode => {
  // Étendre le thème simplifié en thème complet
  const fullTheme = expandClassTheme(theme);
  const elements: React.ReactNode[] = [];
  
  // Dégradés de fond
  elements.push(
    <div key="portrait-gradient-1" className="absolute inset-0 z-10 pointer-events-none" 
         style={{ 
           background: `linear-gradient(to top, ${fullTheme.background}45, transparent, ${fullTheme.primary}18)`,
           mixBlendMode: 'overlay'
         }} />
  );
  elements.push(
    <div key="portrait-gradient-2" className="absolute inset-0 z-10 pointer-events-none" 
         style={{ 
           background: `${fullTheme.secondary}10`,
           mixBlendMode: 'color'
         }} />
  );
  
  // Cercles orbitaux animés
  if (config.showOrbitalCircles) {
    elements.push(
      <div key="orbital-circles" className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center" 
           style={{ opacity: 0.3, color: fullTheme.secondary }}>
        <svg className="w-40 h-40 animate-[spin_40s_linear_infinite]" viewBox="0 0 100 100" fill="none" stroke="currentColor">
          <circle cx="50" cy="50" r="45" strokeWidth="0.5" strokeDasharray="2 4" />
          <circle cx="50" cy="50" r="38" strokeWidth="0.75" />
          <circle cx="50" cy="50" r="30" strokeWidth="0.5" strokeDasharray="6 3" />
          <path d="M50,5 L50,15 M50,85 L50,95 M5,50 L15,50 M85,50 L95,50" strokeWidth="1" />
        </svg>
      </div>
    );
  }
  
  // Code binaire
  if (config.showBinaryCode) {
    elements.push(
      <div key="binary-code" className="absolute top-2 right-2 z-10 leading-none select-none" 
           style={{ 
             fontSize: '6px',
             fontFamily: 'monospace',
             color: `${fullTheme.accent}35`
           }}>
        <div>011001</div>
        <div>101010</div>
        <div>111001</div>
      </div>
    );
  }
  
  // Snippet de code
  if (config.showCodeSnippet) {
    elements.push(
      <div key="code-snippet" className="absolute bottom-2 left-2 z-10 leading-none select-none" 
           style={{ 
             fontSize: '6px',
             fontFamily: 'monospace',
             color: `${fullTheme.secondary}32`
           }}>
        <div>fn main() {"{"}</div>
        <div className="pl-1">let x = 42;</div>
        <div>{"}"}</div>
      </div>
    );
  }
  
  return <>{elements}</>;
};

// ─── OVERLAY SPÉCIFIQUES PAR CLASSE (GÉNÉRÉS AUTOMATIQUEMENT) ─────────────────────

/**
 * Overlay d'effets visuels pour la classe Explorateur.
 * Généré automatiquement depuis CLASS_EFFECT_CONFIGS et CLASS_THEMES.
 */
export const explorateurEffectOverlay = generateEffectOverlay(CLASS_EFFECT_CONFIGS.Explorateur, CLASS_THEMES.Explorateur);

/**
 * Overlay d'effets visuels pour la classe Savant.
 * Généré automatiquement depuis CLASS_EFFECT_CONFIGS et CLASS_THEMES.
 */
export const savantEffectOverlay = generateEffectOverlay(CLASS_EFFECT_CONFIGS.Savant, CLASS_THEMES.Savant);

/**
 * Overlay spécifique pour le portrait de la classe Savant.
 * Généré automatiquement depuis CLASS_EFFECT_CONFIGS et CLASS_THEMES.
 */
export const savantPortraitOverlay = generatePortraitOverlay(CLASS_EFFECT_CONFIGS.Savant, CLASS_THEMES.Savant);

/**
 * Overlay d'effets visuels pour la classe Artiste.
 * Généré automatiquement depuis CLASS_EFFECT_CONFIGS et CLASS_THEMES.
 */
export const artisteEffectOverlay = generateEffectOverlay(CLASS_EFFECT_CONFIGS.Artiste, CLASS_THEMES.Artiste);

/**
 * Overlay d'effets visuels pour la classe Fictionnel.
 * Généré automatiquement depuis CLASS_EFFECT_CONFIGS et CLASS_THEMES.
 */
export const fictionnelEffectOverlay = generateEffectOverlay(CLASS_EFFECT_CONFIGS.Fictionnel, CLASS_THEMES.Fictionnel);

/**
 * Overlay d'effets visuels pour la classe Penseur.
 * Généré automatiquement depuis CLASS_EFFECT_CONFIGS et CLASS_THEMES.
 */
export const penseurEffectOverlay = generateEffectOverlay(CLASS_EFFECT_CONFIGS.Penseur, CLASS_THEMES.Penseur);

/**
 * Overlay d'effets visuels pour la classe Dirigeant.
 * Généré automatiquement depuis CLASS_EFFECT_CONFIGS et CLASS_THEMES.
 */
export const dirigeantEffectOverlay = generateEffectOverlay(CLASS_EFFECT_CONFIGS.Dirigeant, CLASS_THEMES.Dirigeant);

/**
 * Overlay d'effets visuels pour la classe Athlète.
 * Généré automatiquement depuis CLASS_EFFECT_CONFIGS et CLASS_THEMES.
 */
export const athleteEffectOverlay = generateEffectOverlay(CLASS_EFFECT_CONFIGS.Athlète, CLASS_THEMES.Athlète);

/**
 * Fonction de dérivation de l'ambiance visuelle à partir de la charte graphique d'une classe.
 * 
 * Cette fonction génère un objet CardAmbiance complet en appliquant la charte graphique
 * (SimpleClassTheme) à tous les éléments visuels de la carte. Elle permet de créer une cohérence
 * visuelle automatique entre la palette de couleurs de la classe et le rendu final.
 * 
 * Les couleurs manquantes (accent, background, danger) sont calculées automatiquement.
 * L'overlay d'effets est généré automatiquement depuis CLASS_EFFECT_CONFIGS.
 * 
 * @param className - Le nom de la classe ('Guerrier', 'Explorateur', etc.) pour récupérer la config d'effets
 * @param t - La charte graphique simplifiée (SimpleClassTheme) de la classe à appliquer
 * @param cardBgImage - L'URL de l'image de fond de la carte (optionnel)
 * @param activeTheme - Le thème actif contenant des configurations supplémentaires (optionnel)
 * @param overrides - Objet permettant de surcharger des propriétés spécifiques de l'ambiance (optionnel)
 * @returns Un objet CardAmbiance complet avec tous les styles CSS et effets visuels appliqués
 * 
 * @example
 * // Utilisation simple : juste le nom de la classe et la charte graphique simplifiée
 * const ambiance = deriveAmbiance('Guerrier', CLASS_THEMES.Guerrier, '/bg.jpg', null);
 * 
 * // Avec surcharge manuelle si nécessaire
 * const ambiance = deriveAmbiance('Guerrier', CLASS_THEMES.Guerrier, '/bg.jpg', null, {
 *   showBlood: true
 * });
 */
export const deriveAmbiance = (
  className: string,
  t: SimpleClassTheme,
  cardBgImage: string,
  activeTheme: any,
  overrides: Partial<CardAmbiance> = {}
): CardAmbiance => {
  // Étendre le thème simplifié en thème complet
  const fullTheme = expandClassTheme(t);

  // Récupérer la configuration de la classe pour les options spécifiques
  const classConfig = CLASS_AMBIANCE_CONFIGS[className];

  // Récupérer la configuration d'effets pour cette classe
  const effectConfig = CLASS_EFFECT_CONFIGS[className] || {};

  // Générer l'overlay automatiquement depuis la configuration
  const generatedOverlay = generateEffectOverlay(effectConfig, t);

  // Déterminer la police de titre
  const titleFont = classConfig?.titleFont || 'oswald';
  const fontMap: Record<string, string> = {
    oswald: 'font-oswald font-extrabold tracking-wide uppercase',
    bebas: 'font-bebas tracking-wider uppercase',
    anton: 'font-anton tracking-wide uppercase',
    montserrat: 'font-montserrat font-bold uppercase',
  };

  return {
    fontTitle:    `${fontMap[titleFont]} text-[${fullTheme.primary}]`,
    fontData:     'font-montserrat font-semibold',
    fontCitation: 'font-playfair italic',
    accentColor:  `text-[${fullTheme.primary}]`,
    accentBorder: `border-[${fullTheme.primary}]/80`,
    innerBorder:  `border-[${fullTheme.secondary}]/30`,
    outerBorder:  `border-[${fullTheme.primary}]/85 shadow-[0_0_24px_${fullTheme.primary}70]`,
    themeBgGradient: activeTheme?.bgGradient ?? `from-[${fullTheme.background}]/95 via-[${fullTheme.background}]/90 to-[${fullTheme.background}]/98`,
    nameSectionStyle:    `border-2 border-[${fullTheme.primary}]/80 bg-[${fullTheme.background}]/90 backdrop-blur-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.85)] rounded-xl`,
    textBoxStyle:        `border-2 border-[${fullTheme.secondary}]/80 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.85),0_4px_6px_rgba(0,0,0,0.5)]`,
    portraitBorderStyle: `border-2 border-[${fullTheme.primary}]/60 shadow-[0_0_12px_${fullTheme.primary}59]`,
    classBadgeStyle:     `border-2 border-[${fullTheme.primary}]/80 bg-gradient-to-r from-[${fullTheme.background}] via-[${fullTheme.background}]ee to-[${fullTheme.background}]`,
    specBoxStyle:        `border-2 border-[${fullTheme.secondary}]/60`,
    citationBoxStyle:    `border border-[${fullTheme.secondary}]/50 bg-[${fullTheme.background}]/55`,
    iconContainerStyle:  `border-[${fullTheme.primary}]/80 shadow-[0_0_8px_${fullTheme.primary}66]`,
    dividerStyle:        `via-[${fullTheme.secondary}]/30`,
    failleColor:         `text-[${fullTheme.danger}]`,
    textBoxBgImage:      `linear-gradient(to bottom, ${fullTheme.primary}72, ${fullTheme.background}ec), url(${cardBgImage})`,
    textBoxBgBlendMode:  'multiply',
    quoteIconStyle:      `text-[${fullTheme.accent}] drop-shadow-[0_0_6px_${fullTheme.accent}99]`,
    cornerStyle:   classConfig?.cornerStyle || 'rivet',
    showScratches: classConfig?.showScratches || false,
    showBlood:     classConfig?.showBlood || false,
    showEmber:     classConfig?.showEmber || false,
    effectOverlay: generatedOverlay,
    ...overrides,
  };
};

/**
 * Fonction principale pour obtenir l'ambiance visuelle d'une classe.
 *
 * Cette fonction est le point d'entrée unique pour récupérer la configuration
 * visuelle complète d'une classe de personnage. Elle utilise les configurations
 * déclaratives définies dans CLASS_AMBIANCE_CONFIGS et génère automatiquement
 * tous les styles CSS et effets visuels.
 *
 * @param className - Le nom de la classe ('Guerrier', 'Explorateur', etc.)
 *                    Peut inclure un sous-type (ex: 'Guerrier / Soldat')
 * @param activeTheme - Thème actif pour les couleurs additionnelles (optionnel)
 * @param backgroundImages - Map optionnelle d'images de fond par classe
 * @returns Un objet CardAmbiance complet avec tous les styles et effets
 *
 * @example
 * // Utilisation simple
 * const ambiance = getCardAmbiance('Guerrier');
 *
 * // Avec sous-type
 * const ambiance = getCardAmbiance('Guerrier / Soldat');
 *
 * // Avec image de fond personnalisée
 * const ambiance = getCardAmbiance('Explorateur', null, { Explorateur: '/custom-bg.jpg' });
 */
export const getCardAmbianceV2 = (
  className: string,
  activeTheme?: any,
  backgroundImages?: Record<string, string>
): CardAmbiance => {
  // Extraire la classe principale (ex: 'Guerrier / Soldat' -> 'Guerrier')
  const mainClass = className.split('/')[0].trim();

  // Récupérer la configuration de la classe
  const config = CLASS_AMBIANCE_CONFIGS[mainClass];

  if (!config) {
    // Fallback vers Guerrier si la classe n'existe pas
    console.warn(`Class "${mainClass}" not found in CLASS_AMBIANCE_CONFIGS, falling back to Guerrier`);
    return getCardAmbianceV2('Guerrier', activeTheme, backgroundImages);
  }

  // Récupérer l'image de fond
  const bgImage = backgroundImages?.[mainClass] || '';

  // Mapper les polices
  const fontMap: Record<string, string> = {
    oswald: 'font-oswald font-extrabold tracking-wide uppercase',
    bebas: 'font-bebas tracking-wider uppercase',
    anton: 'font-anton tracking-wide uppercase',
    montserrat: 'font-montserrat font-bold uppercase',
  };

  // Construire les overrides
  const overrides: Partial<CardAmbiance> = {
    cornerStyle: config.cornerStyle || 'rivet',
    showScratches: config.showScratches || false,
    showBlood: config.showBlood || false,
    showEmber: config.showEmber || false,
  };

  // Appliquer la police de titre personnalisée
  if (config.titleFont) {
    const fontClass = fontMap[config.titleFont];
    if (fontClass) {
      overrides.fontTitle = `${fontClass} text-[${expandClassTheme(config.theme).primary}]`;
    }
  }

  // Fusionner avec les overrides additionnels de la config
  if (config.overrides) {
    Object.assign(overrides, config.overrides);
  }

  // Générer l'ambiance
  return deriveAmbiance(mainClass, config.theme, bgImage, activeTheme, overrides);
};

// ─── BACKWARD COMPATIBILITY: Export guerrierEffectOverlay ────────────────────────

/**
 * Overlay d'effets visuels pour la classe Guerrier.
 * Généré automatiquement depuis CLASS_EFFECT_CONFIGS et CLASS_THEMES.
 * La classe Guerrier n'utilise pas d'overlay spécifique.
 */
export const guerrierEffectOverlay = generateEffectOverlay(CLASS_EFFECT_CONFIGS.Guerrier, CLASS_THEMES.Guerrier);