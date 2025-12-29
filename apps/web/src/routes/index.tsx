import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useGames, useSearchGames } from '@packages/ui-logic'
import { Plus } from 'lucide-react'
import { Button } from '../components/ui/8bit/button'
import { GameCard } from '../components/GameCard'
import { SearchBar } from '../components/SearchBar'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const [searchQuery, setSearchQuery] = useState('')

  // Use search if query exists, otherwise list all
  const gamesQuery = useGames({ enabled: !searchQuery })
  const searchResults = useSearchGames(searchQuery, { enabled: !!searchQuery })

  const games = searchQuery
    ? searchResults.data?.results ?? []
    : gamesQuery.data?.games ?? []

  const isLoading = searchQuery ? searchResults.isLoading : gamesQuery.isLoading
  const error = searchQuery ? searchResults.error : gamesQuery.error

  return (
    <div className="min-h-screen p-4 md:p-8 relative">
      <div className="hud-bracket absolute inset-4 pointer-events-none opacity-10" />

      {/* Actions */}
      <div className="max-w-4xl mx-auto mb-16 flex flex-col md:flex-row gap-8 items-stretch md:items-center relative z-10">
        <div className="flex-1">
          <SearchBar onSearch={setSearchQuery} />
        </div>
        <Link to="/games/new">
          <Button variant="default" className="w-full md:w-auto shadow-[var(--hud-glow)] group/init">
            <Plus className="h-4 w-4 mr-2 group-hover/init:rotate-90 transition-transform" />
            <span className="font-bold tracking-[0.3em] text-xs">INITIALIZE_VISION_CORE</span>
          </Button>
        </Link>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto relative z-10">
        {isLoading && (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <div className="size-12 border-2 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
            <p className="text-[10px] font-mono tracking-[0.4em] animate-pulse text-[var(--primary)]">SYNCING_WITH_NEURAL_GRID...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-20 hud-panel p-8 border-[var(--destructive)]/50">
            <div className="hud-bracket absolute inset-0 opacity-40 border-[var(--destructive)]" />
            <p className="text-xs font-mono text-[var(--destructive)] tracking-widest uppercase">
              CRITICAL_ERR: DATA_SYNC_FAILED
            </p>
            <p className="text-[10px] text-[var(--destructive)]/60 mt-2">Check connection to vision-array</p>
          </div>
        )}

        {!isLoading && games.length === 0 && (
          <div className="text-center py-20 hud-panel p-12 space-y-8">
            <div className="hud-bracket absolute inset-0 opacity-20" />
            <div className="text-6xl opacity-20 grayscale scale-110">⌬</div>
            <div className="space-y-2">
              <p className="text-xs font-mono tracking-[0.5em] text-[var(--primary)]/60">
                {searchQuery ? 'NO_MATCHING_OBJECTS_FOUND' : 'DATABASE_EMPTY // 0x00'}
              </p>
              <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-widest">Awaiting vision core initialization</p>
            </div>
            {!searchQuery && (
              <Link to="/games/new">
                <Button variant="outline" size="lg">
                  <span className="text-xs tracking-[0.3em]">INIT_FIRST_VISION</span>
                </Button>
              </Link>
            )}
          </div>
        )}

        {games.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
