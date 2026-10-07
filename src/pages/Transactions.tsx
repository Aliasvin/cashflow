import { useMemo, useState } from 'react';
import { Plus, Trash2, Sparkles, Pencil } from 'lucide-react';
import type { FinanceData, Transaction } from '../types/finance';
import { euro } from '../utils/finance';
import { rememberCategory, suggestCategory } from '../utils/categorize';

export function Transactions({ data, setData }: { data: FinanceData; setData: (d: FinanceData) => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<Transaction['type']>('expense');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [autoCategory, setAutoCategory] = useState(false);
  const [remember, setRemember] = useState(true);
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  const expenseCategories = data.categories.filter(c => c.type === 'expense');
  const incomeCategories = data.categories.filter(c => c.type === 'income');
  const visibleCategories = type === 'income' ? incomeCategories : expenseCategories;

  const updateDescription = (value: string) => {
    setDescription(value);

    if (type !== 'expense') return;
    const suggestion = suggestCategory(value, data.categories);
    if (suggestion) {
      setCategoryId(suggestion);
      setAutoCategory(true);
    } else {
      setAutoCategory(false);
    }
  };

  const changeType = (nextType: Transaction['type']) => {
    setType(nextType);
    setAutoCategory(false);

    if (nextType === 'expense') {
      const suggestion = suggestCategory(description, data.categories);
      setCategoryId(suggestion ?? expenseCategories[0]?.id ?? '');
      setAutoCategory(Boolean(suggestion));
    } else if (nextType === 'income') {
      setCategoryId(incomeCategories[0]?.id ?? '');
    } else {
      setCategoryId('');
    }
  };

  const add = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      type,
      amount: Number(f.get('amount')),
      description: String(f.get('description')),
      date: String(f.get('date')),
      accountId: String(f.get('accountId')),
    };

    if (type === 'transfer') {
      transaction.toAccountId = String(f.get('toAccountId'));
    } else {
      transaction.categoryId = categoryId || String(f.get('categoryId'));
    }

    if (type === 'expense' && remember && transaction.categoryId) {
      rememberCategory(transaction.description, transaction.categoryId);
    }

    setData({ ...data, transactions: editingId ? data.transactions.map(t => t.id === editingId ? { ...transaction, id: editingId } : t) : [transaction, ...data.transactions] });
    setOpen(false);
    setEditingId(null);
    setDescription('');
    setCategoryId('');
    setAutoCategory(false);
    setRemember(true);
    setType('expense');
  };

  const del = (id: string) =>
    setData({ ...data, transactions: data.transactions.filter(t => t.id !== id) });

  const edit = (t: Transaction) => { setEditingId(t.id); setType(t.type); setDescription(t.description); setCategoryId(t.categoryId ?? ''); setAutoCategory(false); setOpen(true); window.scrollTo({top:0,behavior:'smooth'}); };
  const filtered = useMemo(() => data.transactions.filter(t => { const q=query.toLowerCase().trim(); return (!q || t.description.toLowerCase().includes(q)) && (filterType==='all' || t.type===filterType) && (filterCategory==='all' || t.categoryId===filterCategory); }), [data.transactions,query,filterType,filterCategory]);

  return (
    <>
      <header className="with-action">
        <div>
          <p className="eyebrow">Beheer</p>
          <h1>Transacties</h1>
          <p className="muted">Voeg inkomsten, uitgaven en overboekingen toe.</p>
        </div>
        <button className="primary" onClick={() => { setOpen(!open); if(open){setEditingId(null);setDescription('');setCategoryId('');} }}>
          <Plus size={18} />{editingId ? 'Annuleren' : 'Transactie'}
        </button>
      </header>

      {open && (
        <form className="card form" onSubmit={add}>
          <select name="type" value={type} onChange={e => changeType(e.target.value as Transaction['type'])}>
            <option value="expense">Uitgave</option>
            <option value="income">Inkomst</option>
            <option value="transfer">Overboeking</option>
          </select>

          <input
            name="description"
            placeholder="Omschrijving"
            value={description}
            onChange={e => updateDescription(e.target.value)}
            required
          />

          <input name="amount" type="number" step="0.01" min="0.01" placeholder="Bedrag" defaultValue={editingId ? data.transactions.find(t=>t.id===editingId)?.amount : undefined} required />
          <input name="date" type="date" defaultValue={editingId ? data.transactions.find(t=>t.id===editingId)?.date : new Date().toISOString().slice(0, 10)} required />

          <select name="accountId">
            {data.accounts.map(a => <option value={a.id} key={a.id}>{a.name}</option>)}
          </select>

          {type !== 'transfer' && (
            <>
              <select
                name="categoryId"
                value={categoryId || visibleCategories[0]?.id || ''}
                onChange={e => {
                  setCategoryId(e.target.value);
                  setAutoCategory(false);
                }}
              >
                {visibleCategories.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}
              </select>

              {type === 'expense' && autoCategory && (
                <div className="category-hint">
                  <Sparkles size={16} />
                  Categorie automatisch herkend
                </div>
              )}

              {type === 'expense' && (
                <label className="remember-category">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                  />
                  Onthoud deze categorie voor toekomstige transacties
                </label>
              )}
            </>
          )}

          {type === 'transfer' && (
            <>
              <label className="transfer-label">Doelrekening</label>
              <select name="toAccountId" required>
                <option value="">Kies een rekening</option>
                {data.accounts.map(a => <option value={a.id} key={a.id}>{a.name}</option>)}
              </select>
            </>
          )}

          <button className="primary" type="submit">{editingId ? 'Wijzigingen opslaan' : 'Opslaan'}</button>
        </form>
      )}

      <div className="transaction-filters card"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Zoek op omschrijving"/><select value={filterType} onChange={e=>setFilterType(e.target.value)}><option value="all">Alle types</option><option value="expense">Uitgaven</option><option value="income">Inkomsten</option><option value="transfer">Overboekingen</option></select><select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)}><option value="all">Alle categorieën</option>{data.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>

      <section className="card">
        {filtered.length === 0 ? (
          <div className="empty">Nog geen transacties. Voeg je eerste transactie toe.</div>
        ) : filtered.map(t => {
          const category = data.categories.find(c => c.id === t.categoryId);
          return (
            <div className="row" key={t.id}>
              <div>
                <b>{t.description}</b>
                <small>
                  {new Date(t.date + 'T12:00:00').toLocaleDateString('nl-NL')}
                  {category ? ` · ${category.name}` : ''}
                </small>
              </div>
              <div className="amount-actions">
                <strong className={t.type}>
                  {t.type === 'income' ? '+ ' : t.type === 'expense' ? '- ' : ''}{euro(t.amount)}
                </strong>
                <button className="icon-button" onClick={() => edit(t)} aria-label="Bewerken"><Pencil size={17}/></button><button className="icon-button" onClick={() => del(t.id)} aria-label="Verwijderen">
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
