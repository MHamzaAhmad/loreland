import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useGames, useSearchGames } from '@packages/ui-logic'
import { Plus } from 'lucide-react'
import { Button } from '../components/ui/8bit/button'
import { GameCard } from '../components/GameCard'
import { SearchBar } from '../components/SearchBar'
import { AuthButton } from '../components/AuthButton'

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
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="text-center mb-8 relative">
        <div className="absolute right-0 top-0">
          <AuthButton />
        </div>
        <h1 className="text-2xl md:text-4xl mb-2 text-[var(--8bit-primary)]">
          LORELAND
        </h1>
        <p className="text-[10px] md:text-xs text-[var(--8bit-muted-foreground)]">
          Create Your Adventure
        </p>
      </header>

      {/* Actions */}
      <div className="max-w-4xl mx-auto mb-8 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="flex-1">
          <SearchBar onSearch={setSearchQuery} />
        </div>
        <Link to="/games/new">
          <Button className="w-full md:w-auto">
            <Plus className="h-4 w-4" />
            <span className="text-xs">NEW GAME</span>
          </Button>
        </Link>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto">
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-xs animate-pulse">Loading...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-xs text-[var(--8bit-destructive)]">
              Failed to load games
            </p>
          </div>
        )}

        {!isLoading && games.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <p className="text-6xl">🎮</p>
            <p className="text-xs text-[var(--8bit-muted-foreground)]">
              {searchQuery ? 'No games found' : 'No games yet'}
            </p>
            {!searchQuery && (
              <Link to="/games/new">
                <Button size="lg">
                  <span className="text-xs">CREATE YOUR FIRST GAME</span>
                </Button>
              </Link>
            )}
          </div>
        )}

        {games.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
