import { createFileRoute, Link } from '@tanstack/react-router'
import { useGames } from '@packages/ui-logic'
import { Plus } from 'lucide-react'
import { Button } from '../../components/ui/8bit/button'
import { GameCard } from '../../components/GameCard'
import { AuthButton } from '../../components/AuthButton'

export const Route = createFileRoute('/games/mine')({
    component: MyGames,
})

function MyGames() {
    const { data, isLoading, error } = useGames()
    const games = data?.games ?? []

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

                <div className="flex items-center gap-4">
                    <Link to="/games/new">
                        <Button className="w-full md:w-auto">
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
                            YOU HAVEN'T CREATED ANY GAMES YET
                        </p>
                        <Link to="/games/new">
                            <Button size="lg" className="mt-4">
                                <span className="text-xs">START WRITING</span>
                            </Button>
                        </Link>
                    </div>
                )}

                {games.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {games.map((game) => (
                            <GameCard key={game.id} game={game} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
