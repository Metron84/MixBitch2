export type NavView = 'game' | 'rules' | 'stats'

interface NavBarProps {
  currentView: NavView
  onNavigate: (view: NavView) => void
  onNewGame: () => void
}

function navLinkClass(currentView: NavView, view: NavView): string {
  const base = 'text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2 rounded px-3 py-2.5 sm:px-2 sm:py-1 min-h-[44px] sm:min-h-0 flex items-center'
  const active = 'text-lebanon-red underline'
  const inactive = 'text-cedar-dark dark:text-green-200 hover:text-lebanon-red hover:underline'
  return `${base} ${currentView === view ? active : inactive}`
}

export function NavBar({ currentView, onNavigate, onNewGame }: NavBarProps) {
  return (
    <nav
      className="flex items-center justify-between w-full px-4 py-3 min-h-[52px] sm:min-h-0 bg-setup-header border-b-4 border-b-lebanon-red shadow-sm flex-nowrap gap-2"
      aria-label="Main navigation"
    >
      <button
        type="button"
        onClick={() => onNavigate('game')}
        className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2 focus-visible:ring-offset-table rounded"
      >
        <span className="border-b-4 border-lebanon-red pb-1">
          <span
            className={`text-xl font-bold font-heading ${
              currentView === 'game' ? 'text-cedar-dark dark:text-green-100' : 'text-cedar-dark/80 dark:text-green-200 hover:text-cedar-dark dark:hover:text-green-100'
            }`}
          >
            Mix Bitch
          </span>
        </span>
      </button>
      <div className="flex items-center gap-2 flex-nowrap min-h-[44px]">
        <button
          type="button"
          onClick={() => onNavigate('rules')}
          className={navLinkClass(currentView, 'rules')}
        >
          Rules
        </button>
        <button
          type="button"
          onClick={() => onNavigate('stats')}
          className={navLinkClass(currentView, 'stats')}
        >
          Stats
        </button>
        <button
          type="button"
          onClick={onNewGame}
          className="text-sm font-medium text-cedar-dark dark:text-green-200 hover:text-lebanon-red focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2 rounded px-3 py-2.5 sm:px-2 sm:py-1 min-h-[44px] sm:min-h-0 flex items-center"
        >
          New game
        </button>
      </div>
    </nav>
  )
}
