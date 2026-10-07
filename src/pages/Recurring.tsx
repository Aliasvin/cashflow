import { useState } from 'react';
import { Plus, Trash2, Repeat2 } from 'lucide-react';
import type { FinanceData, RecurringTransaction } from '../types/finance';
import { euro } from '../utils/finance';

export function Recurring({data,setData}:{data:FinanceData;setData:(d:FinanceData)=>void}){
 const [open,setOpen]=useState(false);
 const [type,setType]=useState<'income'|'expense'>('expense');
 const add=(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=new FormData(e.currentTarget);const item:RecurringTransaction={id:crypto.randomUUID(),type,description:String(f.get('description')),amount:Number(f.get('amount')),dayOfMonth:Number(f.get('day')),accountId:String(f.get('accountId')),categoryId:String(f.get('categoryId')),active:true,fixedCost:f.get('fixedCost')==='on'};setData({...data,recurringTransactions:[...data.recurringTransactions,item]});setOpen(false)};
 const remove=(id:string)=>setData({...data,recurringTransactions:data.recurringTransactions.filter(r=>r.id!==id)});
 const toggle=(id:string)=>setData({...data,recurringTransactions:data.recurringTransactions.map(r=>r.id===id?{...r,active:!r.active}:r)});
 const fixed=data.recurringTransactions.filter(r=>r.type==='expense'&&r.fixedCost&&r.active).reduce((s,r)=>s+r.amount,0);
 const cats=data.categories.filter(c=>c.type===type);
 return <><header className="with-action"><div><p className="eyebrow">Planning</p><h1>Terugkerend</h1><p className="muted">Beheer salaris, vaste lasten en andere terugkerende transacties.</p></div><button className="primary" onClick={()=>setOpen(!open)}><Plus size={18}/>Toevoegen</button></header>
 <div className="stats recurring-stats"><article><div className="icon"><Repeat2/></div><span>Vaste lasten per maand</span><b>{euro(fixed)}</b><small>{euro(fixed*12)} per jaar</small></article></div>
 {open&&<form className="card form" onSubmit={add}><select value={type} onChange={e=>setType(e.target.value as any)}><option value="expense">Uitgave</option><option value="income">Inkomst</option></select><input name="description" placeholder="Omschrijving" required/><input name="amount" type="number" min="0.01" step="0.01" placeholder="Bedrag" required/><input name="day" type="number" min="1" max="31" placeholder="Dag van de maand" required/><select name="accountId" required>{data.accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select><select name="categoryId" required>{cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>{type==='expense'&&<label className="check-line"><input type="checkbox" name="fixedCost"/> Dit is een vaste last</label>}<button className="primary">Opslaan</button></form>}
 <section className="card">{data.recurringTransactions.length===0?<div className="empty">Nog geen terugkerende transacties.</div>:data.recurringTransactions.map(r=><div className="row" key={r.id}><div><b>{r.description}</b><small>Iedere {r.dayOfMonth}e · {r.fixedCost?'Vaste last · ':''}{r.active?'Actief':'Gepauzeerd'}</small></div><div className="amount-actions"><strong className={r.type}>{r.type==='income'?'+ ':'- '}{euro(r.amount)}</strong><button className="secondary compact" onClick={()=>toggle(r.id)}>{r.active?'Pauze':'Activeer'}</button><button className="icon-button" onClick={()=>remove(r.id)}><Trash2 size={17}/></button></div></div>)}</section></>;
}
