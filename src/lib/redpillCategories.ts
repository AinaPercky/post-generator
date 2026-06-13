// RedPill Post Categories Configuration
export interface RedPillCategory {
  id: string;
  name: string;
  description: string;
  template: 'hero' | 'split' | 'card' | 'quote' | 'warning' | 'versus';
  keywords: string[];
  typicalExample: string;
  defaultTitle: string;
}

export const RED_PILL_CATEGORIES: RedPillCategory[] = [
  {
    id: 'reminder',
    name: 'Piqûre de rappel',
    description: 'Analyse factuelle, scientifique et comportementale. Présenter des données chiffrées, des statistiques, des résultats de sondages ou des phénomènes sociologiques/psychologiques pour décoder le monde réel.',
    template: 'card',
    keywords: ['Statistiques', 'hypergamie', 'sociologie', 'sondage', 'psychologie', 'chiffres'],
    typicalExample: 'L\'évolution du taux de divorce initié à 75% par les femmes ou les dynamiques de sélection sur les applications de rencontre.',
    defaultTitle: 'PIQÛRE DE RAPPEL'
  },
  {
    id: 'error-of',
    name: 'L\'erreur de...',
    description: 'Étude de cas sur des figures masculines (réelles ou fiction). Analyser la faille stratégique ou l\'angle mort d\'un personnage historique, scientifique ou de la pop culture face à sa partenaire.',
    template: 'hero',
    keywords: ['Piédestal', 'sacrifice', 'aveuglement', 'soumission', 'trahison', 'compromission'],
    typicalExample: 'Évariste Galois : Perdre la vie à 20 ans dans un duel absurde par obsession pour Stéphanie du Motel.',
    defaultTitle: 'L\'ERREUR DE...'
  },
  {
    id: 'harsh-truth',
    name: 'La dure vérité',
    description: 'Guide stratégique, conseils concrets et préventions. Délivrer des directives claires sur ce qu\'il faut faire et ne pas faire. Prévenir l\'homme contre les pièges de la psychologie féminine et protéger son cadre.',
    template: 'warning',
    keywords: ['Mission', 'autorité', 'détachement', 'cadre', 'discipline', 'protection'],
    typicalExample: 'Cesser de chercher la validation par l\'argent ou les sacrifices, et baser sa puissance uniquement sur ses propres objectifs de vie.',
    defaultTitle: 'THE HARSH TRUTH'
  },
  {
    id: 'citation',
    name: 'Citation / Parole',
    description: 'Citation percutante issue d\'un film, série, manga, œuvre littéraire, proverbe, verset biblique ou coranique, ou d\'un philosophe. Mentionner l\'auteur et sa spécificité pour ancrer la vérité dans une source reconnue.',
    template: 'quote',
    keywords: ['Citation', 'sagesse', 'vérité', 'philosophie', 'verset', 'proverbe', 'parole', 'personnage'],
    typicalExample: 'Rock Lee (Naruto) : "Si on ne peut pas faire la magie, on compense par l\'effort." ou Luc 1:25 ou Karl Marx philosophe.',
    defaultTitle: 'CITATION'
  }
];

export const getCategoryById = (id: string): RedPillCategory | undefined => {
  return RED_PILL_CATEGORIES.find(cat => cat.id === id);
};

export const getCategoryByTemplate = (template: string): RedPillCategory | undefined => {
  return RED_PILL_CATEGORIES.find(cat => cat.template === template);
};
