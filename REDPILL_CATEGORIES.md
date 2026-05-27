# RedPill Post Categories

## Overview

Les posts RedPill sont organisés en 3 catégories principales, chacune avec son template, ses keywords, et son approche spécifique.

---

## 1. Piqûre de rappel

**Template:** `card`

### Description

Analyse factuelle, scientifique et comportementale. Présenter des données chiffrées, des statistiques, des résultats de sondages ou des phénomènes sociologiques/psychologiques pour décoder le monde réel.

### Mots-clés

- Statistiques
- Hypergamie
- Sociologie
- Sondage
- Psychologie
- Chiffres

### Exemple Typique

L'évolution du taux de divorce initié à 75% par les femmes ou les dynamiques de sélection sur les applications de rencontre.

### Caractéristiques du Template Card

- Format compact et lisible
- Ideal pour présenter des données/statistiques
- Impact visuel fort sur les données chiffrées

---

## 2. L'erreur de...

**Template:** `hero`

### Description

Étude de cas sur des figures masculines (réelles ou fiction). Analyser la faille stratégique ou l'angle mort d'un personnage historique, scientifique ou de la pop culture face à sa partenaire.

### Mots-clés

- Piédestal
- Sacrifice
- Aveuglement
- Soumission
- Trahison
- Compromission

### Exemple Typique

Évariste Galois : Perdre la vie à 20 ans dans un duel absurde par obsession pour Stéphanie du Motel.

### Caractéristiques du Template Hero

- Mise en avant dramatique d'une figure historique/culturelle
- Narration impactante de son angle mort
- Forte présence visuelle avec l'image en arrière-plan

---

## 3. La dure vérité

**Template:** `warning`

### Description

Guide stratégique, conseils concrets et préventions. Délivrer des directives claires sur ce qu'il faut faire et ne pas faire. Prévenir l'homme contre les pièges de la psychologie féminine et protéger son cadre.

### Mots-clés

- Mission
- Autorité
- Détachement
- Cadre
- Discipline
- Protection

### Exemple Typique

Cesser de chercher la validation par l'argent ou les sacrifices, et baser sa puissance uniquement sur ses propres objectifs de vie.

### Caractéristiques du Template Warning

- Design d'alerte visuelle (warning colors)
- Mise en avant de conseils/directives claires
- Ton autoritaire et protecteur

---

## Integration dans l'Application

### Sélection de Catégorie

La sélection de catégorie est automatique :

1. L'utilisateur choisit une catégorie dans le dropdown "Category"
2. Le template correspondant se met à jour automatiquement
3. La description et les keywords de la catégorie sont affichés en temps réel

### Metadata Sauvegardée

Chaque post sauvegardé inclut dans ses metadata :

```typescript
{
  categoryId: 'reminder' | 'error-of' | 'harsh-truth',
  template: 'hero' | 'split' | 'card' | 'quote' | 'warning' | 'versus',
  content: string,
  punchline: string,
  // ... autres propriétés
}
```

### Export

Lors de l'export en texte, la catégorie est incluse :

```
#1 Post Title
Category: Piqûre de rappel
Content: ...
Punchline: ...
Template: card
```
