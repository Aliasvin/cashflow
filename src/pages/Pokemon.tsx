import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import type { FinanceData, Transaction } from '../types/finance';
import type { PokemonAsset, PokemonPurchaseType, PokemonTransaction } from '../types/pokemon';
import { euro } from '../utils/finance';
import { Modal } from '../components/ui/Modal';

const labels:Record<PokemonPurchaseType,string>={single_cards:'Losse kaarten',sealed:'Sealed producten',boosters:'Booster packs',accessories:'Accessoires',grading:'Grading',other:'Overig'};
function monthKey(){return new Date().toISOString().slice(0,7)}
function shiftMonth(key:string,n:number){const[y,m]=key.split('-').map(Number),d=new Date(y,m-1+n,1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function monthLabel(key:string){return new Date(`${key}-01T12:00:00`).toLocaleDateString('nl-NL',{month:'long',year:'numeric'})}
function latestValue(a:PokemonAsset){return [...a.valueHistory].sort((x,y)=>y.date.localeCompare(x.date))[0]?.value??a.purchasePrice}
function fmtDate(d:string){return new Date(d+'T12:00:00').toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'numeric'})}

export function Pokemon({data,setData,pokemonTransactions,setPokemonTransactions,pokemonAssets,setPokemonAssets}:{
 data:FinanceData;setData:(d:FinanceData)=>void;
 pokemonTransactions:PokemonTransaction[];setPokemonTransactions:(v:PokemonTransaction[])=>void;
 pokemonAssets:PokemonAsset[];setPokemonAssets:(v:PokemonAsset[])=>void;
}){
 const [tab,setTab]=useState<'overview'|'transactions'|'value'>('overview');
 const [selectedMonth,setSelectedMonth]=useState(monthKey());
 const [open,setOpen]=useState(false),[editing,setEditing]=useState<PokemonTransaction|null>(null);
 const [type,setType]=useState<'purchase'|'sale'>('purchase');
 const [assetOpen,setAssetOpen]=useState(false);
 const [valueAsset,setValueAsset]=useState<PokemonAsset|null>(null);
 const [editingAsset,setEditingAsset]=useState<PokemonAsset|null>(null);
 const [editValue,setEditValue]=useState<{assetId:string;pointId:string}|null>(null);
 const [sellingAsset,setSellingAsset]=useState<PokemonAsset|null>(null);

 const monthItems=useMemo(()=>pokemonTransactions.filter(i=>i.date.startsWith(selectedMonth)).sort((a,b)=>b.date.localeCompare(a.date)),[pokemonTransactions,selectedMonth]);
 const purchasesMonth=monthItems.filter(i=>i.type==='purchase').reduce((s,i)=>s+i.amount,0),salesMonth=monthItems.filter(i=>i.type==='sale').reduce((s,i)=>s+i.amount,0);
 const year=selectedMonth.slice(0,4),yearItems=pokemonTransactions.filter(i=>i.date.startsWith(year));
 const purchasesYear=yearItems.filter(i=>i.type==='purchase').reduce((s,i)=>s+i.amount,0),salesYear=yearItems.filter(i=>i.type==='sale').reduce((s,i)=>s+i.amount,0);
 const ownedAssets=pokemonAssets.filter(a=>a.status!=='sold');
 const purchaseValue=ownedAssets.reduce((s,a)=>s+a.purchasePrice,0),currentValue=ownedAssets.reduce((s,a)=>s+latestValue(a),0),valueChange=currentValue-purchaseValue;
 const purchaseTransactions=pokemonTransactions.filter(t=>t.type==='purchase').sort((a,b)=>b.date.localeCompare(a.date));
 const allocatedTo=(transactionId:string)=>pokemonAssets.filter(a=>a.transactionId===transactionId).reduce((sum,a)=>sum+a.purchasePrice,0);
 const linkedItems=(transactionId:string)=>pokemonAssets.filter(a=>a.transactionId===transactionId);
 const history=useMemo(()=>{
   const dates=[...new Set(pokemonAssets.flatMap(a=>a.valueHistory.map(v=>v.date)).concat(pokemonAssets.flatMap(a=>a.soldDate?[a.soldDate]:[])))].sort();
   return dates.map(date=>({date,value:pokemonAssets.reduce((sum,a)=>{
     if(a.purchaseDate>date||((a.status==='sold'||a.soldDate)&&a.soldDate&&a.soldDate<=date))return sum;
     const point=[...a.valueHistory].filter(v=>v.date<=date).sort((x,y)=>y.date.localeCompare(x.date))[0];
     return sum+(point?.value??a.purchasePrice);
   },0)}));
 },[pokemonAssets]);
 const chartMax=Math.max(...history.map(h=>h.value),1),chartMin=Math.min(...history.map(h=>h.value),0),range=Math.max(chartMax-chartMin,1);
 const close=()=>{setOpen(false);setEditing(null);setType('purchase')};
 const edit=(i:PokemonTransaction)=>{setEditing(i);setType(i.type);setOpen(true)};

 const save=(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=new FormData(e.currentTarget),accountId=String(f.get('accountId')),assetId=type==='sale'?(String(f.get('assetId')||'')||undefined):undefined;
  const item:PokemonTransaction={id:editing?.id??crypto.randomUUID(),type,amount:Number(f.get('amount')),description:String(f.get('description')),date:String(f.get('date')),purchaseType:String(f.get('purchaseType')) as PokemonPurchaseType,shop:String(f.get('shop')||'').trim()||undefined,note:String(f.get('note')||'').trim()||undefined,accountId,linkedTransactionId:editing?.linkedTransactionId??crypto.randomUUID(),assetId};
  const linked:Transaction={id:item.linkedTransactionId,type:type==='purchase'?'expense':'income',amount:item.amount,description:`Pokémon · ${item.description}`,date:item.date,accountId:item.accountId,categoryId:type==='purchase'?(data.categories.find(c=>c.id==='shopping')?.id??data.categories.find(c=>c.type==='expense')?.id):data.categories.find(c=>c.type==='income')?.id};
  setPokemonTransactions(editing?pokemonTransactions.map(p=>p.id===editing.id?item:p):[item,...pokemonTransactions]);
  if(type==='sale'&&assetId)setPokemonAssets(pokemonAssets.map(a=>a.id===assetId?{...a,status:'sold',soldPrice:item.amount,soldDate:item.date,saleTransactionId:item.id}:a));
  const exists=editing?data.transactions.some(t=>t.id===editing.linkedTransactionId):false;
  setData({...data,transactions:editing?(exists?data.transactions.map(t=>t.id===editing.linkedTransactionId?linked:t):[linked,...data.transactions]):[linked,...data.transactions]});close();
 };
 const remove=(i:PokemonTransaction)=>{if(!confirm('Pokémon-transactie verwijderen? De gekoppelde Cashflow-transactie wordt ook verwijderd.'))return;setPokemonTransactions(pokemonTransactions.filter(p=>p.id!==i.id));setData({...data,transactions:data.transactions.filter(t=>t.id!==i.linkedTransactionId)})};
 const addAsset=(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=new FormData(e.currentTarget),price=Number(f.get('purchasePrice')),transactionId=String(f.get('transactionId')||'')||undefined,linked=transactionId?pokemonTransactions.find(t=>t.id===transactionId):undefined,date=linked?.date||String(f.get('purchaseDate'));
  setPokemonAssets([{id:crypto.randomUUID(),name:String(f.get('name')),purchasePrice:price,purchaseDate:date,note:String(f.get('note')||'').trim()||undefined,transactionId,valueHistory:[{id:crypto.randomUUID(),date,value:price}]},...pokemonAssets]);setAssetOpen(false);
 };
 const addValue=(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();if(!valueAsset)return;const f=new FormData(e.currentTarget),point={id:crypto.randomUUID(),date:String(f.get('date')),value:Number(f.get('value'))};
  setPokemonAssets(pokemonAssets.map(a=>a.id===valueAsset.id?{...a,valueHistory:[...a.valueHistory.filter(v=>v.date!==point.date),point].sort((x,y)=>x.date.localeCompare(y.date))}:a));setValueAsset(null);
 };
 const saveAsset=(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();if(!editingAsset)return;const f=new FormData(e.currentTarget),price=Number(f.get('purchasePrice')),date=String(f.get('purchaseDate'));
  setPokemonAssets(pokemonAssets.map(a=>a.id!==editingAsset.id?a:{...a,name:String(f.get('name')),purchasePrice:price,purchaseDate:date,note:String(f.get('note')||'').trim()||undefined}));setEditingAsset(null);
 };
 const saveEditedValue=(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();if(!editValue)return;const f=new FormData(e.currentTarget),date=String(f.get('date')),value=Number(f.get('value'));
  setPokemonAssets(pokemonAssets.map(a=>a.id!==editValue.assetId?a:{...a,valueHistory:a.valueHistory.map(v=>v.id!==editValue.pointId?v:{...v,date,value}).sort((x,y)=>x.date.localeCompare(y.date))}));setEditValue(null);
 };
 const sellAsset=(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();if(!sellingAsset)return;const f=new FormData(e.currentTarget),amount=Number(f.get('amount')),date=String(f.get('date')),accountId=String(f.get('accountId')),id=crypto.randomUUID(),linkedTransactionId=crypto.randomUUID();
  const sale:PokemonTransaction={id,type:'sale',amount,description:sellingAsset.name,date,purchaseType:'single_cards',shop:String(f.get('shop')||'').trim()||undefined,note:String(f.get('note')||'').trim()||undefined,accountId,linkedTransactionId,assetId:sellingAsset.id};
  const linked:Transaction={id:linkedTransactionId,type:'income',amount,description:`Pokémon · ${sellingAsset.name}`,date,accountId,categoryId:data.categories.find(c=>c.type==='income')?.id};
  setPokemonTransactions([sale,...pokemonTransactions]);setPokemonAssets(pokemonAssets.map(a=>a.id===sellingAsset.id?{...a,status:'sold',soldPrice:amount,soldDate:date,saleTransactionId:id}:a));setData({...data,transactions:[linked,...data.transactions]});setSellingAsset(null);
 };
 const removeAsset=(a:PokemonAsset)=>{if(confirm(`${a.name} uit het waardeoverzicht verwijderen?`))setPokemonAssets(pokemonAssets.filter(x=>x.id!==a.id))};

 return <>
  <header className="with-action"><div><p className="eyebrow">Collectie-uitgaven en waarde</p><h1>Pokémon</h1><p className="muted">Bekijk wat je uitgeeft, verkoopt en wat je collectie ongeveer waard is.</p></div>
   <button className="primary" onClick={()=>tab==='value'?setAssetOpen(true):(setEditing(null),setType('purchase'),setOpen(true))}><Plus size={18}/>{tab==='value'?'Kaart toevoegen':'Transactie'}</button></header>
  <div className="pokemon-tabs"><button className={tab==='overview'?'active':''} onClick={()=>setTab('overview')}>Overzicht</button><button className={tab==='transactions'?'active':''} onClick={()=>setTab('transactions')}>Transacties</button><button className={tab==='value'?'active':''} onClick={()=>setTab('value')}>Waarde</button></div>

  {tab==='overview'&&<>
   <div className="pokemon-summary-grid">
    <article className="card"><small>Dit jaar gekocht</small><b>{euro(purchasesYear)}</b></article><article className="card"><small>Dit jaar verkocht</small><b className="income">{euro(salesYear)}</b></article>
    <article className="card"><small>Huidige collectiewaarde</small><b>{euro(currentValue)}</b></article><article className="card"><small>Waardeverschil</small><b className={valueChange>=0?'income':'expense'}>{valueChange>=0?'+ ':''}{euro(valueChange)}</b></article>
   </div>
   <section className="card"><div className="section-title"><div><h2>Collectiewaarde</h2><p>Op basis van je handmatig ingevoerde waardemomenten</p></div></div>
    {history.length<2?<div className="empty">Voeg bij Waarde meerdere waardemomenten toe om hier de ontwikkeling te zien.</div>:
     <div className="pokemon-chart"><svg viewBox="0 0 600 210" preserveAspectRatio="none" role="img" aria-label="Ontwikkeling collectiewaarde">
      <polyline points={history.map((h,i)=>`${history.length===1?0:i/(history.length-1)*600},${190-(h.value-chartMin)/range*165}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="3" vectorEffect="non-scaling-stroke"/>
      {history.map((h,i)=><circle key={h.date} cx={history.length===1?0:i/(history.length-1)*600} cy={190-(h.value-chartMin)/range*165} r="5" fill="currentColor" vectorEffect="non-scaling-stroke"/>)}
     </svg><div className="pokemon-chart-labels"><span>{fmtDate(history[0].date)}</span><b>{euro(history[history.length-1].value)}</b><span>{fmtDate(history[history.length-1].date)}</span></div></div>}
   </section>
  </>}

  {tab==='transactions'&&<>
   <div className="month-switcher pokemon-month-switcher"><button className="month-button" onClick={()=>setSelectedMonth(m=>shiftMonth(m,-1))}><ChevronLeft size={18}/></button><div><small>Pokémon-transacties</small><strong>{monthLabel(selectedMonth)}</strong></div><button className="month-button" onClick={()=>setSelectedMonth(m=>shiftMonth(m,1))}><ChevronRight size={18}/></button></div>
   <div className="pokemon-summary-grid"><article className="card"><small>Deze maand gekocht</small><b>{euro(purchasesMonth)}</b></article><article className="card"><small>Deze maand verkocht</small><b className="income">{euro(salesMonth)}</b></article></div>
   <section className="card pokemon-list-card">{monthItems.length===0?<div className="empty">Nog geen Pokémon-transacties in deze maand.</div>:monthItems.map(i=><div className="pokemon-entry" key={i.id}><div><b>{i.description}</b><small>{fmtDate(i.date)} · {labels[i.purchaseType]}{i.shop?` · ${i.shop}`:''}</small>{i.note&&<small>{i.note}</small>}</div><strong className={i.type==='sale'?'income':'expense'}>{i.type==='sale'?'+ ':'- '}{euro(i.amount)}</strong>{i.type==='purchase'&&<div className="pokemon-linked-items">{linkedItems(i.id).length>0?<><small>{linkedItems(i.id).length} gekoppeld{linkedItems(i.id).length===1?' item':'e items'} · {euro(allocatedTo(i.id))} toegewezen</small><small className={Math.abs(i.amount-allocatedTo(i.id))<0.01?'income':'muted'}>{Math.abs(i.amount-allocatedTo(i.id))<0.01?'Volledig toegewezen':`${euro(i.amount-allocatedTo(i.id))} niet toegewezen`}</small></>:<small>Nog geen collectie-items gekoppeld</small>}</div>}<div className="pokemon-entry-actions"><button className="transaction-action" onClick={()=>edit(i)}><Pencil size={15}/>Bewerken</button><button className="transaction-action danger-action" onClick={()=>remove(i)}><Trash2 size={15}/>Verwijderen</button></div></div>)}</section>
  </>}

  {tab==='value'&&<>
   <div className="pokemon-summary-grid"><article className="card"><small>Aankoopwaarde</small><b>{euro(purchaseValue)}</b></article><article className="card"><small>Huidige waarde</small><b>{euro(currentValue)}</b></article><article className="card"><small>Verschil</small><b className={valueChange>=0?'income':'expense'}>{valueChange>=0?'+ ':''}{euro(valueChange)}</b></article></div>
   <section className="card"><div className="section-title"><div><h2>Kaarten en items</h2><p>De nieuwste waarderegistratie bepaalt de huidige waarde.</p></div></div>
    {pokemonAssets.length===0?<div className="empty">Nog geen kaarten toegevoegd.</div>:pokemonAssets.map(a=><div className="pokemon-asset" key={a.id}><div><b>{a.name}</b><small>Aankoop {euro(a.purchasePrice)} · {fmtDate(a.purchaseDate)}</small><small>{a.valueHistory.length} waardemoment{a.valueHistory.length===1?'':'en'}</small>{a.transactionId&&<small>Gekoppeld aan: {pokemonTransactions.find(t=>t.id===a.transactionId)?.description??'Aankoop'}</small>}</div><div className="pokemon-asset-value">{a.status==='sold'?<><small>Verkocht voor</small><strong className="income">{euro(a.soldPrice??0)}</strong><small>{a.soldDate?fmtDate(a.soldDate):''} · resultaat {(a.soldPrice??0)-a.purchasePrice>=0?'+ ':''}{euro((a.soldPrice??0)-a.purchasePrice)}</small></>:<><small>Huidige waarde</small><strong>{euro(latestValue(a))}</strong></>}</div><div className="pokemon-entry-actions"><button className="transaction-action" onClick={()=>setEditingAsset(a)}>Bewerken</button>{a.status!=='sold'&&<><button className="transaction-action" onClick={()=>setValueAsset(a)}><Plus size={15}/>Waarde bijwerken</button><button className="transaction-action" onClick={()=>setSellingAsset(a)}>Verkocht</button></>}<button className="transaction-action danger-action" onClick={()=>removeAsset(a)}><Trash2 size={15}/>Verwijderen</button></div></div>)}
   </section>
  </>}

  <Modal open={open} title={editing?'Pokémon-transactie bewerken':'Pokémon-transactie toevoegen'} onClose={close}><form className="form modal-form" onSubmit={save}>
   <select value={type} onChange={e=>setType(e.target.value as 'purchase'|'sale')}><option value="purchase">Aankoop</option><option value="sale">Verkoop</option></select><input name="description" placeholder="Bijv. Pokémon 151 ETB" defaultValue={editing?.description??''} required/><input name="amount" type="number" min="0.01" step="0.01" placeholder="Bedrag" defaultValue={editing?.amount??''} required/><label className="field-label date-field">Datum<input name="date" type="date" defaultValue={editing?.date??new Date().toISOString().slice(0,10)} required/></label>{type==='sale'&&<label className="field-label">Kaart of item<select name="assetId" defaultValue={editing?.assetId??''}><option value="">Geen kaart koppelen</option>{pokemonAssets.filter(a=>a.status!=='sold'||a.id===editing?.assetId).map(a=><option key={a.id} value={a.id}>{a.name} · aankoop {euro(a.purchasePrice)}</option>)}</select></label>}<label className="field-label">Soort<select name="purchaseType" defaultValue={editing?.purchaseType??'single_cards'}><option value="single_cards">Losse kaarten</option><option value="sealed">Sealed producten</option><option value="boosters">Booster packs</option><option value="accessories">Accessoires</option><option value="grading">Grading</option><option value="other">Overig</option></select></label><label className="field-label">Rekening<select name="accountId" defaultValue={editing?.accountId??data.accounts[0]?.id} required>{data.accounts.map(a=><option value={a.id} key={a.id}>{a.name}</option>)}</select></label><input name="shop" placeholder="Winkel of verkoper (optioneel)" defaultValue={editing?.shop??''}/><input name="note" placeholder="Notitie (optioneel)" defaultValue={editing?.note??''}/><button className="primary">{editing?'Wijzigingen opslaan':'Opslaan'}</button>
  </form></Modal>
  <Modal open={assetOpen} title="Kaart of item toevoegen" onClose={()=>setAssetOpen(false)}><form className="form modal-form" onSubmit={addAsset}><input name="name" placeholder="Bijv. Charizard ex, 151 ETB of Booster Bundle" required/><label className="field-label">Koppel aan aankoop<select name="transactionId" defaultValue=""><option value="">Niet koppelen</option>{purchaseTransactions.map(t=><option key={t.id} value={t.id}>{fmtDate(t.date)} · {t.description} · {euro(t.amount)} ({euro(Math.max(0,t.amount-allocatedTo(t.id)))} vrij)</option>)}</select></label><input name="purchasePrice" type="number" min="0" step="0.01" placeholder="Aankoopwaarde van dit item" required/><label className="field-label date-field">Aankoopdatum bij niet gekoppeld item<input name="purchaseDate" type="date" defaultValue={new Date().toISOString().slice(0,10)} required/></label><p className="form-hint">Bij een gekoppelde aankoop wordt de datum van de transactie gebruikt. Je kunt meerdere kaarten, ETB's of Booster Bundles aan één aankoop koppelen.</p><input name="note" placeholder="Notitie (optioneel)"/><button className="primary">Toevoegen</button></form></Modal>
  <Modal open={!!editingAsset} title="Kaart of item bewerken" onClose={()=>setEditingAsset(null)}>{editingAsset&&<form className="form modal-form" onSubmit={saveAsset}><input name="name" defaultValue={editingAsset.name} required/><label className="field-label">Aankoopbedrag<input name="purchasePrice" type="number" min="0" step="0.01" defaultValue={editingAsset.purchasePrice} required/></label><label className="field-label date-field">Aankoopdatum<input name="purchaseDate" type="date" defaultValue={editingAsset.purchaseDate} required/></label><input name="note" defaultValue={editingAsset.note||''} placeholder="Notitie (optioneel)"/><button className="primary">Wijzigingen opslaan</button></form>}</Modal>
  <Modal open={!!valueAsset} title={valueAsset?`Waarde · ${valueAsset.name}`:'Waarde toevoegen'} onClose={()=>setValueAsset(null)}><form className="form modal-form" onSubmit={addValue}><label className="field-label date-field">Datum<input name="date" type="date" defaultValue={new Date().toISOString().slice(0,10)} required/></label><input name="value" type="number" min="0" step="0.01" placeholder="Waarde" defaultValue={valueAsset?latestValue(valueAsset):''} required/><button className="primary">Waarde opslaan</button>{valueAsset&&<div className="value-history"><b>Historie</b>{[...valueAsset.valueHistory].sort((a,b)=>b.date.localeCompare(a.date)).map(v=><div key={v.id}><span>{fmtDate(v.date)}</span><strong>{euro(v.value)}</strong><button type="button" className="transaction-action" onClick={()=>setEditValue({assetId:valueAsset.id,pointId:v.id})}>Bewerken</button></div>)}</div>}</form></Modal>
  <Modal open={!!sellingAsset} title={sellingAsset?`${sellingAsset.name} verkopen`:'Verkoop registreren'} onClose={()=>setSellingAsset(null)}>{sellingAsset&&<form className="form modal-form" onSubmit={sellAsset}><p className="form-hint">Aankoopprijs {euro(sellingAsset.purchasePrice)} · laatste waarde {euro(latestValue(sellingAsset))}</p><label className="field-label">Verkoopprijs<input name="amount" type="number" min="0.01" step="0.01" defaultValue={latestValue(sellingAsset)} required/></label><label className="field-label date-field">Verkoopdatum<input name="date" type="date" defaultValue={new Date().toISOString().slice(0,10)} required/></label><label className="field-label">Ontvangen op rekening<select name="accountId" defaultValue={data.accounts[0]?.id} required>{data.accounts.map(a=><option value={a.id} key={a.id}>{a.name}</option>)}</select></label><input name="shop" placeholder="Koper of platform (optioneel)"/><input name="note" placeholder="Notitie (optioneel)"/><button className="primary">Markeer als verkocht</button></form>}</Modal>
   <Modal open={!!editValue} title="Waarde bewerken" onClose={()=>setEditValue(null)}>{editValue&&(()=>{const a=pokemonAssets.find(x=>x.id===editValue.assetId),v=a?.valueHistory.find(x=>x.id===editValue.pointId);return v?<form className="form modal-form" onSubmit={saveEditedValue}><label className="field-label date-field">Datum<input name="date" type="date" defaultValue={v.date} required/></label><label className="field-label">Waarde<input name="value" type="number" min="0" step="0.01" defaultValue={v.value} required/></label><button className="primary">Wijzigingen opslaan</button></form>:null})()}</Modal>
</>;
}
