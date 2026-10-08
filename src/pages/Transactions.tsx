import { useMemo, useState } from 'react';
import { Plus, Trash2, Sparkles, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import type { FinanceData, Transaction } from '../types/finance';
import { euro } from '../utils/finance';
import { rememberCategory, suggestCategory } from '../utils/categorize';
import { Modal } from '../components/ui/Modal';

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
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const changeMonth = (offset: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const next = new Date(year, month - 1 + offset, 1);
    setSelectedMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
  };

  const monthLabel = new Date(`${selectedMonth}-01T12:00:00`).toLocaleDateString('nl-NL', {
    month: 'long',
    year: 'numeric',
  });

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

  const edit = (t: Transaction) => { setEditingId(t.id); setType(t.type); setDescription(t.description); setCategoryId(t.categoryId ?? ''); setAutoCategory(false); setOpen(true); };
  const closeModal=()=>{setOpen(false);setEditingId(null);setDescription('');setCategoryId('');setAutoCategory(false);setRemember(true);setType('expense')};
  const filtered = useMemo(() => data.transactions
    .filter(t => {
      const q=query.toLowerCase().trim();
      return t.date.startsWith(selectedMonth)
        && (!q || t.description.toLowerCase().includes(q))
        && (filterType==='all' || t.type===filterType)
        && (filterCategory==='all' || t.categoryId===filterCategory);
    })
    .sort((a,b) => b.date.localeCompare(a.date)), [data.transactions,query,filterType,filterCategory,selectedMonth]);

  const grouped = [
    { key: 'income', title: 'Inkomsten', items: filtered.filter(t => t.type === 'income') },
    { key: 'expense', title: 'Uitgaven', items: filtered.filter(t => t.type === 'expense') },
    { key: 'transfer', title: 'Overboekingen', items: filtered.filter(t => t.type === 'transfer') },
  ].filter(group => group.items.length > 0);

  return (
    <>
      <header className="with-action">
        <div>
          <p className="eyebrow">Beheer</p>
          <h1>Transacties</h1>
          <p className="muted">Voeg inkomsten, uitgaven en overboekingen toe.</p>
        </div>
        <button className="primary" onClick={() => { if(open) closeModal(); else setOpen(true); }}>
          <Plus size={18} />{editingId ? 'Annuleren' : 'Transactie'}
        </button>
      </header>

      <Modal open={open} title={editingId?'Transactie bewerken':'Transactie toevoegen'} onClose={closeModal}>
        <form className="form modal-form" onSubmit={add}>
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
          <label className="field-label date-field transaction-date-field">
            Datum
            <input name="date" type="date" defaultValue={editingId ? data.transactions.find(t=>t.id===editingId)?.date : new Date().toISOString().slice(0, 10)} required />
          </label>

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
      </Modal>

      <div className="month-switcher transaction-month-switcher">
        <button className="month-button" type="button" onClick={() => changeMonth(-1)} aria-label="Vorige maand">
          <ChevronLeft size={18}/>
        </button>
        <div>
          <small>Transacties van</small>
          <strong>{monthLabel}</strong>
        </div>
        <button className="month-button" type="button" onClick={() => changeMonth(1)} aria-label="Volgende maand">
          <ChevronRight size={18}/>
        </button>
      </div>

      <div className="transaction-filters card"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Zoek op omschrijving"/><select value={filterType} onChange={e=>setFilterType(e.target.value)}><option value="all">Alle types</option><option value="expense">Uitgaven</option><option value="income">Inkomsten</option><option value="transfer">Overboekingen</option></select><select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)}><option value="all">Alle categorieën</option>{data.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>

      <div className="transaction-groups">
        {filtered.length === 0 ? (
          <section className="card">
            <div className="empty">Geen transacties in {monthLabel}.</div>
          </section>
        ) : grouped.map(group => (
          <section className="card transaction-group" key={group.key}>
            <div className="transaction-group-title">
              <h2>{group.title}</h2>
              <span>{group.items.length}</span>
            </div>
            {group.items.map(t => {
              const category = data.categories.find(c => c.id === t.categoryId);
              return (
                <div className="transaction-row" key={t.id}>
                  <div className="transaction-info">
                    <b>{t.description}</b>
                    <small>
                      {new Date(t.date + 'T12:00:00').toLocaleDateString('nl-NL')}
                      {category ? ` · ${category.name}` : ''}
                    </small>
                  </div>
                  <strong className={`transaction-amount ${t.type}`}>
                    {t.type === 'income' ? '+ ' : t.type === 'expense' ? '- ' : ''}{euro(t.amount)}
                  </strong>
                  <div className="transaction-actions">
                    <button className="transaction-action" onClick={() => edit(t)}>
                      <Pencil size={15}/><span>Bewerken</span>
                    </button>
                    <button className="transaction-action danger-action" onClick={() => del(t.id)}>
                      <Trash2 size={15}/><span>Verwijderen</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </>
  );
}
