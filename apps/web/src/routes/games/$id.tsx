import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useGame, useDeleteGame, getImageUrl } from '@packages/ui-logic'
import { Button } from '../../components/ui/8bit/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/8bit/card'
import { ArrowLeft, Trash2, Users, UserCircle } from 'lucide-react'

export const Route = createFileRoute('/games/$id')({
    component: GameDetail,
})

function GameDetail() {
    const { id } = Route.useParams()
    const navigate = useNavigate()
    const gameQuery = useGame(id)
    const deleteMutation = useDeleteGame()

    const game = gameQuery.data?.game
    const previewUrl = game ? getImageUrl(game.previewImage) : undefined;

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this game?')) return

        await deleteMutation.mutateAsync(id)
        navigate({ to: '/' })
    }

    if (gameQuery.isLoading) {
        return (
            <div className="min-h-screen p-8 flex items-center justify-center">
                <p className="text-xs animate-pulse">Loading...</p>
            </div>
        )
    }

    if (gameQuery.error || !game) {
        return (
            <div className="min-h-screen p-8 flex flex-col items-center justify-center gap-4">
                <p className="text-xs text-[var(--8bit-destructive)]">Game not found</p>
                <Link to="/">
                    <Button variant="outline">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-xs">BACK</span>
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            {/* Header */}
            <header className="max-w-4xl mx-auto mb-8">
                <Link to="/" className="inline-flex items-center gap-2 text-xs text-[var(--8bit-muted-foreground)] hover:text-[var(--8bit-foreground)] mb-4">
                    <ArrowLeft className="h-4 w-4" />
                    BACK TO CATALOG
                </Link>
            </header>

            <main className="max-w-4xl mx-auto space-y-6">
                {/* Game Header Card */}
                <Card>
                    <div className="md:flex">
                        {/* Preview Image */}
                        <div className="md:w-64 aspect-square bg-[var(--8bit-muted)] flex-shrink-0">
                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt={game.title}
                                    className="w-full h-full object-cover pixelated"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-6xl">🎮</span>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <CardHeader>
                                <CardTitle className="text-lg">{game.title}</CardTitle>
                                <CardDescription>{game.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="text-[10px] uppercase text-[var(--8bit-muted-foreground)] mb-1">
                                        Background
                                    </h3>
                                    <p className="text-xs">{game.background}</p>
                                </div>
                                <div>
                                    <h3 className="text-[10px] uppercase text-[var(--8bit-muted-foreground)] mb-1">
                                        Objective
                                    </h3>
                                    <p className="text-xs">{game.objective}</p>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleDelete}
                                        disabled={deleteMutation.isPending}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                        <span className="text-[10px]">DELETE</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </div>
                    </div>
                </Card>

                {/* Characters */}
                {game.characters && game.characters.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                CHARACTERS
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {game.characters.map((char) => (
                                    <div key={char.id} className="text-center space-y-2">
                                        <div className="aspect-square bg-[var(--8bit-muted)] border-4 border-[var(--8bit-border)]">
                                            {char.portrait ? (
                                                <img
                                                    src={getImageUrl(char.portrait)}
                                                    alt={char.name}
                                                    className="w-full h-full object-cover pixelated"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <UserCircle className="h-8 w-8 text-[var(--8bit-muted-foreground)]" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[10px] font-bold truncate">{char.name}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* NPCs */}
                {game.npcs && game.npcs.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <UserCircle className="h-4 w-4" />
                                NPCS
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {game.npcs.map((npc) => (
                                    <div key={npc.id} className="border-b-2 border-[var(--8bit-border)] pb-3 last:border-0">
                                        <p className="text-xs font-bold">{npc.name}</p>
                                        {npc.detail && (
                                            <p className="text-[10px] text-[var(--8bit-muted-foreground)]">
                                                {npc.detail}
                                            </p>
                                        )}
                                        {npc.oneLiner && (
                                            <p className="text-[10px] italic mt-1">
                                                "{npc.oneLiner}"
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    )
}
