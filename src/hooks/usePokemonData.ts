import { useEffect, useState } from 'react';
import type { PokemonTransaction } from '../types/pokemon';

const KEY = 'cashflow-pokemon-data';

export function usePokemonData() {
  const [pokemonTransactions, setPokemonTransactions] = useState<PokemonTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(pokemonTransactions));
  }, [pokemonTransactions]);

  return { pokemonTransactions, setPokemonTransactions };
}
