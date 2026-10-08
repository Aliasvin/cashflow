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
  assetId?: string;
}

export interface PokemonValuePoint {
  id: string;
  date: string;
  value: number;
}

export interface PokemonAsset {
  id: string;
  name: string;
  purchasePrice: number;
  purchaseDate: string;
  note?: string;
  transactionId?: string;
  valueHistory: PokemonValuePoint[];
  status?: 'owned' | 'sold';
  soldPrice?: number;
  soldDate?: string;
  saleTransactionId?: string;
}
