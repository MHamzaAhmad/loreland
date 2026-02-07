import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useGames } from '@packages/ui-logic'
import { Plus, MagnifyingGlass, Globe, ArrowLeft } from '@phosphor-icons/react'
import { Button } from '../../components/ui/8bit/button'
import { GameCard } from '../../components/GameCard'
import { Pagination } from '../../components/common/Pagination'

export const Route = createFileRoute('/games/mine')({
    component: MyGames,
})

function MyGames() {
    const [searchQuery, setSearchQuery] = useState('')
    const [page, setPage] = useState(1)
    const LIMIT = 12

    // Only fetch user's own games
    const { data, isLoading, error } = useGames({
        search: searchQuery,
        public: false,
        limit: LIMIT,
        offset: (page - 1) * LIMIT
    })

    const games = data?.games ?? []
    const totalCount = data?.pagination?.count ?? 0
    const totalPages = Math.ceil(totalCount / LIMIT)

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setPage(1)
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Compact Header */}
            <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 shrink-0">
                        <Link to="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors group">
                            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        </Link>
                        <h1 className="text-sm font-semibold text-foreground">My Worlds</h1>
                    </div>

                    {/* Search */}
                    <form onSubmit={handleSearch} className="flex-1 max-w-md">
                        <div className="relative">
                            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search your worlds..."
                                className="w-full h-9 pl-9 pr-4 rounded-lg border border-border/60 bg-secondary/30 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>
                    </form>

                    <div className="flex items-center gap-2 shrink-0">
                        <Link to="/">
                            <Button variant="ghost" size="sm" className="h-9 px-3 text-sm gap-1.5">
                                <Globe size={16} />
                                <span className="hidden sm:inline">Gallery</span>
                            </Button>
                        </Link>
                        <Link to="/games/new">
                            <Button size="sm" className="h-9 px-3 text-sm gap-1.5">
                                <Plus size={16} weight="bold" />
                                <span className="hidden sm:inline">Create</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-8">
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
                        <div className="text-destructive font-medium">Unable to load your worlds</div>
                        <p className="text-sm text-muted-foreground">Please try again later.</p>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && games.length === 0 && (
                    <div className="py-24 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center text-2xl text-muted-foreground">
                            📚
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-medium text-foreground">
                                {searchQuery ? 'No matching worlds' : 'No worlds yet'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {searchQuery
                                    ? `No results for "${searchQuery}"`
                                    : "Create your first world or copy one from the gallery."}
                            </p>
                        </div>
                        {!searchQuery && (
                            <div className="flex gap-3 justify-center mt-2">
                                <Link to="/games/new">
                                    <Button size="sm">Create World</Button>
                                </Link>
                                <Link to="/">
                                    <Button variant="outline" size="sm">Browse Gallery</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* Games Grid */}
                {games.length > 0 && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
