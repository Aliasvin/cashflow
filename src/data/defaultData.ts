import type { FinanceData } from '../types/finance';

export const defaultData: FinanceData = {
  version: 1,
  accounts: [
    { id: 'checking', name: 'Betaalrekening', type: 'checking', startingBalance: 2328.32 },
    { id: 'savings', name: 'Spaarrekening', type: 'savings', startingBalance: 4100 },
  ],
  categories: [
    { id: 'salary', name: 'Salaris', type: 'income' },
    { id: 'groceries', name: 'Boodschappen', type: 'expense' },
    { id: 'subscriptions', name: 'Abonnementen', type: 'expense' },
    { id: 'housing', name: 'Wonen', type: 'expense' },
    { id: 'transport', name: 'Vervoer', type: 'expense' },
    { id: 'public-transport', name: 'Openbaar vervoer', type: 'expense' },
    { id: 'dining', name: 'Uit eten', type: 'expense' },
    { id: 'clothing', name: 'Kleding', type: 'expense' },
    { id: 'personal-care', name: 'Persoonlijke verzorging', type: 'expense' },
    { id: 'health', name: 'Zorg', type: 'expense' },
    { id: 'shopping', name: 'Winkelen', type: 'expense' },
    { id: 'sport', name: 'Sport', type: 'expense' },
    { id: 'phone-internet', name: 'Telefoon & internet', type: 'expense' },
    { id: 'other', name: 'Overig', type: 'expense' },
  ],
  transactions: [],
  savingsGoals: [{ id: 'holiday', name: 'Vakantie', targetAmount: 1500, currentAmount: 750 }],
  recurringTransactions: [],
};
