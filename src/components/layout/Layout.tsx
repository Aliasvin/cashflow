import { useState, type ReactNode } from 'react';
import { House, ArrowLeftRight, WalletCards, Target, MoreHorizontal, Repeat2, PlayingCards, Settings } from 'lucide-react';

export type Page = 'dashboard' | 'transactions' | 'accounts' | 'recurring' | 'savings' | 'pokemon' | 'settings';

const desktopItems: [Page, string, any][] = [
  ['dashboard', 'Dashboard', House],
  ['transactions', 'Transacties', ArrowLeftRight],
  ['accounts', 'Rekeningen', WalletCards],
  ['recurring', 'Terugkerend', Repeat2],
  ['pokemon', 'Pokémon', PlayingCardsFan],
  ['savings', 'Spaardoelen', Target],
  ['settings', 'Instellingen', Settings],
];

const mobileItems: [Page, string, any][] = [
  ['dashboard', 'Dashboard', House],
  ['transactions', 'Transacties', ArrowLeftRight],
  ['accounts', 'Rekeningen', WalletCards],
  ['recurring', 'Terugkerend', Repeat2],
  ['pokemon', 'Pokémon', PlayingCardsFan],
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
  const [moreOpen, setMoreOpen] = useState(false);

  const navigate = (target: Page) => {
    setPage(target);
    setMoreOpen(false);
  };

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
              onClick={() => navigate(id)}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main>{children}</main>

      {moreOpen && (
        <>
          <button
            className="mobile-more-backdrop"
            aria-label="Menu sluiten"
            onClick={() => setMoreOpen(false)}
          />
          <div className="mobile-more-menu" role="menu" aria-label="Meer">
            <button role="menuitem" onClick={() => navigate('savings')}>
              <Target size={19} />
              <span>
                <b>Spaardoelen</b>
                <small>Bekijk en beheer je spaardoelen</small>
              </span>
            </button>
            <button role="menuitem" onClick={() => navigate('settings')}>
              <Settings size={19} />
              <span>
                <b>Instellingen</b>
                <small>Categorieën, thema, back-up en gegevens</small>
              </span>
            </button>
          </div>
        </>
      )}

      <div className="mobile-nav" aria-label="Mobiele navigatie">
        {mobileItems.map(([id, label, Icon]) => (
          <button
            key={id}
            className={page === id ? 'active' : ''}
            onClick={() => navigate(id)}
          >
            <Icon size={20} />
            <small>{label}</small>
          </button>
        ))}
        <button
          className={moreOpen || page === 'savings' || page === 'settings' ? 'active' : ''}
          onClick={() => setMoreOpen(open => !open)}
          aria-expanded={moreOpen}
          aria-label="Meer"
        >
          <MoreHorizontal size={20} />
          <small>Meer</small>
        </button>
      </div>
    </div>
  );
}
