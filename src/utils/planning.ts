import type { FinanceData, RecurringFrequency, RecurringTransaction } from '../types/finance';
import { accountBalance } from './finance';
const DAY=86400000;
const dateOnly=(d:Date)=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
const clampDay=(y:number,m:number,day:number)=>new Date(y,m,Math.min(day,new Date(y,m+1,0).getDate()));
export const frequencyLabel=(f:RecurringFrequency='monthly')=>({weekly:'Wekelijks',biweekly:'Elke 2 weken',fourweekly:'Elke 4 weken',monthly:'Maandelijks',quarterly:'Per kwartaal',yearly:'Jaarlijks'}[f]);
function anchor(r:RecurringTransaction){const f=r.frequency||'monthly';if(r.startDate){const [y,m,d]=r.startDate.split('-').map(Number);const a=new Date(y,m-1,d);if((f==='biweekly'||f==='fourweekly')&&r.dayOfWeek!==undefined){const delta=(r.dayOfWeek-a.getDay()+7)%7;return new Date(+a+delta*DAY)}return a}const n=dateOnly(new Date());if(f==='weekly'&&r.dayOfWeek!==undefined){const delta=(r.dayOfWeek-n.getDay()+7)%7;return new Date(+n+delta*DAY)}return clampDay(n.getFullYear(),n.getMonth(),r.dayOfMonth||1)}
function addMonths(a:Date,n:number,day:number){return clampDay(a.getFullYear(),a.getMonth()+n,day)}
export function occurrences(r:RecurringTransaction,from:Date,to:Date){const start=dateOnly(from),end=dateOnly(to),a=anchor(r),f=r.frequency||'monthly',dates:Date[]=[];if(f==='weekly'||f==='biweekly'||f==='fourweekly'){const step=f==='weekly'?7:f==='biweekly'?14:28;let d=new Date(a);if(d<start){const jumps=Math.ceil((+start-+d)/(DAY*step));d=new Date(+d+jumps*step*DAY)}while(d<=end){dates.push(new Date(d));d=new Date(+d+step*DAY)}return dates}const months=f==='monthly'?1:f==='quarterly'?3:12,day=r.dayOfMonth||a.getDate();let n=0,d=addMonths(a,0,day);while(d<start){n+=months;d=addMonths(a,n,day)}while(d<=end){dates.push(d);n+=months;d=addMonths(a,n,day)}return dates}
export function upcoming(data:FinanceData,days=45){const now=dateOnly(new Date()),end=new Date(+now+days*DAY);return data.recurringTransactions.filter(r=>r.active).flatMap(item=>occurrences(item,now,end).map(date=>({item,date}))).sort((a,b)=>+a.date-+b.date)}
export function monthlyEquivalent(r:RecurringTransaction){const f=r.frequency||'monthly';if(f==='weekly')return r.amount*52/12;if(f==='biweekly')return r.amount*26/12;if(f==='fourweekly')return r.amount*13/12;if(f==='quarterly')return r.amount/3;if(f==='yearly')return r.amount/12;return r.amount}
export function spendable(data:FinanceData){const checking=data.accounts.filter(a=>a.type==='checking'||a.type==='cash').reduce((s,a)=>s+accountBalance(data,a.id),0),list=upcoming(data,31),incoming=list.filter(x=>x.item.type==='income').reduce((s,x)=>s+x.item.amount,0),outgoing=list.filter(x=>x.item.type==='expense').reduce((s,x)=>s+x.item.amount,0);return{checking,incoming,outgoing,value:checking+incoming-outgoing}}

export const occurrenceKey=(r:RecurringTransaction,date:Date)=>`${r.id}:${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export function dueRecurring(data:FinanceData,lookbackDays=31){const today=dateOnly(new Date()),from=new Date(+today-lookbackDays*DAY),done=new Set(data.processedRecurringOccurrences??[]);return data.recurringTransactions.filter(r=>r.active).flatMap(item=>occurrences(item,from,today).map(date=>({item,date,key:occurrenceKey(item,date)}))).filter(x=>!done.has(x.key)).sort((a,b)=>+a.date-+b.date)}


export function nextIncomeSpendable(data:FinanceData){
  const today=dateOnly(new Date());
  const future=upcoming(data,120);
  const nextIncome=future.find(x=>x.item.type==='income');
  const checking=data.accounts
    .filter(a=>a.type==='checking'||a.type==='cash')
    .reduce((s,a)=>s+accountBalance(data,a.id),0);

  if(!nextIncome){
    return {checking,outgoing:0,value:checking,nextIncome:null as null|Date,days:0,daily:checking};
  }

  const outgoing=future
    .filter(x=>x.item.type==='expense' && x.date<nextIncome.date)
    .reduce((s,x)=>s+x.item.amount,0);
  const value=checking-outgoing;
  const days=Math.max(1,Math.ceil((+dateOnly(nextIncome.date)-+today)/DAY));
  return {checking,outgoing,value,nextIncome:nextIncome.date,days,daily:value/days};
}

export function projectedBalance(data:FinanceData,days=45){
  const today=dateOnly(new Date());
  const checking=data.accounts
    .filter(a=>a.type==='checking'||a.type==='cash')
    .reduce((s,a)=>s+accountBalance(data,a.id),0);
  const events=upcoming(data,days);
  let balance=checking;
  const points=[{date:today,balance,label:'Vandaag'}];
  for(const event of events){
    balance += event.item.type==='income' ? event.item.amount : -event.item.amount;
    points.push({date:event.date,balance,label:event.item.description});
  }
  return points;
}

export function monthCalendar(data:FinanceData,monthKey:string){
  const [year,month]=monthKey.split('-').map(Number);
  const from=new Date(year,month-1,1);
  const to=new Date(year,month,0);
  const actual=data.transactions
    .filter(t=>t.date.startsWith(monthKey))
    .map(t=>({kind:'actual' as const,date:new Date(t.date+'T12:00:00'),description:t.description,type:t.type,amount:t.amount,id:t.id}));
  const expected=data.recurringTransactions
    .filter(r=>r.active)
    .flatMap(r=>occurrences(r,from,to).map(date=>({kind:'expected' as const,date,description:r.description,type:r.type,amount:r.amount,id:`${r.id}-${+date}`})));
  return [...actual,...expected].sort((a,b)=>+a.date-+b.date);
}
