import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useGames } from '@packages/ui-logic'
import { Plus, MagnifyingGlass, Books } from '@phosphor-icons/react'
import { Button } from '../components/ui/8bit/button'
import { GameCard } from '../components/GameCard'
import { Pagination } from '../components/common/Pagination'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const LIMIT = 12

  const gamesQuery = useGames({
    search: searchQuery,
    public: true, // Show only public games on home
    limit: LIMIT,
    offset: (page - 1) * LIMIT
  })

  // Reset page when search changes
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPage(1)
  }

  const games = gamesQuery.data?.games ?? []
  const totalCount = gamesQuery.data?.pagination?.count ?? 0
  const totalPages = Math.ceil(totalCount / LIMIT)

  const isLoading = gamesQuery.isLoading
  const error = gamesQuery.error

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-4">
          <h1 className="text-sm font-semibold text-foreground shrink-0 hidden sm:block">Worlds</h1>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search worlds..."
                className="w-full h-9 pl-9 pr-4 rounded-lg border border-border/60 bg-secondary/30 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </form>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Link to="/games/mine">
              <Button variant="ghost" size="sm" className="h-9 w-9 sm:w-auto sm:px-3 text-sm gap-1.5 p-0 sm:p-2">
                <Books size={16} />
                <span className="hidden sm:inline">My Worlds</span>
              </Button>
            </Link>
            <Link to="/games/new">
              <Button size="sm" className="h-9 w-9 sm:w-auto sm:px-3 text-sm gap-1.5 p-0 sm:p-2">
                <Plus size={16} weight="bold" />
                <span className="hidden sm:inline">Create</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="py-20 text-center space-y-2">
            <div className="text-destructive font-medium">Unable to load worlds</div>
            <p className="text-sm text-muted-foreground">Please try again later.</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && games.length === 0 && (
          <div className="py-24 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center text-2xl text-muted-foreground">
              🌍
            </div>
            <div className="space-y-1">
              <h3 className="font-medium text-foreground">
                {searchQuery ? 'No matching worlds' : 'No worlds yet'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : "Be the first to create a world."}
              </p>
            </div>
            {!searchQuery && (
              <Link to="/games/new">
                <Button size="sm" className="mt-2">Create World</Button>
              </Link>
            )}
          </div>
        )}

        {/* Games Grid */}
        {games.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {games.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex justify-center">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
