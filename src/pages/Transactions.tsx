import { useState } from 'react';
import { Plus, Trash2, Sparkles } from 'lucide-react';
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

    setData({ ...data, transactions: [transaction, ...data.transactions] });
    setOpen(false);
    setDescription('');
    setCategoryId('');
    setAutoCategory(false);
    setRemember(true);
    setType('expense');
  };

  const del = (id: string) =>
    setData({ ...data, transactions: data.transactions.filter(t => t.id !== id) });

  return (
    <>
      <header className="with-action">
        <div>
          <p className="eyebrow">Beheer</p>
          <h1>Transacties</h1>
          <p className="muted">Voeg inkomsten, uitgaven en overboekingen toe.</p>
        </div>
        <button className="primary" onClick={() => setOpen(!open)}>
          <Plus size={18} />Transactie
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

          <input name="amount" type="number" step="0.01" min="0.01" placeholder="Bedrag" required />
          <input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />

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

          <button className="primary" type="submit">Opslaan</button>
        </form>
      )}

      <section className="card">
        {data.transactions.length === 0 ? (
          <div className="empty">Nog geen transacties. Voeg je eerste transactie toe.</div>
        ) : data.transactions.map(t => {
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
                <button className="icon-button" onClick={() => del(t.id)} aria-label="Verwijderen">
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
