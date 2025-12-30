import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useGames } from '@packages/ui-logic'
import { Plus } from 'lucide-react'
import { Button } from '../../components/ui/8bit/button'
import { GameCard } from '../../components/GameCard'
import { AuthButton } from '../../components/AuthButton'
import { SearchBar } from '../../components/SearchBar'
import { Pagination } from '../../components/common/Pagination'

export const Route = createFileRoute('/games/mine')({
    component: MyGames,
})

function MyGames() {
    const [searchQuery, setSearchQuery] = useState('')
    const [page, setPage] = useState(1)
    const LIMIT = 12

    const { data, isLoading, error } = useGames({
        search: searchQuery,
        limit: LIMIT,
        offset: (page - 1) * LIMIT
    })

    const games = data?.games ?? []
    const totalCount = data?.pagination?.count ?? 0
    const totalPages = Math.ceil(totalCount / LIMIT)

    // Reset page when search changes
    const handleSearch = (query: string) => {
        setSearchQuery(query)
        setPage(1)
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            {/* Header */}
            <header className="mb-8 relative flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl mb-2 text-[var(--8bit-primary)] font-retro">
                        MY GAMES
                    </h1>
                    <p className="text-[10px] md:text-xs text-[var(--8bit-muted-foreground)] font-retro">
                        Manage your created adventures
                    </p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex-1 md:w-64">
                        <SearchBar onSearch={handleSearch} placeholder="SEARCH MY GAMES..." />
                    </div>
                    <Link to="/games/new">
                        <Button className="w-full md:w-auto whitespace-nowrap">
                            <Plus className="h-4 w-4 mr-2" />
                            <span className="text-xs">NEW GAME</span>
                        </Button>
                    </Link>
                    <AuthButton />
                </div>
            </header>

            {/* Content */}
            <main className="max-w-6xl mx-auto">
                {isLoading && (
                    <div className="text-center py-12">
                        <p className="text-xs animate-pulse font-retro">LOADING...</p>
                    </div>
                )}

                {error && (
                    <div className="text-center py-12">
                        <p className="text-xs text-[var(--8bit-destructive)] font-retro">
                            FAILED TO LOAD GAMES
                        </p>
                    </div>
                )}

                {!isLoading && games.length === 0 && (
                    <div className="text-center py-12 space-y-4 border-4 border-dashed border-[var(--8bit-muted)] p-8">
                        <p className="text-6xl">📜</p>
                        <p className="text-xs text-[var(--8bit-muted-foreground)] font-retro">
                            {searchQuery ? 'NO MATCHING GAMES FOUND' : "YOU HAVEN'T CREATED ANY GAMES YET"}
                        </p>
                        {!searchQuery && (
                            <Link to="/games/new">
                                <Button size="lg" className="mt-4">
                                    <span className="text-xs">START WRITING</span>
                                </Button>
                            </Link>
                        )}
                    </div>
                )}

                {games.length > 0 && (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {games.map((game) => (
                                <GameCard key={game.id} game={game} />
                            ))}
                        </div>

                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            className="mt-8"
                        />
                    </>
                )}
            </main>
        </div>
    )
}
