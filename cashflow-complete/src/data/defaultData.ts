import type { FinanceData } from '../types/finance';
export const defaultData: FinanceData = {
 version:1,
 accounts:[{id:'checking',name:'Betaalrekening',type:'checking',startingBalance:2328.32},{id:'savings',name:'Spaarrekening',type:'savings',startingBalance:4100}],
 categories:[{id:'salary',name:'Salaris',type:'income'},{id:'groceries',name:'Boodschappen',type:'expense'},{id:'subscriptions',name:'Abonnementen',type:'expense'},{id:'housing',name:'Wonen',type:'expense'},{id:'other',name:'Overig',type:'expense'}],
 transactions:[], savingsGoals:[{id:'holiday',name:'Vakantie',targetAmount:1500,currentAmount:750}], recurringTransactions:[]
};
