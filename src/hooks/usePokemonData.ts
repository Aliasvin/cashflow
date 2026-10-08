import { useEffect, useState } from 'react';
import type { PokemonAsset, PokemonTransaction } from '../types/pokemon';

const TRANSACTION_KEY = 'cashflow-pokemon-data';
const ASSET_KEY = 'cashflow-pokemon-assets';

function read<T>(key:string, fallback:T):T {
  try {
    const saved=localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export function usePokemonData() {
  const [pokemonTransactions, setPokemonTransactions] = useState<PokemonTransaction[]>(()=>read(TRANSACTION_KEY,[]));
  const [pokemonAssets, setPokemonAssets] = useState<PokemonAsset[]>(()=>read(ASSET_KEY,[]));

  useEffect(()=>localStorage.setItem(TRANSACTION_KEY,JSON.stringify(pokemonTransactions)),[pokemonTransactions]);
  useEffect(()=>localStorage.setItem(ASSET_KEY,JSON.stringify(pokemonAssets)),[pokemonAssets]);

  return { pokemonTransactions, setPokemonTransactions, pokemonAssets, setPokemonAssets };
}
