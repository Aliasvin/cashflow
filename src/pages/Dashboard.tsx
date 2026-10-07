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
} from 'lucide-react';
import type { FinanceData } from '../types/finance';
import { accountBalance, euro } from '../utils/finance';
import { dueRecurring, spendable, upcoming } from '../utils/planning';

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
  const forecast = upcoming(data, 45).slice(0, 8);
  const due=dueRecurring(data,31).slice(0,8);
  const processRecurring=(entry:(typeof due)[number])=>{const d=entry.date;const date=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;setData({...data,transactions:[{id:crypto.randomUUID(),type:entry.item.type,amount:entry.item.amount,description:entry.item.description,date,accountId:entry.item.accountId,categoryId:entry.item.categoryId},...data.transactions],processedRecurringOccurrences:[...(data.processedRecurringOccurrences??[]),entry.key]})};
  const skipRecurring=(key:string)=>setData({...data,processedRecurringOccurrences:[...(data.processedRecurringOccurrences??[]),key]});
  const balancePoints = (() => { const now=new Date(); return Array.from({length:6},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);const end=new Date(d.getFullYear(),d.getMonth()+1,0);let value=data.accounts.reduce((sum,a)=>sum+a.startingBalance,0);data.transactions.filter(t=>new Date(t.date+'T12:00:00')<=end).forEach(t=>{if(t.type==='income')value+=t.amount;if(t.type==='expense')value-=t.amount;});return {label:new Intl.DateTimeFormat('nl-NL',{month:'short'}).format(d),value};});})();
  const minBalance=Math.min(...balancePoints.map(p=>p.value)); const maxBalance=Math.max(...balancePoints.map(p=>p.value));

  return (
    <>
      <header>
        <p className="eyebrow">Overzicht</p>
        <h1>Mijn geld</h1>
        <p className="muted">Je financiële situatie in één oogopslag.</p>
      </header>

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
        <div className="section-title"><div><h2>Deze maand</h2><p>Vergelijking met {monthLabel(previousMonth)}</p></div></div>
        <div className="month-summary-grid"><span>Inkomsten <b>{euro(income)}</b><small>{income-previousIncome>=0?'+ ':''}{euro(income-previousIncome)} t.o.v. vorige maand</small></span><span>Uitgaven <b>{euro(expenses)}</b><small>{expenses-previousExpenses>=0?'+ ':''}{euro(expenses-previousExpenses)} t.o.v. vorige maand</small></span><span>Gespaard <b>{euro(saved)}</b><small>Netto naar spaarrekeningen</small></span><span>Over <b>{euro(income-expenses)}</b><small>Inkomsten min uitgaven</small></span></div>
      </section>

      <section className="card spendable-card">
        <div className="section-title"><div><h2>Vrij te besteden</h2><p>Komende 31 dagen op basis van je planning</p></div><CalendarClock size={20}/></div>
        <strong className="spendable-value">{euro(free.value)}</strong>
        <div className="spendable-breakdown"><span>Beschikbaar op betaal- en contante rekeningen <b>{euro(free.checking)}</b></span><span>Verwachte inkomsten <b className="income">+ {euro(free.incoming)}</b></span><span>Nog te betalen <b className="expense">- {euro(free.outgoing)}</b></span></div>
      </section>

      <section className="card"><div className="section-title"><div><h2>Saldoontwikkeling</h2><p>Laatste 6 maanden</p></div><TrendingUp size={20}/></div><div className="balance-chart">{balancePoints.map(p=>{const range=maxBalance-minBalance||1;const h=22+((p.value-minBalance)/range)*78;return <div className="balance-column" key={p.label}><span>{euro(p.value)}</span><i style={{height:`${h}%`}}/><small>{p.label}</small></div>})}</div></section>

      {due.length>0&&<section className="card due-card"><div className="section-title"><div><h2>Te verwerken</h2><p>Verwachte transacties die inmiddels zijn gepland</p></div><CalendarClock size={20}/></div>{due.map(entry=><div className="due-row" key={entry.key}><div><b>{entry.item.description}</b><small>{entry.date.toLocaleDateString('nl-NL')} · {entry.item.type==='income'?'+ ':'- '}{euro(entry.item.amount)}</small></div><div className="due-actions"><button className="primary compact" onClick={()=>processRecurring(entry)}>Toevoegen</button><button className="secondary compact" onClick={()=>skipRecurring(entry.key)}>Overslaan</button></div></div>)}</section>}

      <section className="card"><div className="section-title"><div><h2>Verwachte transacties</h2><p>Komende 45 dagen</p></div><CalendarClock size={20}/></div>{forecast.length===0?<div className="empty">Voeg terugkerende transacties toe om vooruit te kijken.</div>:forecast.map(({item,date})=><div className="row" key={item.id}><div><b>{item.description}</b><small>{date.toLocaleDateString('nl-NL',{day:'numeric',month:'short'})}</small></div><strong className={item.type}>{item.type==='income'?'+ ':'- '}{euro(item.amount)}</strong></div>)}</section>

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
