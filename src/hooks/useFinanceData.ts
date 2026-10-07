import { useEffect, useState } from 'react';
import { defaultData } from '../data/defaultData';
import type { FinanceData } from '../types/finance';
import { clearPersonalCategoryRules } from '../utils/categorize';

const KEY = 'mijn-geld-data';

function mergeDefaultCategories(data: FinanceData): FinanceData {
  data = { ...data, recurringTransactions: data.recurringTransactions ?? [], savingsGoals: data.savingsGoals ?? [], transactions: data.transactions ?? [], accounts: data.accounts ?? [], categories: data.categories ?? [] };
  const existingIds = new Set(data.categories.map(category => category.id));
  const missing = defaultData.categories.filter(category => !existingIds.has(category.id));
  return missing.length ? { ...data, categories: [...data.categories, ...missing] } : data;
}

const emptyData: FinanceData = {
  version: 1,
  accounts: [],
  categories: defaultData.categories,
  transactions: [],
  savingsGoals: [],
  recurringTransactions: [],
};

export function useFinanceData() {
  const [data, setData] = useState<FinanceData>(() => {
    try {
      const saved = localStorage.getItem(KEY);
      return saved ? mergeDefaultCategories(JSON.parse(saved)) : defaultData;
    } catch {
      return defaultData;
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(data));
  }, [data]);

  const reset = () => {
    localStorage.removeItem(KEY);
    clearPersonalCategoryRules();
    setData({
      ...emptyData,
      categories: [...defaultData.categories],
    });
  };

  return { data, setData, reset };
}
