import { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Pencil, Plus, Trash2, TrendingUp } from 'lucide-react';
import type { FinanceData, RecurringFrequency, RecurringTransaction } from '../types/finance';
import { euro } from '../utils/finance';
import { frequencyLabel, monthlyEquivalent } from '../utils/planning';
import { Modal } from '../components/ui/Modal';

export function Recurring({data,setData}:{data:FinanceData;setData:(d:FinanceData)=>void}){
 const [open,setOpen]=useState(false);
 const [editing,setEditing]=useState<RecurringTransaction|null>(null);
 const [type,setType]=useState<'income'|'expense'>('expense');
 const [frequency,setFrequency]=useState<RecurringFrequency>('monthly');

 const openAdd=()=>{
  setEditing(null);
  setType('expense');
  setFrequency('monthly');
  setOpen(true);
 };

 const openEdit=(r:RecurringTransaction)=>{
  setEditing(r);
  setType(r.type);
  setFrequency(r.frequency||'monthly');
  setOpen(true);
 };

 const close=()=>{setOpen(false);setEditing(null)};

 const save=(e:React.FormEvent<HTMLFormElement>)=>{
  e.preventDefault();
  const f=new FormData(e.currentTarget),startDate=String(f.get('startDate'));
  const item:RecurringTransaction={
   id:editing?.id||crypto.randomUUID(),type,description:String(f.get('description')),amount:Number(f.get('amount')),
   frequency,startDate,dayOfMonth:['monthly','quarterly','yearly'].includes(frequency)?new Date(startDate+'T12:00:00').getDate():undefined,
   accountId:String(f.get('accountId')),categoryId:String(f.get('categoryId')),active:editing?.active??true,
   fixedCost:type==='expense'&&f.get('fixedCost')==='on'
  };
  const recurringTransactions=editing
   ? data.recurringTransactions.map(r=>r.id===editing.id?item:r)
   : [...data.recurringTransactions,item];
  setData({...data,recurringTransactions});
  close();
 };

 const remove=(id:string)=>setData({...data,recurringTransactions:data.recurringTransactions.filter(r=>r.id!==id)});
 const toggle=(id:string)=>setData({...data,recurringTransactions:data.recurringTransactions.map(r=>r.id===id?{...r,active:!r.active}:r)});
 const cats=data.categories.filter(c=>c.type===type);

 const activeIncome=data.recurringTransactions.filter(r=>r.type==='income'&&r.active);
 const activeExpenses=data.recurringTransactions.filter(r=>r.type==='expense'&&r.active);
 const incomeMonthly=activeIncome.reduce((s,r)=>s+monthlyEquivalent(r),0);
 const expenseMonthly=activeExpenses.reduce((s,r)=>s+monthlyEquivalent(r),0);
 const difference=incomeMonthly-expenseMonthly;
 const incomes=data.recurringTransactions.filter(r=>r.type==='income');
 const expenses=data.recurringTransactions.filter(r=>r.type==='expense');

 const dateLabel=(r:RecurringTransaction)=>{
  if(!r.startDate) return `dag ${r.dayOfMonth||1}`;
  const d=new Date(r.startDate+'T12:00:00');
  if((r.frequency||'monthly')==='weekly'||r.frequency==='biweekly'||r.frequency==='fourweekly')
   return d.toLocaleDateString('nl-NL',{weekday:'long'});
  return `iedere ${d.getDate()}e`;
 };

 const recurringRow=(r:RecurringTransaction)=><div className="row recurring-row" key={r.id}>
  <div className="recurring-main">
   <div className="recurring-title"><b>{r.description}</b>{r.fixedCost&&<span className="badge">Vaste last</span>}{!r.active&&<span className="badge muted-badge">Gepauzeerd</span>}</div>
   <small>{euro(r.amount)} · {frequencyLabel(r.frequency)} · {dateLabel(r)}</small>
   <small>Per jaar {euro(monthlyEquivalent(r)*12)}</small>
  </div>
  <div className="amount-actions">
   <strong className={r.type}>{r.type==='income'?'+ ':'- '}{euro(r.amount)}</strong>
   <button className="icon-button" aria-label={`${r.description} bewerken`} title="Bewerken" onClick={()=>openEdit(r)}><Pencil size={17}/></button>
   <button className="secondary compact" onClick={()=>toggle(r.id)}>{r.active?'Pauze':'Activeer'}</button>
   <button className="icon-button" aria-label="Verwijderen" onClick={()=>remove(r.id)}><Trash2 size={17}/></button>
  </div>
 </div>;

 return <>
  <header className="with-action"><div><p className="eyebrow">Planning</p><h1>Terugkerend</h1><p className="muted">Beheer terugkerende inkomsten, uitgaven en vaste lasten.</p></div><button className="primary" onClick={openAdd}><Plus size={18}/>Toevoegen</button></header>

  <div className="stats recurring-summary">
   <article><div className="icon"><ArrowUpRight/></div><span>Terugkerende inkomsten</span><b className="income">{euro(incomeMonthly)} <small>per maand</small></b><small>{euro(incomeMonthly*12)} per jaar</small></article>
   <article><div className="icon"><ArrowDownRight/></div><span>Terugkerende uitgaven</span><b className="expense">{euro(expenseMonthly)} <small>per maand</small></b><small>{euro(expenseMonthly*12)} per jaar</small></article>
   <article><div className="icon"><TrendingUp/></div><span>Verschil</span><b className={difference>=0?'income':'expense'}>{difference>=0?'+ ':''}{euro(difference)} <small>per maand</small></b><small>{difference>=0?'+ ':''}{euro(difference*12)} per jaar</small></article>
  </div>

  <Modal open={open} title={editing?'Terugkerende transactie bewerken':'Terugkerende transactie toevoegen'} onClose={close}>
   <form key={editing?.id||'new'} className="form modal-form" onSubmit={save}>
    <select value={type} onChange={e=>setType(e.target.value as 'income'|'expense')}><option value="expense">Uitgave</option><option value="income">Inkomst</option></select>
    <input name="description" placeholder="Omschrijving" defaultValue={editing?.description||''} required/>
    <input name="amount" type="number" min="0.01" step="0.01" placeholder="Bedrag" defaultValue={editing?.amount||''} required/>
    <select value={frequency} onChange={e=>setFrequency(e.target.value as RecurringFrequency)}><option value="weekly">Wekelijks</option><option value="biweekly">Elke 2 weken</option><option value="fourweekly">Elke 4 weken</option><option value="monthly">Maandelijks</option><option value="quarterly">Per kwartaal</option><option value="yearly">Jaarlijks</option></select>
    <label className="field-label">Eerste datum<input name="startDate" type="date" defaultValue={editing?.startDate||''} required/></label>
    <select name="categoryId" required defaultValue={editing?.categoryId||''}><option value="" disabled>{cats.length?'Kies een categorie':`Geen categorieën voor ${type==='income'?'inkomsten':'uitgaven'}`}</option>{cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
    <select name="accountId" required defaultValue={editing?.accountId||''}><option value="" disabled>{data.accounts.length?'Kies een rekening':'Maak eerst een rekening aan'}</option>{data.accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select>
    {type==='expense'&&<label className="check-line"><input type="checkbox" name="fixedCost" defaultChecked={editing?.fixedCost||false}/> Dit is een vaste last</label>}
    <button className="primary">{editing?'Wijzigingen opslaan':'Opslaan'}</button>
   </form>
  </Modal>

  <div className="recurring-sections">
   <section className="card recurring-section">
    <div className="section-title"><div><h2>Terugkerende inkomsten</h2><p>Periodieke inkomsten zoals salaris en toeslagen.</p></div><span className="section-total income">+ {euro(incomeMonthly)} p/m</span></div>
    {incomes.length===0?<div className="empty">Nog geen terugkerende inkomsten.</div>:incomes.map(recurringRow)}
   </section>
   <section className="card recurring-section">
    <div className="section-title"><div><h2>Terugkerende uitgaven</h2><p>Periodieke uitgaven en vaste lasten.</p></div><span className="section-total expense">- {euro(expenseMonthly)} p/m</span></div>
    {expenses.length===0?<div className="empty">Nog geen terugkerende uitgaven.</div>:expenses.map(recurringRow)}
   </section>
  </div>
 </>;
}
