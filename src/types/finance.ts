export type AccountType = 'checking' | 'savings' | 'cash';
export interface Account { id:string; name:string; type:AccountType; startingBalance:number }
export type CategoryType = 'income' | 'expense';
export interface Category { id:string; name:string; type:CategoryType }
export type TransactionType = 'income' | 'expense' | 'transfer';
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  accountId: string;
  categoryId?: string;
  toAccountId?: string;
}
export interface SavingsGoal { id:string; name:string; targetAmount:number; currentAmount:number; targetDate?:string; accountId?:string }
export type RecurringFrequency = 'weekly'|'biweekly'|'fourweekly'|'monthly'|'quarterly'|'yearly';
export interface RecurringTransaction { id:string; type:'income'|'expense'; amount:number; description:string; accountId:string; categoryId:string; active:boolean; fixedCost?:boolean; frequency?:RecurringFrequency; startDate?:string; dayOfMonth?:number; dayOfWeek?:number }
export interface FinanceData { version:1; accounts:Account[]; categories:Category[]; transactions:Transaction[]; savingsGoals:SavingsGoal[]; recurringTransactions:RecurringTransaction[]; processedRecurringOccurrences?:string[] }
