import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import type { FinanceData, Transaction } from '../types/finance';
import type { PokemonPurchaseType, PokemonTransaction } from '../types/pokemon';
import { euro } from '../utils/finance';
import { Modal } from '../components/ui/Modal';

const labels: Record<PokemonPurchaseType,string> = {
  single_cards:'Losse kaarten',
  sealed:'Sealed producten',
  boosters:'Booster packs',
  accessories:'Accessoires',
  grading:'Grading',
  other:'Overig',
};

function monthKey(){ return new Date().toISOString().slice(0,7); }
function shiftMonth(key:string,amount:number){
  const [y,m]=key.split('-').map(Number), d=new Date(y,m-1+amount,1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
function monthLabel(key:string){
  return new Date(`${key}-01T12:00:00`).toLocaleDateString('nl-NL',{month:'long',year:'numeric'});
}

export function Pokemon({
  data,setData,pokemonTransactions,setPokemonTransactions
}:{
  data:FinanceData;
  setData:(d:FinanceData)=>void;
  pokemonTransactions:PokemonTransaction[];
  setPokemonTransactions:(items:PokemonTransaction[])=>void;
}){
  const [selectedMonth,setSelectedMonth]=useState(monthKey());
  const [open,setOpen]=useState(false);
  const [editing,setEditing]=useState<PokemonTransaction|null>(null);
  const [type,setType]=useState<'purchase'|'sale'>('purchase');

  const monthItems=useMemo(()=>pokemonTransactions
    .filter(item=>item.date.startsWith(selectedMonth))
    .sort((a,b)=>b.date.localeCompare(a.date)),[pokemonTransactions,selectedMonth]);

  const purchasesMonth=monthItems.filter(i=>i.type==='purchase').reduce((s,i)=>s+i.amount,0);
  const salesMonth=monthItems.filter(i=>i.type==='sale').reduce((s,i)=>s+i.amount,0);
  const year=selectedMonth.slice(0,4);
  const yearItems=pokemonTransactions.filter(i=>i.date.startsWith(year));
  const purchasesYear=yearItems.filter(i=>i.type==='purchase').reduce((s,i)=>s+i.amount,0);
  const salesYear=yearItems.filter(i=>i.type==='sale').reduce((s,i)=>s+i.amount,0);
  const byType=Object.entries(yearItems.filter(i=>i.type==='purchase').reduce((acc,item)=>{
    acc[item.purchaseType]=(acc[item.purchaseType]||0)+item.amount; return acc;
  },{} as Record<string,number>)).sort((a,b)=>b[1]-a[1]);

  const close=()=>{setOpen(false);setEditing(null);setType('purchase')};
  const edit=(item:PokemonTransaction)=>{setEditing(item);setType(item.type);setOpen(true)};

  const save=(e:React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    const accountId=String(f.get('accountId'));
    const item:PokemonTransaction={
      id:editing?.id??crypto.randomUUID(),
      type,
      amount:Number(f.get('amount')),
      description:String(f.get('description')),
      date:String(f.get('date')),
      purchaseType:String(f.get('purchaseType')) as PokemonPurchaseType,
      shop:String(f.get('shop')||'').trim()||undefined,
      note:String(f.get('note')||'').trim()||undefined,
      accountId,
      linkedTransactionId:editing?.linkedTransactionId??crypto.randomUUID(),
    };
    const linked:Transaction={
      id:item.linkedTransactionId,
      type:type==='purchase'?'expense':'income',
      amount:item.amount,
      description:`Pokémon · ${item.description}`,
      date:item.date,
      accountId:item.accountId,
      categoryId:type==='purchase'?(data.categories.find(c=>c.id==='shopping')?.id??data.categories.find(c=>c.type==='expense')?.id):data.categories.find(c=>c.type==='income')?.id,
    };
    setPokemonTransactions(editing?pokemonTransactions.map(p=>p.id===editing.id?item:p):[item,...pokemonTransactions]);
    setData({...data,transactions:editing
      ? data.transactions.map(t=>t.id===editing.linkedTransactionId?linked:t)
      : [linked,...data.transactions]});
    close();
  };

  const remove=(item:PokemonTransaction)=>{
    if(!confirm('Pokémon-transactie verwijderen? De gekoppelde Cashflow-transactie wordt ook verwijderd.')) return;
    setPokemonTransactions(pokemonTransactions.filter(p=>p.id!==item.id));
    setData({...data,transactions:data.transactions.filter(t=>t.id!==item.linkedTransactionId)});
  };

  return <>
    <header className="with-action">
      <div><p className="eyebrow">Collectie-uitgaven</p><h1>Pokémon</h1><p className="muted">Houd aankopen en verkopen apart bij, terwijl ze wel meetellen in Cashflow.</p></div>
      <button className="primary" onClick={()=>{setEditing(null);setType('purchase');setOpen(true)}}><Plus size={18}/>Toevoegen</button>
    </header>

    <div className="month-switcher pokemon-month-switcher">
      <button className="month-button" onClick={()=>setSelectedMonth(m=>shiftMonth(m,-1))} aria-label="Vorige maand"><ChevronLeft size={18}/></button>
      <div><small>Pokémon-overzicht</small><strong>{monthLabel(selectedMonth)}</strong></div>
      <button className="month-button" onClick={()=>setSelectedMonth(m=>shiftMonth(m,1))} aria-label="Volgende maand"><ChevronRight size={18}/></button>
    </div>

    <div className="pokemon-summary-grid">
      <article className="card"><small>Deze maand gekocht</small><b>{euro(purchasesMonth)}</b></article>
      <article className="card"><small>Deze maand verkocht</small><b className="income">{euro(salesMonth)}</b></article>
      <article className="card"><small>Dit jaar gekocht</small><b>{euro(purchasesYear)}</b></article>
      <article className="card"><small>Netto dit jaar</small><b>{euro(purchasesYear-salesYear)}</b></article>
    </div>

    <section className="card">
      <div className="section-title"><div><h2>Verdeling dit jaar</h2><p>Waar je Pokémon-uitgaven naartoe gaan</p></div></div>
      {byType.length===0?<div className="empty">Nog geen Pokémon-aankopen in {year}.</div>:byType.map(([key,value])=>
        <div className="row" key={key}><div><b>{labels[key as PokemonPurchaseType]??'Overig'}</b><small>{year}</small></div><strong>{euro(value)}</strong></div>)}
    </section>

    <section className="card pokemon-list-card">
      <div className="section-title"><div><h2>Aankopen en verkopen</h2><p>{monthLabel(selectedMonth)}</p></div></div>
      {monthItems.length===0?<div className="empty">Nog geen Pokémon-transacties in deze maand.</div>:monthItems.map(item=>
        <div className="pokemon-entry" key={item.id}>
          <div><b>{item.description}</b><small>{new Date(item.date+'T12:00:00').toLocaleDateString('nl-NL')} · {labels[item.purchaseType]}{item.shop?` · ${item.shop}`:''}</small>{item.note&&<small>{item.note}</small>}</div>
          <strong className={item.type==='sale'?'income':'expense'}>{item.type==='sale'?'+ ':'- '}{euro(item.amount)}</strong>
          <div className="pokemon-entry-actions"><button className="transaction-action" onClick={()=>edit(item)}><Pencil size={15}/>Bewerken</button><button className="transaction-action danger-action" onClick={()=>remove(item)}><Trash2 size={15}/>Verwijderen</button></div>
        </div>)}
    </section>

    <Modal open={open} title={editing?'Pokémon-transactie bewerken':'Pokémon-transactie toevoegen'} onClose={close}>
      <form className="form modal-form" onSubmit={save}>
        <select value={type} onChange={e=>setType(e.target.value as 'purchase'|'sale')}><option value="purchase">Aankoop</option><option value="sale">Verkoop</option></select>
        <input name="description" placeholder="Bijv. Pokémon 151 ETB" defaultValue={editing?.description??''} required/>
        <input name="amount" type="number" min="0.01" step="0.01" placeholder="Bedrag" defaultValue={editing?.amount??''} required/>
        <label className="field-label date-field">Datum<input name="date" type="date" defaultValue={editing?.date??new Date().toISOString().slice(0,10)} required/></label>
        <label className="field-label">Soort<select name="purchaseType" defaultValue={editing?.purchaseType??'single_cards'}><option value="single_cards">Losse kaarten</option><option value="sealed">Sealed producten</option><option value="boosters">Booster packs</option><option value="accessories">Accessoires</option><option value="grading">Grading</option><option value="other">Overig</option></select></label>
        <label className="field-label">Rekening<select name="accountId" defaultValue={editing?.accountId??data.accounts[0]?.id} required>{data.accounts.map(a=><option value={a.id} key={a.id}>{a.name}</option>)}</select></label>
        <input name="shop" placeholder="Winkel of verkoper (optioneel)" defaultValue={editing?.shop??''}/>
        <input name="note" placeholder="Notitie (optioneel)" defaultValue={editing?.note??''}/>
        <button className="primary">{editing?'Wijzigingen opslaan':'Opslaan'}</button>
      </form>
    </Modal>
  </>;
}
