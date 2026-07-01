# Charte Graphique Des Classes — LegendGenerator v2

Ce document formalise l'architecture du système de design pour `LegendGenerator`. La version 2 introduit une architecture **scalable**, **déclarative** et **maintenable**.

---

## Sommaire

1. [Architecture du Système](#1-architecture-du-système)
2. [Palettes de Couleurs](#2-palettes-de-couleurs)
3. [Configuration des Effets](#3-configuration-des-effets)
4. [Configuration Complète par Classe](#4-configuration-complète-par-classe)
5. [Utilisation](#5-utilisation)
6. [Guide de Migration](#6-guide-de-migration)
7. [Maintenance et Extension](#7-maintenance-et-extension)
8. [Référence des Classes](#8-référence-des-classes)

---

## 1. Architecture du Système

### 1.1 Principe de Séparation des Concerns

Le système est divisé en **4 couches distinctes** :

```
┌─────────────────────────────────────────────────────────────────┐
│  COUCHE 4: getCardAmbianceV2()                                   │
│  → Point d'entrée unique, API simple pour les composants       │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│  COUCHE 3: CLASS_AMBIANCE_CONFIGS                               │
│  → Configuration déclarative par classe (thème + effets + etc) │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│  COUCHE 2: CLASS_THEMES + CLASS_EFFECT_CONFIGS                  │
│  → Palettes de couleurs (SimpleClassTheme) + Effets (EffectConfig)│
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│  COUCHE 1: Utilitaires de calcul                                │
│  → expandClassTheme, generateEffectOverlay, hexToHsl, etc.      │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Avantages de cette Architecture

| Avantage | Description |
|----------|-------------|
| **Scalabilité** | Ajouter une classe = 1 entrée dans `CLASS_AMBIANCE_CONFIGS` |
| **Maintenabilité** | Chaque couche a une responsabilité unique |
| **Lisibilité** | Configuration déclarative, pas de logique dispersée |
| **Cohérence** | Couleurs calculées automatiquement depuis `primary`/`secondary` |
| **Extensibilité** | Les effets sont générés dynamiquement depuis la configuration |

### 1.3 Les 5 Couches Visuelles d'une Carte

Une charte de classe pilote **cinq couches visuelles** :

1. **Typographies** → `fontTitle`, `fontData`, `fontCitation`
2. **Accents chromatiques** → `accentColor`, `accentBorder`, `outerBorder`, `failleColor`
3. **Surfaces d'interface** → `nameSectionStyle`, `textBoxStyle`, `portraitBorderStyle`, etc.
4. **Fonds et médias** → `themeBgGradient`, `textBoxBgImage`, images de fond
5. **Effets immersifs** → `effectOverlay`, `cornerStyle`, `showScratches`, `showBlood`, `showEmber`

---

## 2. Palettes de Couleurs

### 2.1 Structure SimpleClassTheme

La configuration minimale pour une classe nécessite uniquement 2 couleurs :

```typescript
interface SimpleClassTheme {
  primary:    string;  // Couleur dominante
  secondary:  string;  // Variante plus claire/froide
  accent?:     string;  // (optionnel) Couleur d'accentuation
  background?: string;  // (optionnel) Fond sombre
  danger?:     string;  // (optionnel) Couleur d'alerte
}
```

### 2.2 Calcul Automatique des Couleurs

Les couleurs `accent`, `background` et `danger` sont **calculées automatiquement** si non fournies :

```typescript
// Entrée minimale
const minimal = { primary: '#ff0000', secondary: '#8a0303' };

// Sortie après expandClassTheme()
const full = expandClassTheme(minimal);
// {
//   primary: '#ff0000',
//   secondary: '#8a0303',
//   accent: '#00ffff',     ← Couleur complémentaire (180° sur le cercle chromatique)
//   background: '#170014', ← primary assombri de 85%
//   danger: '#ff0000'      ← primary car c'est déjà du rouge
// }
```

### 2.3 Tableau des 8 Classes

| Classe | Primary | Secondary | Accent | Background | Identité |
|--------|---------|-----------|--------|------------|----------|
| **Guerrier** | `#ff0000` | `#8a0303` | `#f59e0b` | `#171413` | Combat · Stratégie · Domination |
| **Explorateur** | `#348aa7` | `#bce784` | `#5dd39e` | `#171413` | Découverte · Aventure · Liberté |
| **Savant** | `#00ffff` | `#ffff33` | `#ffcc33` | `#023047` | Logique · Innovation · Découverte |
| **Artiste** | `#820263` | `#fb8b24` | `#d90368` | `#0a0008` | Créativité · Expression · Culture |
| **Fictionnel** | `#7776bc` | `#fffbdb` | `#cdc7e5` | `#0d0a1a` | Imaginaire · Pouvoir · Univers |
| **Penseur** | `#d97706` | `#FFFF82` | `#A16207` | `#1c1917` | Sagesse · Vision · Réflexion |
| **Dirigeant** | `#ffd500` | `#5c0099` | `#fdc500` | `#0a0a0a` | Pouvoir · Gouvernance · Empire |
| **Athlète** | `#00A86B` | `#6C4E2D` | `#2bc016` | `#0a0f0d` | Performance · Compétition |

---

## 3. Configuration des Effets

### 3.1 Interface EffectConfig

```typescript
interface EffectConfig {
  // Type de grille
  gridType?: 'none' | 'dots' | 'lines' | 'coordinates';
  gridSize?: number;        // Taille en pixels
  gridOpacity?: number;      // 0-1

  // Boussole (pour Explorateur)
  compassType?: 'none' | 'simple' | 'detailed';
  compassPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

  // Dégradé de fond
  gradientType?: 'none' | 'top' | 'bottom' | 'radial';
  gradientOpacity?: number;

  // Taches floues (pour Artiste)
  blurType?: 'none' | 'blur-circles';
  blurCount?: number;

  // Mode de mélange CSS
  blendMode?: 'none' | 'overlay' | 'color-dodge' | 'multiply';

  // Effets spéciaux
  hasBlurBorder?: boolean;       // Fictionnel
  hasLightRay?: boolean;        // Dirigeant
  hasGlowLine?: boolean;        // Athlète
  showBinaryCode?: boolean;     // Savant
  showCodeSnippet?: boolean;    // Savant
  showOrbitalCircles?: boolean; // Savant
}
```

### 3.2 Matrice des Effets par Classe

| Effet | Guerrier | Explorateur | Savant | Artiste | Fictionnel | Penseur | Dirigeant | Athlète |
|-------|----------|-------------|--------|---------|------------|---------|-----------|---------|
| Grille `coordinates` | - | ✅ | - | - | - | - | - | - |
| Grille `dots` | - | - | ✅ | - | - | ✅ | - | - |
| Grille `lines` | - | - | - | - | - | - | - | ✅ |
| Boussole `detailed` | - | ✅ | - | - | - | - | - | - |
| Blur circles | - | - | - | ✅ | - | - | - | - |
| Blend overlay | - | ✅ | - | - | - | - | - | - |
| Blend color-dodge | - | - | - | - | ✅ | - | - | - |
| Blur border | - | - | - | - | ✅ | - | - | - |
| Light ray | - | - | - | - | - | - | ✅ | - |
| Glow line | - | - | - | - | - | - | - | ✅ |
| Binary/Code | - | - | ✅ | - | - | - | - | - |
| Scratches | ✅ | - | - | - | - | - | - | - |
| Blood/Embers | ✅ | - | - | - | - | - | - | - |

---

## 4. Configuration Complète par Classe

### 4.1 Interface ClassAmbianceConfig

```typescript
interface ClassAmbianceConfig {
  id: string;              // Identifiant unique
  displayName: string;     // Nom d'affichage
  identity: string;        // Description de l'identité
  subtypes: string[];      // Sous-types disponibles
  theme: SimpleClassTheme; // Palette de couleurs
  effects: EffectConfig;   // Configuration des effets
  backgroundImage?: string;
  titleFont?: 'oswald' | 'bebas' | 'anton' | 'montserrat';
  cornerStyle?: 'rivet' | 'compass' | 'none';
  showScratches?: boolean;
  showBlood?: boolean;
  showEmber?: boolean;
  overrides?: Partial<CardAmbiance>;  // Surcharges manuelles
}
```

### 4.2 Exemple : Configuration Guerrier

```typescript
CLASS_AMBIANCE_CONFIGS.Guerrier = {
  id: 'Guerrier',
  displayName: 'Guerrier',
  identity: 'Combat · Stratégie · Domination physique',
  subtypes: [
    'Soldat', 'Stratège', 'Conquérant', 'Chef de guerre',
    'Héros mythologique', 'Anti-héros'
  ],
  theme: {
    primary: '#ff0000',
    secondary: '#8a0303',
    accent: '#f59e0b',      // Or pour les accents
    background: '#171413',
    danger: '#ff0000'
  },
  effects: {
    gridType: 'none',
    compassType: 'none',
    // Pas d'effets visuels complexes
  },
  titleFont: 'bebas',       // Police impact
  cornerStyle: 'rivet',     // Rivets métalliques
  showScratches: true,      // Rayures de combat
  showBlood: true,          // Effets de sang
  showEmber: true,          // Braises animées
};
```

---

## 5. Utilisation

### 5.1 Import Principal

```typescript
import {
  getCardAmbianceV2,
  CLASS_THEMES,
  CLASS_AMBIANCE_CONFIGS,
  CLASS_EFFECT_CONFIGS,
  expandClassTheme,
} from './lib/legendGeneratorLib';
```

### 5.2 Obtenir l'Ambiance d'une Classe

```typescript
// Utilisation simple
const ambiance = getCardAmbianceV2('Guerrier');

// Avec image de fond personnalisée
const ambiance = getCardAmbianceV2('Explorateur', null, {
  Explorateur: '/custom-bg.jpg'
});

// Avec thème actif (pour WarriorCard.theme)
const ambiance = getCardAmbianceV2('Guerrier', themesConfig.gold);
```

### 5.3 Utilisation dans un Composant

```typescript
function LegendCard({ classe }: { classe: string }) {
  const ambiance = getCardAmbianceV2(classe);

  return (
    <div className={`${ambiance.themeBgGradient} ${ambiance.outerBorder}`}>
      <div className={ambiance.nameSectionStyle}>
        <h1 className={ambiance.fontTitle}>Nom du Personnage</h1>
      </div>
      {ambiance.effectOverlay}
    </div>
  );
}
```

---

## 6. Guide de Migration

### 6.1 Comparaison Avant/Après

**Avant (switch case de 300+ lignes) :**
```typescript
export const getCardAmbiance = (classeStr: string, activeTheme: any) => {
  switch (mainClass) {
    case 'Explorateur':
      return {
        fontTitle: "font-oswald font-extrabold uppercase text-[#bce784]",
        // ... 20+ propriétés manuellement définies
      };
    case 'Savant':
      return { /* ... 20+ propriétés */ };
    // ... 6 autres cases
  }
};
```

**Après (configuration déclarative) :**
```typescript
// Classe définie de manière déclarative
CLASS_AMBIANCE_CONFIGS.Explorateur = {
  theme: { primary: '#348aa7', secondary: '#bce784' },
  titleFont: 'oswald',
  effects: { gridType: 'coordinates', compassType: 'detailed' }
};

// Fonction unique
const ambiance = getCardAmbianceV2('Explorateur');
```

### 6.2 Tableau de Correspondance

| Ancien Style | Nouveau Style | Source |
|--------------|---------------|--------|
| `fontTitle: "font-oswald text-[#bce784]"` | Généré automatiquement | `config.titleFont` + `config.theme.primary` |
| `accentColor: "text-[#bce784]"` | Généré automatiquement | `config.theme.primary` |
| `showBlood: true` (en dur dans le switch) | Déclaratif | `config.showBlood` |
| `effectOverlay: <JSX complexe>` | Généré automatiquement | `CLASS_EFFECT_CONFIGS` |

---

## 7. Maintenance et Extension

### 7.1 Modifier les Couleurs d'une Classe

Modifier uniquement `CLASS_THEMES` :

```typescript
CLASS_THEMES.Guerrier.primary = '#ff3333';  // Changement immédiat
```

### 7.2 Modifier les Effets Visuels

Modifier `CLASS_EFFECT_CONFIGS` :

```typescript
CLASS_EFFECT_CONFIGS.Explorateur.gridOpacity = 0.08;
```

### 7.3 Ajouter une Nouvelle Classe

**Étape 1 :** Ajouter la palette
```typescript
CLASS_THEMES.Mythique = {
  primary: '#9b59b6',
  secondary: '#3498db',
};
```

**Étape 2 :** Ajouter les effets
```typescript
CLASS_EFFECT_CONFIGS.Mythique = {
  gridType: 'dots',
  gridSize: 16,
};
```

**Étape 3 :** Ajouter la configuration complète
```typescript
CLASS_AMBIANCE_CONFIGS.Mythique = {
  id: 'Mythique',
  displayName: 'Mythique',
  identity: 'Légende · Mystère · Pouvoir ancien',
  subtypes: ['Demi-dieu', 'Créature légendaire', 'Esprit'],
  theme: CLASS_THEMES.Mythique,
  effects: CLASS_EFFECT_CONFIGS.Mythique,
  titleFont: 'bebas',
};
```

**C'est tout !** La nouvelle classe est disponible via `getCardAmbianceV2('Mythique')`.

---

## 8. Référence des Classes

### 8.1 Guerrier

| Propriété | Valeur | Description |
|----------|--------|-------------|
| `primary` | `#ff0000` | Rouge sang - agressivité |
| `secondary` | `#8a0303` | Rouge sombre - profondeur |
| `accent` | `#f59e0b` | Or - points d'intérêt |
| `titleFont` | `bebas` | Impact héroïque |
| `cornerStyle` | `rivet` | Rivets métalliques |
| `showScratches` | `true` | Usure de combat |
| `showBlood` | `true` | Dramatisation |
| `showEmber` | `true` | Braises animées |

**Sous-types :** Soldat, Stratège, Conquérant, Chef de guerre, Héros mythologique, Anti-héros

### 8.2 Explorateur

| Propriété | Valeur | Description |
|----------|--------|-------------|
| `primary` | `#348aa7` | Bleu teal - navigation |
| `secondary` | `#bce784` | Vert céladon - nature |
| `accent` | `#5dd39e` | Vert clair - horizon |
| `titleFont` | `oswald` | Solidité technique |
| `cornerStyle` | `compass` | Rose des vents |

**Effets spéciaux :**
- Grille `coordinates` : lignes de latitude/longitude
- Boussole `detailed` : rose des vents en bas à droite
- Blend `overlay` : mélange cartographique

**Sous-types :** Navigateur, Cartographe, Terrestre, Maritime, Spatial, Numérique, Pionnier

### 8.3 Savant

| Propriété | Valeur | Description |
|----------|--------|-------------|
| `primary` | `#00ffff` | Cyan - innovation |
| `secondary` | `#ffff33` | Jaune - découverte |
| `accent` | `#ffcc33` | Ambre - lumière |
| `titleFont` | `oswald` | Précision scientifique |

**Effets spéciaux :**
- Grille `dots` : structure molleculaire
- `showBinaryCode` : code binaire en overlay
- `showCodeSnippet` : snippet de code Rust
- `showOrbitalCircles` : cercles orbitaux animés sur le portrait

**Sous-types :** Physicien, Mathématicien, Ingénieur, Inventeur, Économiste, Informaticien

### 8.4 Artiste

| Propriété | Valeur | Description |
|----------|--------|-------------|
| `primary` | `#820263` | Fuchsia - créativité |
| `secondary` | `#fb8b24` | Orange - passion |
| `accent` | `#d90368` | Rose néon -_expression |
| `titleFont` | `anton` | Impact artistique |

**Effets spéciaux :**
- `blurType: 'blur-circles'` : halos colorés diffus
- 3 taches floues aux couleurs de la palette

**Sous-types :** Peintre, Sculpteur, Musicien, Chanteur, Acteur, Écrivain, Cinéaste, Danseur, Architecte

### 8.5 Fictionnel

| Propriété | Valeur | Description |
|----------|--------|-------------|
| `primary` | `#7776bc` | Violet - surnaturel |
| `secondary` | `#fffbdb` | Ivoire - énergie cosmique |
| `accent` | `#cdc7e5` | Mauve clair - Aura |
| `titleFont` | `bebas` | Force narrative |

**Effets spéciaux :**
- `blendMode: 'color-dodge'` : effet de lueur cosmique
- `hasBlurBorder` : bordure floue violette

**Sous-types :** Super-héros, Anti-héros, Créature, Guerrier fictif, Entité cosmique, Sorcier/Mage, Vilain, IA fictive

### 8.6 Penseur

| Propriété | Valeur | Description |
|----------|--------|-------------|
| `primary` | `#d97706` | Ambre - sagesse |
| `secondary` | `#FFFF82` | Jaune clair - illumination |
| `accent` | `#A16207` | Bronze - héritage |
| `titleFont` | `oswald` | Solidité intellectuelle |

**Effets spéciaux :**
- Grille `dots` : texture de papier ancien
- Dégradé `top` : lumière douce descendante

**Sous-types :** Philosophe, Idéologue, Réformateur social, Leader non-violent, Théologien, Visionnaire

### 8.7 Dirigeant

| Propriété | Valeur | Description |
|----------|--------|-------------|
| `primary` | `#ffd500` | Or - autorité |
| `secondary` | `#5c0099` | Violet royal - pouvoir |
| `accent` | `#fdc500` | Or clair - noblesse |
| `titleFont` | `bebas` | Solennité |

**Effets spéciaux :**
- `hasLightRay` : rayon de lumière dorée
- Cercle décoratif en bas à gauche

**Sous-types :** Roi, Empereur, Président, Dictateur, Chef révolutionnaire, Tyran, Fondateur d'État

### 8.8 Athlète

| Propriété | Valeur | Description |
|----------|--------|-------------|
| `primary` | `#00A86B` | Vert émeraude - performance |
| `secondary` | `#6C4E2D` | Brun - cuir/sport |
| `accent` | `#2bc016` | Vert néon - énergie |
| `titleFont` | `anton` | Dynamisme |

**Effets spéciaux :**
- Grille `lines` : lignes de mouvement
- `hasGlowLine` : ligne brillante en bas
- Dégradé `top` : éclairage de stade

**Sous-types :** Basketball, Football, Athlétisme, Boxe/MMA, Tennis, Natation, Cyclisme, F1, Rugby, Baseball, Golf, Sport extrême

---

## Checklist de Création/Modification

- [ ] La typographie raconte-t-elle le rôle de la classe ?
- [ ] Les accents servent-ils la hiérarchie visuelle ?
- [ ] Les surfaces sont-elles cohérentes (header, portrait, badges) ?
- [ ] Le fond soutient-il le récit sans nuire à la lisibilité ?
- [ ] Les effets renforcent-ils l'univers sans polluer ?
- [ ] La classe respecte-t-elle les mêmes rôles sémantiques que Guerrier ?

---

*Documentation mise à jour le 01/07/2026 — Version 2.0*
