import type { FinanceData } from '../types/finance';
export const euro=(n:number)=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(n);
export function accountBalance(data:FinanceData,id:string){let b=data.accounts.find(a=>a.id===id)?.startingBalance??0;for(const t of data.transactions){if(t.type==='income'&&t.accountId===id)b+=t.amount;if(t.type==='expense'&&t.accountId===id)b-=t.amount;if(t.type==='transfer'){if(t.accountId===id)b-=t.amount;if(t.toAccountId===id)b+=t.amount}}return b}
