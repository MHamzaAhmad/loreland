import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useGame, useDeleteGame, getImageUrl, useUser, useForkGame } from '@packages/ui-logic'
import { ArrowLeft, Trash, UserCircle, Play, Globe, MapPin, Target, PencilSimple, GitFork } from '@phosphor-icons/react'
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
    const previewUrl = game ? getImageUrl(game.previewImage) : undefined;;
    const { data: userData } = useUser();
    const user = userData?.user;
    const isOwner = user?.id === game?.userId;
    const forkGame = useForkGame();

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this vision? This action cannot be undone.')) return
        await deleteMutation.mutateAsync(id)
        navigate({ to: '/' })
    }

    const handleFork = () => {
        if (!game) return;
        forkGame.mutate(game.id, {
            onSuccess: (response) => {
                navigate({ to: '/games/$id', params: { id: response.game.id } });
            }
        });
    }

    if (gameQuery.isLoading) {
        return (
            <div className="h-[50vh] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (gameQuery.error || !game) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <div className="text-xl font-medium text-foreground">Vision not found</div>
                <p className="text-muted-foreground">The requested vision could not be located.</p>
                <Link to="/">
                    <Button variant="outline">
                        Return Home
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="max-w-5xl mx-auto p-6 md:p-12 space-y-8">
                {/* Header Navigation */}
                <header className="flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back to Gallery</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        {isOwner && (
                            <Link to="/games/$id/edit" params={{ id: game.id }}>
                                <Button variant="ghost" size="sm">
                                    <PencilSimple size={16} />
                                    <span>Edit</span>
                                </Button>
                            </Link>
                        )}

                        {(game.public || isOwner) && !isOwner && (
                            <Button variant="ghost" size="sm" onClick={handleFork} disabled={forkGame.isPending}>
                                <GitFork size={16} />
                                <span>Fork</span>
                            </Button>
                        )}

                        {isOwner && (
                            <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash size={16} />
                            </Button>
                        )}
                    </div>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Main Content Info */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
                                {game.title}
                            </h1>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                {game.description}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {/* Tags or Meta info could go here */}
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/50 text-secondary-foreground text-xs font-medium">
                                <Globe size={14} />
                                <span>{game.public ? 'Public Universe' : 'Private Vision'}</span>
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/50 text-secondary-foreground text-xs font-medium">
                                <UserCircle size={14} />
                                <span>{game.characters?.length || 0} Characters</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm space-y-3">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <MapPin size={18} />
                                    <span className="text-xs font-semibold uppercase tracking-wider">World Context</span>
                                </div>
                                <p className="text-sm text-foreground/80 leading-relaxed">
                                    {game.background}
                                </p>
                            </div>

                            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm space-y-3">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <Target size={18} />
                                    <span className="text-xs font-semibold uppercase tracking-wider">Objective</span>
                                </div>
                                <p className="text-sm text-foreground/80 leading-relaxed">
                                    {game.objective}
                                </p>
                            </div>
                        </div>

                        {/* Roster Section */}
                        <div className="pt-8 space-y-6">
                            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                                Active Roster
                            </h2>

                            {game.characters && game.characters.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {game.characters.map((char) => (
                                        <div key={char.id} className="group relative overflow-hidden rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all">
                                            <div className="aspect-square bg-muted relative">
                                                {char.portrait ? (
                                                    <img
                                                        src={getImageUrl(char.portrait)}
                                                        alt={char.name}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                                                        <UserCircle className="w-12 h-12" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                                                <div className="absolute bottom-3 left-3 right-3 text-white">
                                                    <div className="text-sm font-semibold truncate">{char.name}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 rounded-xl border border-dashed border-border text-center text-muted-foreground text-sm">
                                    No characters initialized in this vision.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Visual & CTA */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="sticky top-24 space-y-6">
                            <div className="rounded-3xl overflow-hidden shadow-xl shadow-black/5 bg-muted aspect-[3/4] relative group">
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt={game.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-secondary/30 text-secondary-foreground/30">
                                        <Globe className="w-20 h-20 opacity-50" />
                                    </div>
                                )}

                                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/50 to-transparent">
                                    <Link to="/games/$id/play" params={{ id: game.id }} className="block w-full">
                                        <Button size="lg" className="w-full h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-all rounded-xl">
                                            <Play weight="fill" className="mr-2" />
                                            Enter Simulation
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            {game.npcs && game.npcs.length > 0 && (
                                <div className="rounded-2xl bg-card border border-border/50 shadow-sm p-6 space-y-4">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                        Known Entities
                                    </h3>
                                    <div className="space-y-3">
                                        {game.npcs.map((npc) => (
                                            <div key={npc.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                                <div>
                                                    <div className="text-sm font-medium text-foreground">{npc.name}</div>
                                                    <div className="text-xs text-muted-foreground">{npc.location || "Unknown Location"}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
