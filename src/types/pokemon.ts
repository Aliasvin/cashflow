export type PokemonTransactionType = 'purchase' | 'sale';
export type PokemonPurchaseType = 'single_cards' | 'sealed' | 'boosters' | 'accessories' | 'grading' | 'other';

export interface PokemonTransaction {
  id: string;
  type: PokemonTransactionType;
  amount: number;
  description: string;
  date: string;
  purchaseType: PokemonPurchaseType;
  shop?: string;
  note?: string;
  accountId: string;
  linkedTransactionId: string;
}
