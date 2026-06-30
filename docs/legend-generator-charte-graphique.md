# Charte Graphique Des Classes

Ce document formalise la logique visuelle de `LegendGenerator`.

La classe `Guerrier` sert de reference documentaire: c'est le modele qui explique comment une charte graphique est injectee dans la carte. Les autres classes doivent conserver la meme structure semantique, puis changer la palette, la matiere et les effets selon leur univers.

## Principe

Une charte de classe ne doit pas etre pensee comme une simple liste de couleurs. Elle pilote cinq couches visuelles:

1. Typographies
2. Accents chromatiques
3. Surfaces d'interface
4. Fonds et medias
5. Effets immersifs

Dans le code, ces couches sont portees par l'interface `CardAmbiance` et consommees dans `getCardAmbiance()`.

## Guerrier: Reference

`Guerrier` documente la maniere d'utiliser chaque role visuel.

- Typographies
  - `fontTitle`: impact heroique, uppercase, lecture immediate.
  - `fontData`: lisibilite des stats et des blocs d'information.
  - `fontCitation`: tonalite epique et dramatique.
- Accents chromatiques
  - `accentColor`: couleur d'appel principale.
  - `accentBorder`: bordure d'accent de la carte.
  - `innerBorder`: filet secondaire de profondeur.
  - `outerBorder`: silhouette globale et puissance percue.
  - `dividerStyle`: respiration entre les sections.
  - `failleColor`: signal visuel de danger et de vulnerabilite.
- Surfaces d'interface
  - `nameSectionStyle`: bloc d'identite du personnage.
  - `textBoxStyle`: boite des contenus narratifs.
  - `portraitBorderStyle`: traitement du portrait.
  - `classBadgeStyle`: badge de classe.
  - `specBoxStyle`: boites de specialites.
  - `citationBoxStyle`: traitement de la citation.
  - `iconContainerStyle`: capsule de l'icone de classe.
- Fonds et medias
  - `themeBgGradient`: ambiance generale de la carte.
  - `textBoxBgImage`: matiere de la zone narrative.
  - `textBoxBgBlendMode`: integration de la texture et du texte.
  - `cardBgImage`: fond iconographique principal.
  - `quoteIconStyle`: accent du pictogramme de citation.
- Effets immersifs
  - `cornerStyle`: style des angles.
  - `showScratches`: usure ou violence materielle.
  - `showBlood`: dramatisation organique.
  - `showEmber`: chaleur, combat, chaos.
  - `effectOverlay`: couche d'effets plein format.
  - `portraitOverlay`: couche d'effets sur le portrait.

## Regle D'Application Aux Autres Classes

Chaque classe doit reprendre la meme structure semantique que `Guerrier`.

- On ne change pas les roles.
- On change l'expression visuelle de ces roles.
- Une propriete doit toujours repondre a une intention claire.

Exemple:

- `accentColor` n'est pas "une jolie couleur".
- `accentColor` est la couleur qui porte la hierarchie visuelle principale.

## Application Par Classe

### Explorateur

- Intentions: navigation, horizon, cartes, reperes.
- Palette: verts celadon, teal, bleus de carte.
- Effets attendus: grilles, boussole, lignes de latitude/longitude.

### Savant

- Intentions: laboratoire, precision, interface, innovation.
- Palette validee:
  - `--sky-blue-light: #8ecae6ff;`
  - `--blue-green: #219ebcff;`
  - `--deep-space-blue: #023047ff;`
  - `--amber-flame: #ffb703ff;`
  - `--princeton-orange: #fb8500ff;`
- Traduction semantique recommandee:
  - `fontTitle`, `portraitBorderStyle`, `iconContainerStyle`: `sky-blue-light`
  - `accentColor`, `accentBorder`, `dividerStyle`, grille technique: `blue-green`
  - `themeBgGradient`, `nameSectionStyle`, `textBoxStyle`: `deep-space-blue`
  - `quoteIconStyle`, accents lumineux, details HUD: `amber-flame`
  - `failleColor`, contrepoints chauds, reflets secondaires: `princeton-orange`

### Artiste

- Intentions: scene, creation, geste, lumiere.
- Palette: fuchsia, violet, touches or.
- Effets attendus: halos, diffusion, energie picturale.

### Fictionnel

- Intentions: surnaturel, cosmique, effets speciaux.
- Palette: violets, indigo, contrastes froids.
- Effets attendus: distorsion, aura, portail, glow.

### Penseur

- Intentions: sagesse, heritage, manuscrits.
- Palette: ambres, bronze, pierre, ivoire.
- Effets attendus: trame papier, lumiere douce, patine ancienne.

### Dirigeant

- Intentions: autorite, ceremoniel, puissance.
- Palette: or, bleu sombre, nobles contrastes.
- Effets attendus: faisceaux, sceaux, monumentalite.

### Athlete

- Intentions: performance, vitesse, tension.
- Palette: contrastes sombres, verts vifs, reflets tranches.
- Effets attendus: lignes de mouvement, spotlight, grille technique.

## Checklist Quand On Cree Ou Modifie Une Classe

- La typographie raconte-t-elle bien le role de la classe ?
- Les accents servent-ils la hierarchie visuelle ?
- Les surfaces sont-elles coherentes entre header, portrait, badges et citations ?
- Le fond et la texture soutiennent-ils le recit sans nuire a la lisibilite ?
- Les overlays et effets renforcent-ils l'univers sans polluer la carte ?
- La classe respecte-t-elle les memes roles semantiques que `Guerrier` ?

