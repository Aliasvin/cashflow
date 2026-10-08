import type { FinanceData } from '../types/finance';
export const euro=(n:number)=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(n);
const todayKey=()=>new Date().toISOString().slice(0,10);
export function accountBalance(data:FinanceData,id:string,throughDate=todayKey()){
 let b=data.accounts.find(a=>a.id===id)?.startingBalance??0;
 for(const t of data.transactions){
  if(t.date>throughDate)continue;
  if(t.type==='income'&&t.accountId===id)b+=t.amount;
  if(t.type==='expense'&&t.accountId===id)b-=t.amount;
  if(t.type==='transfer'){if(t.accountId===id)b-=t.amount;if(t.toAccountId===id)b+=t.amount}
 }
 return b;
}
