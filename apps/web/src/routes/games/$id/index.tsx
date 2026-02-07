import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useGame, useDeleteGame, getImageUrl, useUser, useForkGame } from '@packages/ui-logic'
import { ArrowLeft, Trash, UserCircle, Play, Globe, MapPin, Target, PencilSimple, GitFork, Clock } from '@phosphor-icons/react'
import { Loader2 } from 'lucide-react'
import { Button } from '../../../components/ui/8bit/button'

export const Route = createFileRoute('/games/$id/')({
    component: GameDetail,
})

function GameDetail() {
    const { id } = Route.useParams()
    const navigate = useNavigate()
    const gameQuery = useGame(id)
    const deleteMutation = useDeleteGame()

    const game = gameQuery.data?.game
    const previewUrl = game ? getImageUrl(game.previewImage) : undefined
    const { data: userData } = useUser()
    const user = userData?.user
    const isOwner = user?.id === game?.userId
    const forkGame = useForkGame()

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this world? This action cannot be undone.')) return
        await deleteMutation.mutateAsync(id)
        navigate({ to: '/' })
    }

    const handleFork = () => {
        if (!game) return
        forkGame.mutate(game.id, {
            onSuccess: (response) => {
                navigate({ to: '/games/$id', params: { id: response.game.id } })
            }
        })
    }

    if (gameQuery.isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (gameQuery.error || !game) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
                <div className="text-xl font-medium text-foreground">World not found</div>
                <p className="text-muted-foreground">The requested world could not be located.</p>
                <Link to="/">
                    <Button variant="outline">Return to Gallery</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Compact Header */}
            <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/"
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft size={16} />
                            <span className="text-sm font-medium hidden sm:inline">Back</span>
                        </Link>
                        <div className="h-4 w-px bg-border/60" />
                        <h1 className="text-sm font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs">
                            {game.title}
                        </h1>
                    </div>

                    <div className="flex items-center gap-2">
                        {isOwner && (
                            <Link to="/games/$id/edit" params={{ id: game.id }}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <PencilSimple size={16} />
                                </Button>
                            </Link>
                        )}

                        {(game.public || isOwner) && !isOwner && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleFork}
                                disabled={forkGame.isPending}
                                className="h-8 w-8 p-0"
                            >
                                <GitFork size={16} />
                            </Button>
                        )}

                        {isOwner && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDelete}
                                className="h-8 w-8 p-0 hover:text-destructive"
                            >
                                <Trash size={16} />
                            </Button>
                        )}

                        <Link to="/games/$id/play" params={{ id: game.id }}>
                            <Button size="sm" className="h-8 px-3 text-xs gap-1.5">
                                <Play size={14} weight="fill" />
                                <span className="hidden sm:inline">Play</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Page Title */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Globe size={16} />
                        <span className="text-xs font-medium uppercase tracking-wider">
                            {game.public ? 'Public World' : 'Private World'}
                        </span>
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground">{game.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {game.characters?.length || 0} Characters
                    </p>
                </div>

                {/* Preview Image & Description */}
                <div className="space-y-6">
                    {/* Preview Image */}
                    {previewUrl && (
                        <div className="rounded-xl overflow-hidden border border-border/50 bg-card aspect-video">
                            <img
                                src={previewUrl}
                                alt={game.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Description Card */}
                    <div className="p-4 rounded-xl border border-border/50 bg-card">
                        <p className="text-foreground/80 leading-relaxed">
                            {game.description}
                        </p>
                    </div>

                    {/* World Context */}
                    {(game as any).worldDescription && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin size={16} />
                                <span className="text-xs font-medium uppercase tracking-wider">World Context</span>
                            </div>
                            <div className="p-4 rounded-xl border border-border/50 bg-card text-foreground/80 leading-relaxed">
                                {(game as any).worldDescription}
                            </div>
                        </div>
                    )}

                    {/* Objective */}
                    {game.objective && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Target size={16} />
                                <span className="text-xs font-medium uppercase tracking-wider">Objective</span>
                            </div>
                            <div className="p-4 rounded-xl border border-border/50 bg-card text-foreground/80 leading-relaxed">
                                {game.objective}
                            </div>
                        </div>
                    )}

                    {/* Characters */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <UserCircle size={16} />
                                <span className="text-xs font-medium uppercase tracking-wider">Characters</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{game.characters?.length || 0}</span>
                        </div>

                        {game.characters && game.characters.length > 0 ? (
                            <div className="space-y-2">
                                {game.characters.map((char) => (
                                    <div
                                        key={char.id}
                                        className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card hover:border-border hover:bg-accent/50 transition-all"
                                    >
                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground shrink-0 overflow-hidden">
                                            {char.portrait ? (
                                                <img
                                                    src={getImageUrl(char.portrait)}
                                                    alt={char.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <UserCircle size={20} weight="duotone" />
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-foreground truncate">
                                                {char.name}
                                            </h3>
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                Playable Character
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 border border-dashed border-border/60 rounded-xl bg-card/50">
                                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-secondary flex items-center justify-center">
                                    <UserCircle size={18} className="text-muted-foreground" />
                                </div>
                                <p className="text-sm text-muted-foreground">No characters in this world yet.</p>
                            </div>
                        )}
                    </div>

                    {/* NPCs */}
                    {game.npcs && game.npcs.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock size={16} />
                                    <span className="text-xs font-medium uppercase tracking-wider">NPCs</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{game.npcs.length}</span>
                            </div>
                            <div className="space-y-2">
                                {game.npcs.map((npc) => (
                                    <div
                                        key={npc.id}
                                        className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-foreground truncate">{npc.name}</div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {npc.location || "Unknown Location"}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CTA Button */}
                    <div className="pt-4">
                        <Link to="/games/$id/play" params={{ id: game.id }} className="block">
                            <Button size="lg" className="w-full h-12 text-sm font-medium">
                                <Play weight="fill" className="mr-2" size={18} />
                                Enter World
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    )
}
