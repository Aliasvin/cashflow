import type { ReactNode } from 'react';
import { House, ArrowLeftRight, WalletCards, Target, MoreHorizontal, Repeat2 } from 'lucide-react';

export type Page = 'dashboard' | 'transactions' | 'accounts' | 'recurring' | 'savings' | 'settings';

const desktopItems: [Page, string, any][] = [
  ['dashboard', 'Dashboard', House],
  ['transactions', 'Transacties', ArrowLeftRight],
  ['accounts', 'Rekeningen', WalletCards],
  ['recurring', 'Terugkerend', Repeat2],
  ['savings', 'Spaardoelen', Target],
  ['settings', 'Instellingen', MoreHorizontal],
];

const mobileItems: [Page, string, any][] = [
  ['dashboard', 'Dashboard', House],
  ['transactions', 'Transacties', ArrowLeftRight],
  ['accounts', 'Rekeningen', WalletCards],
  ['recurring', 'Terugkerend', Repeat2],
  ['savings', 'Spaardoelen', Target],
  ['settings', 'Meer', MoreHorizontal],
];

export function Layout({
  page,
  setPage,
  children,
}: {
  page: Page;
  setPage: (p: Page) => void;
  children: ReactNode;
}) {
  return (
    <div className="shell">
      <aside>
        <div className="brand">
          <div className="logo">€</div>
          <span>Mijn geld</span>
        </div>

        <nav>
          {desktopItems.map(([id, label, Icon]) => (
            <button
              key={id}
              className={page === id ? 'active' : ''}
              onClick={() => setPage(id)}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main>{children}</main>

      <div className="mobile-nav" aria-label="Mobiele navigatie">
        {mobileItems.map(([id, label, Icon]) => (
          <button
            key={id}
            className={page === id ? 'active' : ''}
            onClick={() => setPage(id)}
            aria-label={id === 'settings' ? 'Meer en instellingen' : label}
          >
            <Icon size={20} />
            <small>{label}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
