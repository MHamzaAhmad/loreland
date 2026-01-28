import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useGames } from '@packages/ui-logic'
import { Plus } from '@phosphor-icons/react'
import { Button } from '../components/ui/8bit/button'
import { GameCard } from '../components/GameCard'
import { SearchBar } from '../components/SearchBar'
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
    public: true, // Show public games on home
    limit: LIMIT,
    offset: (page - 1) * LIMIT
  })

  // Reset page when search changes
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setPage(1)
  }

  const games = gamesQuery.data?.games ?? []
  const totalCount = gamesQuery.data?.pagination?.count ?? 0
  const totalPages = Math.ceil(totalCount / LIMIT)

  const isLoading = gamesQuery.isLoading
  const error = gamesQuery.error

  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="max-w-7xl mx-auto px-6 md:px-12 pt-12">

        {/* Hero / Header Section */}
        <div className="flex flex-col md:flex-row gap-8 items-end justify-between mb-12 border-b border-dashed border-border/60 pb-12">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight text-foreground">
              Worlds
            </h1>
            <p className="text-xl text-muted-foreground font-serif leading-relaxed max-w-lg">
              A collection of created realms.
            </p>
          </div>

          <div className="w-full md:w-auto">
            <Link to="/games/new">
              <Button size="lg" className="h-14 px-8 text-lg font-serif font-medium bg-foreground text-background hover:bg-foreground/90 rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
                <Plus weight="bold" className="mr-2" size={20} />
                Start New World
              </Button>
            </Link>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="mb-12">
          <SearchBar onSearch={handleSearch} placeholder="Search across worlds..." />
        </div>

        {/* Grid Content */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-3xl bg-muted/40 animate-pulse border border-border/40" />
            ))}
          </div>
        )}

        {error && (
          <div className="py-20 text-center space-y-4">
            <div className="text-destructive font-medium font-serif">Unable to load worlds</div>
            <p className="text-muted-foreground text-sm">Please check your connection and try again.</p>
          </div>
        )}

        {!isLoading && games.length === 0 && (
          <div className="py-32 text-center space-y-6">
            <div className="mx-auto w-24 h-24 bg-secondary/30 rounded-full flex items-center justify-center text-4xl text-muted-foreground">
              ⌬
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-serif font-semibold text-foreground">No worlds found</h3>
              <p className="text-muted-foreground font-serif">
                {searchQuery ? `No results for "${searchQuery}"` : "The archives are currently empty."}
              </p>
            </div>
            {!searchQuery && (
              <Link to="/games/new">
                <Button variant="dashed">Create First World</Button>
              </Link>
            )}
          </div>
        )}

        {games.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {games.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>

            <div className="mt-16 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
