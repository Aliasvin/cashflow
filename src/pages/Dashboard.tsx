import { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Landmark,
  PiggyBank,
  Tag,
  CalendarClock,
  TrendingUp,
  Plus,
} from 'lucide-react';
import type { FinanceData } from '../types/finance';
import { accountBalance, euro } from '../utils/finance';
import { Modal } from '../components/ui/Modal';
import { dueRecurring, spendable, upcoming, nextIncomeSpendable, projectedBalance, monthCalendar, monthlyEquivalent } from '../utils/planning';

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(monthKey: string, amount: number) {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1 + amount, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Intl.DateTimeFormat('nl-NL', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
}

export function Dashboard({ data, setData }: { data: FinanceData; setData: (data:FinanceData)=>void }) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [quickOpen,setQuickOpen]=useState(false);
  const [quickType,setQuickType]=useState<'expense'|'income'>('expense');

  const balances = data.accounts.map(account => ({
    ...account,
    balance: accountBalance(data, account.id),
  }));
  const total = balances.reduce((sum, account) => sum + account.balance, 0);

  const monthTransactions = data.transactions.filter(transaction =>
    transaction.date.startsWith(selectedMonth)
  );
  const income = monthTransactions
    .filter(transaction => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenses = monthTransactions
    .filter(transaction => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const previousMonth=shiftMonth(selectedMonth,-1);
  const previousTransactions=data.transactions.filter(t=>t.date.startsWith(previousMonth));
  const previousIncome=previousTransactions.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const previousExpenses=previousTransactions.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const saved=monthTransactions.filter(t=>t.type==='transfer'&&data.accounts.find(a=>a.id===t.toAccountId)?.type==='savings').reduce((s,t)=>s+t.amount,0)
    - monthTransactions.filter(t=>t.type==='transfer'&&data.accounts.find(a=>a.id===t.accountId)?.type==='savings').reduce((s,t)=>s+t.amount,0);


  const expenseMap = new Map<string, number>();
  monthTransactions
    .filter(transaction => transaction.type === 'expense')
    .forEach(transaction => {
      const category =
        data.categories.find(item => item.id === transaction.categoryId)?.name ??
        'Zonder categorie';
      expenseMap.set(category, (expenseMap.get(category) ?? 0) + transaction.amount);
    });

  const categoryExpenses = [...expenseMap.entries()]
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: expenses > 0 ? (amount / expenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const maxCategoryAmount = categoryExpenses[0]?.amount ?? 0;
  const free = spendable(data);
  const untilIncome = nextIncomeSpendable(data);
  const projection = projectedBalance(data,45);
  const calendar = monthCalendar(data,selectedMonth);
  const fixedCosts = data.recurringTransactions
    .filter(r=>r.active && r.type==='expense' && r.fixedCost)
    .map(r=>({...r,monthly:monthlyEquivalent(r)}))
    .sort((a,b)=>b.monthly-a.monthly);
  const fixedMonthly = fixedCosts.reduce((s,r)=>s+r.monthly,0);
  const recurringIncomeMonthly = data.recurringTransactions
    .filter(r=>r.active && r.type==='income')
    .reduce((s,r)=>s+monthlyEquivalent(r),0);
  const fixedShare = recurringIncomeMonthly>0 ? fixedMonthly/recurringIncomeMonthly*100 : 0;

  const insightMonths = Array.from({length:6},(_,i)=>{
    const now=new Date();
    const date=new Date(now.getFullYear(),now.getMonth()-5+i,1);
    const key=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
    const tx=data.transactions.filter(t=>t.date.startsWith(key));
    const inc=tx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const exp=tx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    return {key,label:new Intl.DateTimeFormat('nl-NL',{month:'short'}).format(date),income:inc,expenses:exp,saved:inc-exp};
  });
  const avgExpenses=insightMonths.reduce((s,m)=>s+m.expenses,0)/insightMonths.length;
  const avgIncome=insightMonths.reduce((s,m)=>s+m.income,0)/insightMonths.length;
  const savingsRate=avgIncome>0?Math.max(0,(avgIncome-avgExpenses)/avgIncome*100):0;
  const insightKeys=new Set(insightMonths.map(m=>m.key));
  const largestExpense=[...data.transactions].filter(t=>t.type==='expense'&&insightKeys.has(t.date.slice(0,7))).sort((a,b)=>b.amount-a.amount)[0];

  const forecast = upcoming(data, 45).slice(0, 8);
  const due=dueRecurring(data,31).slice(0,8);
  const processRecurring=(entry:(typeof due)[number])=>{const d=entry.date;const date=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;setData({...data,transactions:[{id:crypto.randomUUID(),type:entry.item.type,amount:entry.item.amount,description:entry.item.description,date,accountId:entry.item.accountId,categoryId:entry.item.categoryId},...data.transactions],processedRecurringOccurrences:[...(data.processedRecurringOccurrences??[]),entry.key]})};
  const skipRecurring=(key:string)=>setData({...data,processedRecurringOccurrences:[...(data.processedRecurringOccurrences??[]),key]});
  const balancePoints = (() => { const now=new Date();const today=new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59);return Array.from({length:6},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);const monthEnd=new Date(d.getFullYear(),d.getMonth()+1,0,23,59,59);const end=monthEnd>today?today:monthEnd;let value=data.accounts.reduce((sum,a)=>sum+a.startingBalance,0);data.transactions.filter(t=>new Date(t.date+'T12:00:00')<=end).forEach(t=>{if(t.type==='income')value+=t.amount;if(t.type==='expense')value-=t.amount;});return {label:new Intl.DateTimeFormat('nl-NL',{month:'short'}).format(d),value};});})();
  const minBalance=Math.min(...balancePoints.map(p=>p.value)); const maxBalance=Math.max(...balancePoints.map(p=>p.value));


  const addQuickTransaction=(e:React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    const categoryId=String(f.get('categoryId')||'');
    setData({...data,transactions:[{
      id:crypto.randomUUID(),
      type:quickType,
      amount:Number(f.get('amount')),
      description:String(f.get('description')),
      date:String(f.get('date')),
      accountId:String(f.get('accountId')),
      categoryId:categoryId||undefined,
    },...data.transactions]});
    setQuickOpen(false);
  };

  return (
    <>
      <header>
        <p className="eyebrow">Overzicht</p>
        <h1>Mijn geld</h1>
        <p className="muted">Je financiële situatie in één oogopslag.</p>
      </header>

      <section className="quick-add-card">
        <button className="quick-add-button" onClick={()=>{setQuickType('expense');setQuickOpen(true)}}><Plus size={18}/><span><b>Snelle transactie</b><small>Voeg direct een inkomst of uitgave toe</small></span></button>
      </section>

      <Modal open={quickOpen} title="Snelle transactie" onClose={()=>setQuickOpen(false)}>
        <form className="form modal-form" onSubmit={addQuickTransaction}>
          <select value={quickType} onChange={e=>setQuickType(e.target.value as 'expense'|'income')}><option value="expense">Uitgave</option><option value="income">Inkomst</option></select>
          <input name="description" placeholder="Omschrijving" required autoFocus/>
          <input name="amount" type="number" min="0.01" step="0.01" placeholder="Bedrag" required/>
          <label className="field-label date-field">Datum<input name="date" type="date" defaultValue={new Date().toISOString().slice(0,10)} required/></label>
          <select name="accountId" required>{data.accounts.map(a=><option value={a.id} key={a.id}>{a.name}</option>)}</select>
          <select name="categoryId" required><option value="">Kies een categorie</option>{data.categories.filter(c=>c.type===quickType).map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select>
          <button className="primary">Transactie opslaan</button>
        </form>
      </Modal>


      <section className="hero">
        <span>Totaal saldo</span>
        <strong>{euro(total)}</strong>
        <small>Over al je rekeningen</small>
      </section>

      <div className="month-switcher" aria-label="Maand selecteren">
        <button
          className="month-button"
          onClick={() => setSelectedMonth(month => shiftMonth(month, -1))}
          aria-label="Vorige maand"
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <small>Maandoverzicht</small>
          <strong>{monthLabel(selectedMonth)}</strong>
        </div>
        <button
          className="month-button"
          onClick={() => setSelectedMonth(month => shiftMonth(month, 1))}
          aria-label="Volgende maand"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="stats">
        <article>
          <div className="icon"><ArrowUpRight /></div>
          <span>Inkomsten</span>
          <b>{euro(income)}</b>
        </article>
        <article>
          <div className="icon"><ArrowDownRight /></div>
          <span>Uitgaven</span>
          <b>{euro(expenses)}</b>
        </article>
        <article>
          <div className="icon"><PiggyBank /></div>
          <span>Over</span>
          <b>{euro(income - expenses)}</b>
        </article>
      </div>

      <section className="card month-summary">
        <div className="section-title"><div><h2>Maandoverzicht</h2><p>Vergelijking met {monthLabel(previousMonth)}</p></div></div>
        <div className="month-summary-grid"><span>Inkomsten <b>{euro(income)}</b><small>{income-previousIncome>=0?'+ ':''}{euro(income-previousIncome)} t.o.v. vorige maand</small></span><span>Uitgaven <b>{euro(expenses)}</b><small>{expenses-previousExpenses>=0?'+ ':''}{euro(expenses-previousExpenses)} t.o.v. vorige maand</small></span><span>Gespaard <b>{euro(saved)}</b><small>Netto naar spaarrekeningen</small></span><span>Over <b>{euro(income-expenses)}</b><small>Inkomsten min uitgaven</small></span></div>
      </section>

      <section className="card spendable-card">
        <div className="section-title"><div><h2>Vrij te besteden</h2><p>Komende 31 dagen op basis van je planning</p></div><CalendarClock size={20}/></div>
        <strong className="spendable-value">{euro(free.value)}</strong>
        <div className="spendable-breakdown"><span>Beschikbaar op betaal- en contante rekeningen <b>{euro(free.checking)}</b></span><span>Verwachte inkomsten <b className="income">+ {euro(free.incoming)}</b></span><span>Nog te betalen <b className="expense">- {euro(free.outgoing)}</b></span></div>
      </section>

      <section className="card until-income-card">
        <div className="section-title"><div><h2>Tot je volgende inkomen</h2><p>{untilIncome.nextIncome?`Tot ${untilIncome.nextIncome.toLocaleDateString('nl-NL',{weekday:'long',day:'numeric',month:'long'})}`:'Geen volgend terugkerend inkomen gevonden'}</p></div><CalendarClock size={20}/></div>
        <strong className={untilIncome.value>=0?'spendable-value':'spendable-value expense'}>{euro(untilIncome.value)}</strong>
        {untilIncome.nextIncome&&<div className="spendable-breakdown">
          <span>Huidig beschikbaar <b>{euro(untilIncome.checking)}</b></span>
          <span>Nog te betalen vóór inkomen <b className="expense">- {euro(untilIncome.outgoing)}</b></span>
          <span>Richtbedrag per dag <b>{euro(untilIncome.daily)}</b></span>
        </div>}
      </section>

      <section className="card"><div className="section-title"><div><h2>Saldoontwikkeling</h2><p>Laatste 6 maanden</p></div><TrendingUp size={20}/></div><div className="balance-chart">{balancePoints.map(p=>{const range=maxBalance-minBalance||1;const h=22+((p.value-minBalance)/range)*78;return <div className="balance-column" key={p.label}><span>{euro(p.value)}</span><i style={{height:`${h}%`}}/><small>{p.label}</small></div>})}</div></section>

      {due.length>0&&<section className="card due-card"><div className="section-title"><div><h2>Te verwerken</h2><p>Verwachte transacties die inmiddels zijn gepland</p></div><CalendarClock size={20}/></div>{due.map(entry=><div className="due-row" key={entry.key}><div><b>{entry.item.description}</b><small>{entry.date.toLocaleDateString('nl-NL')} · {entry.item.type==='income'?'+ ':'- '}{euro(entry.item.amount)}</small></div><div className="due-actions"><button className="primary compact" onClick={()=>processRecurring(entry)}>Toevoegen</button><button className="secondary compact" onClick={()=>skipRecurring(entry.key)}>Overslaan</button></div></div>)}</section>}

      <section className="card"><div className="section-title"><div><h2>Verwachte transacties</h2><p>Komende 45 dagen</p></div><CalendarClock size={20}/></div>{forecast.length===0?<div className="empty">Voeg terugkerende transacties toe om vooruit te kijken.</div>:forecast.map(({item,date})=><div className="row" key={`${item.id}-${date.toISOString()}`}><div><b>{item.description}</b><small>{date.toLocaleDateString('nl-NL',{day:'numeric',month:'short'})}</small></div><strong className={item.type}>{item.type==='income'?'+ ':'- '}{euro(item.amount)}</strong></div>)}</section>


      <section className="card financial-calendar">
        <div className="section-title"><div><h2>Financiële kalender</h2><p>{monthLabel(selectedMonth)} · werkelijk en verwacht</p></div><CalendarClock size={20}/></div>
        {calendar.length===0?<div className="empty">Geen transacties of geplande betalingen in deze maand.</div>:
          <div className="calendar-list">{calendar.map(item=><div className="calendar-row" key={`${item.kind}-${item.id}`}>
            <div className="calendar-date"><b>{item.date.getDate()}</b><small>{item.date.toLocaleDateString('nl-NL',{weekday:'short'})}</small></div>
            <div className="calendar-info"><b>{item.description}</b><small><span className={`calendar-status ${item.kind}`}>{item.kind==='actual'?'Werkelijk':'Verwacht'}</span></small></div>
            <strong className={item.type}>{item.type==='income'?'+ ':item.type==='expense'?'- ':''}{euro(item.amount)}</strong>
          </div>)}</div>}
      </section>

      <section className="card forecast-card">
        <div className="section-title"><div><h2>Saldo-prognose</h2><p>Verwacht verloop van je betaal- en contante saldo, komende 45 dagen</p></div><TrendingUp size={20}/></div>
        <div className="forecast-summary"><span>Nu <b>{euro(projection[0]?.balance??0)}</b></span><span>Na planning <b>{euro(projection.at(-1)?.balance??0)}</b></span></div>
        <div className="forecast-timeline">
          {projection.slice(0,12).map((point,i)=><div className="forecast-row" key={`${+point.date}-${i}`}>
            <div><b>{point.label}</b><small>{point.date.toLocaleDateString('nl-NL',{day:'numeric',month:'short'})}</small></div>
            <strong className={point.balance<0?'expense':''}>{euro(point.balance)}</strong>
          </div>)}
        </div>
      </section>

      <section className="card fixed-costs-card">
        <div className="section-title"><div><h2>Vaste lasten</h2><p>Je structurele uitgaven</p></div><ArrowDownRight size={20}/></div>
        <div className="fixed-cost-summary">
          <span><small>Per maand</small><b>{euro(fixedMonthly)}</b></span>
          <span><small>Per jaar</small><b>{euro(fixedMonthly*12)}</b></span>
          <span><small>Van gemiddeld inkomen</small><b>{Math.round(fixedShare)}%</b></span>
        </div>
        {fixedCosts.length===0?<div className="empty">Markeer terugkerende uitgaven als vaste last om dit overzicht te vullen.</div>:
          fixedCosts.slice(0,8).map(item=><div className="row fixed-cost-row" key={item.id}><div><b>{item.description}</b><small>{Math.round(fixedMonthly?item.monthly/fixedMonthly*100:0)}% van je vaste lasten</small></div><strong>{euro(item.monthly)} p/m</strong></div>)}
      </section>

      <section className="card insights-card">
        <div className="section-title"><div><h2>Inzichten</h2><p>Gebaseerd op de laatste 6 maanden</p></div><TrendingUp size={20}/></div>
        <div className="insight-grid">
          <span><small>Gemiddelde uitgaven</small><b>{euro(avgExpenses)}</b><em>per maand</em></span>
          <span><small>Gemiddelde inkomsten</small><b>{euro(avgIncome)}</b><em>per maand</em></span>
          <span><small>Gemiddeld over</small><b>{euro(avgIncome-avgExpenses)}</b><em>per maand</em></span>
          <span><small>Spaarpercentage</small><b>{Math.round(savingsRate)}%</b><em>van gemiddeld inkomen</em></span>
        </div>
        {largestExpense&&<div className="insight-highlight"><span>Grootste uitgave</span><b>{largestExpense.description}</b><strong>{euro(largestExpense.amount)}</strong></div>}
        <div className="insight-months">{insightMonths.map(m=><div key={m.key}><small>{m.label}</small><i style={{height:`${Math.max(6,Math.min(100,avgExpenses?m.expenses/Math.max(...insightMonths.map(x=>x.expenses),1)*100:6))}%`}}/><span>{euro(m.expenses)}</span></div>)}</div>
      </section>


      <section className="card category-overview">
        <div className="section-title">
          <div>
            <h2>Uitgaven per categorie</h2>
            <p>{monthLabel(selectedMonth)}</p>
          </div>
          <Tag size={20} />
        </div>

        {categoryExpenses.length === 0 ? (
          <div className="empty category-empty">
            Nog geen uitgaven in deze maand.
          </div>
        ) : (
          <>
            <div className="category-chart">
              {categoryExpenses.map(category => (
                <div className="category-chart-row" key={category.name}>
                  <div className="category-chart-head">
                    <span>{category.name}</span>
                    <strong>{euro(category.amount)}</strong>
                  </div>
                  <div
                    className="category-bar-track"
                    role="img"
                    aria-label={`${category.name}: ${euro(category.amount)}, ${Math.round(category.percentage)}% van je uitgaven`}
                  >
                    <i
                      className="category-bar"
                      style={{
                        width: `${maxCategoryAmount > 0
                          ? (category.amount / maxCategoryAmount) * 100
                          : 0}%`,
                      }}
                    />
                  </div>
                  <small>{Math.round(category.percentage)}% van je uitgaven</small>
                </div>
              ))}
            </div>
            <div className="category-total">
              <span>Totale uitgaven</span>
              <strong>{euro(expenses)}</strong>
            </div>
          </>
        )}
      </section>

      <section className="card">
        <div className="section-title">
          <div>
            <h2>Rekeningen</h2>
            <p>Actuele saldi</p>
          </div>
          <Landmark size={20} />
        </div>
        {balances.map(account => (
          <div className="row" key={account.id}>
            <div>
              <b>{account.name}</b>
              <small>
                {account.type === 'savings'
                  ? 'Spaarrekening'
                  : account.type === 'cash'
                    ? 'Contant'
                    : 'Betaalrekening'}
              </small>
            </div>
            <strong>{euro(account.balance)}</strong>
          </div>
        ))}
      </section>

      <section className="card">
        <div className="section-title">
          <div>
            <h2>Spaardoelen</h2>
            <p>Waar je naartoe werkt</p>
          </div>
          <PiggyBank size={20} />
        </div>
        {data.savingsGoals.map(goal => {
          const percentage = Math.min(
            100,
            Math.round((goal.currentAmount / goal.targetAmount) * 100)
          );
          return (
            <div className="goal" key={goal.id}>
              <div className="goal-top">
                <b>{goal.name}</b>
                <span>{euro(goal.currentAmount)} van {euro(goal.targetAmount)}</span>
              </div>
              <div className="progress">
                <i style={{ width: `${percentage}%` }} />
              </div>
              <small>{percentage}% behaald</small>
            </div>
          );
        })}
      </section>
    </>
  );
}
