import { useState, useCallback } from 'react'
import { GameBoard } from './components/GameBoard'
import { NavBar, type NavView } from './components/NavBar'
import { RulesPage } from './components/RulesPage'
import { StatsPage } from './components/StatsPage'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useGameStore } from './stores/gameStore'

function App() {
  const [view, setView] = useState<NavView>('game')
  const backToSetup = useGameStore((s) => s.backToSetup)

  const handleNewGame = useCallback(() => {
    backToSetup()
    setView('game')
  }, [backToSetup])

  const handleBackToGame = useCallback(() => setView('game'), [])

  const handleGameRecovery = useCallback(() => {
    backToSetup()
    setView('game')
  }, [backToSetup])

  return (
    <div className="min-h-screen bg-table flex flex-col">
      <NavBar currentView={view} onNavigate={setView} onNewGame={handleNewGame} />
      {view === 'game' && (
        <ErrorBoundary onRecovery={handleGameRecovery} recoveryLabel="New game">
          <GameBoard />
        </ErrorBoundary>
      )}
      {view === 'rules' && <RulesPage onBackToGame={handleBackToGame} />}
      {view === 'stats' && <StatsPage onBackToGame={handleBackToGame} />}
    </div>
  )
}

export default App
