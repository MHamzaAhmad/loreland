import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useGame, useDeleteGame, getImageUrl, useUser, useForkGame } from '@packages/ui-logic'
import { ArrowLeft, Trash, UserCircle, Play, Globe, MapPin, Target, PencilSimple, GitFork, BookOpen } from '@phosphor-icons/react'
import { Loader2 } from 'lucide-react'
import { Button } from '../../../components/ui/8bit/button'
import { useMemo } from 'react'

export const Route = createFileRoute('/games/$id/')({
    component: GameDetail,
})

const pastelClasses = [
    'bg-[var(--pastel-red)] text-[var(--pastel-red-fg)]',
    'bg-[var(--pastel-orange)] text-[var(--pastel-orange-fg)]',
    'bg-[var(--pastel-yellow)] text-[var(--pastel-yellow-fg)]',
    'bg-[var(--pastel-green)] text-[var(--pastel-green-fg)]',
    'bg-[var(--pastel-blue)] text-[var(--pastel-blue-fg)]',
    'bg-[var(--pastel-purple)] text-[var(--pastel-purple-fg)]',
    'bg-[var(--pastel-pink)] text-[var(--pastel-pink-fg)]',
]

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

    const colorClass = useMemo(() => {
        if (!game) return pastelClasses[0];
        const index = game.id.charCodeAt(0) % pastelClasses.length;
        return pastelClasses[index];
    }, [game?.id]);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this world? This action cannot be undone.')) return
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
                <div className="text-xl font-medium font-serif text-foreground">World not found</div>
                <p className="text-muted-foreground">The requested world could not be located.</p>
                <Link to="/">
                    <Button variant="outline">
                        Return to Gallery
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#fcfbf9] pb-20">
            {/* Header Section */}
            <div className={`relative ${colorClass} transition-colors duration-500`}>
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />

                <div className="relative max-w-5xl mx-auto px-6 md:px-12 py-8 md:py-12">
                    {/* Navigation */}
                    <header className="flex items-center justify-between mb-8">
                        <Link to="/" className="flex items-center gap-2 text-current/70 hover:text-current transition-colors group">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-medium font-serif">Back to Gallery</span>
                        </Link>

                        <div className="flex items-center gap-2">
                            {isOwner && (
                                <Link to="/games/$id/edit" params={{ id: game.id }}>
                                    <button className="p-2 bg-white/50 hover:bg-white/80 rounded-full text-current transition-colors backdrop-blur-sm shadow-sm">
                                        <PencilSimple size={18} weight="bold" />
                                    </button>
                                </Link>
                            )}

                            {(game.public || isOwner) && !isOwner && (
                                <button
                                    onClick={handleFork}
                                    disabled={forkGame.isPending}
                                    className="p-2 bg-white/50 hover:bg-white/80 rounded-full text-current transition-colors backdrop-blur-sm disabled:opacity-50 shadow-sm"
                                >
                                    <GitFork size={18} weight="bold" />
                                </button>
                            )}

                            {isOwner && (
                                <button
                                    onClick={handleDelete}
                                    className="p-2 bg-white/50 hover:bg-red-100 hover:text-red-700 rounded-full text-current transition-colors backdrop-blur-sm shadow-sm"
                                >
                                    <Trash size={18} weight="bold" />
                                </button>
                            )}
                        </div>
                    </header>

                    {/* Title Area */}
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 border border-white/20 text-[11px] font-bold uppercase tracking-wider shadow-sm text-current">
                                <Globe size={14} weight="bold" />
                                <span>{game.public ? 'Public World' : 'Private World'}</span>
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 border border-white/20 text-[11px] font-bold uppercase tracking-wider shadow-sm text-current">
                                <BookOpen size={14} weight="bold" />
                                <span>{game.characters?.length || 0} Characters</span>
                            </div>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black font-serif tracking-tight leading-[0.9] text-current/90 max-w-4xl">
                            {game.title}
                        </h1>
                    </div>
                    {/* Decorative Big Letter */}
                    <div className="absolute -bottom-12 right-0 md:right-12 text-[12rem] font-serif font-black opacity-10 select-none pointer-events-none mix-blend-multiply">
                        {game.title.charAt(0)}
                    </div>
                </div>
            </div>


            <div className="max-w-5xl mx-auto px-6 md:px-12 -mt-8 relative z-30">
                <main className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Main Content Info */}
                    <div className="lg:col-span-7 space-y-12">
                        {/* Description */}
                        <div className="bg-card rounded-3xl p-8 shadow-sm border border-dashed border-border/60">
                            <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-serif">
                                {game.description}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-8">
                            {/* World Context */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-muted-foreground px-2">
                                    <MapPin size={20} className="text-foreground" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-foreground/60">World Context</span>
                                    <div className="h-px flex-1 bg-border border-t border-dashed" />
                                </div>
                                <div className="p-6 rounded-2xl bg-[#f5f5f4]/50 border border-border/50 text-foreground/80 leading-relaxed font-serif">
                                    {(game as any).worldDescription}
                                </div>
                            </div>

                            {/* Objective */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-muted-foreground px-2">
                                    <Target size={20} className="text-foreground" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-foreground/60">Objective</span>
                                    <div className="h-px flex-1 bg-border border-t border-dashed" />
                                </div>
                                <div className="p-6 rounded-2xl bg-[#f5f5f4]/50 border border-border/50 text-foreground/80 leading-relaxed font-serif">
                                    {game.objective}
                                </div>
                            </div>
                        </div>

                        {/* Roster Section */}
                        <div className="pt-4 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                                    Characters
                                </h2>
                                <span className="text-xs font-mono text-muted-foreground">{game.characters?.length || 0} CHARACTERS</span>
                            </div>

                            {game.characters && game.characters.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                                    {game.characters.map((char) => (
                                        <div key={char.id} className="group relative overflow-hidden rounded-xl bg-card border border-dashed border-border hover:border-solid hover:border-foreground/30 transition-all shadow-sm hover:shadow-md">
                                            <div className="aspect-[4/5] bg-muted relative">
                                                {char.portrait ? (
                                                    <img
                                                        src={getImageUrl(char.portrait)}
                                                        alt={char.name}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter sepia-[0.2] group-hover:sepia-0"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/20 bg-[#f0eee9]">
                                                        <UserCircle className="w-16 h-16" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                                                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                                    <div className="font-serif text-lg font-bold truncate">{char.name}</div>
                                                    <div className="text-xs opacity-70 font-mono tracking-wider uppercase mt-1">Status: Active</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 rounded-2xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center text-center gap-3 bg-secondary/10">
                                    <UserCircle size={48} className="text-muted-foreground/30" />
                                    <p className="text-muted-foreground font-serif italic text-lg">No characters in this world yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Visual & CTA */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="sticky top-8 space-y-8">
                            {/* Preview Image Card */}
                            <div className="bg-white p-3 rounded-3xl shadow-xl shadow-black/5 rotate-1 hover:rotate-0 transition-transform duration-500">
                                <div className="rounded-2xl overflow-hidden bg-muted aspect-[3/4] relative group border border-black/5">
                                    {previewUrl ? (
                                        <img
                                            src={previewUrl}
                                            alt={game.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-[#f0eee9] text-[#d6d3cd]">
                                            <Globe className="w-24 h-24 opacity-50" />
                                        </div>
                                    )}

                                    {/* Grain/Texture Overlay */}
                                    <div className="absolute inset-0 bg-black/[0.02] pointer-events-none mix-blend-multiply" />
                                </div>
                            </div>

                            <Link to="/games/$id/play" params={{ id: game.id }} className="block w-full hover:scale-[1.02] transition-transform">
                                <Button size="lg" className="w-full h-16 rounded-full text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all bg-foreground text-background hover:bg-foreground/90">
                                    <Play weight="fill" className="mr-2" />
                                    Enter World
                                </Button>
                            </Link>


                            {game.npcs && game.npcs.length > 0 && (
                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center gap-3 text-muted-foreground px-2">
                                        <span className="text-xs font-bold uppercase tracking-widest text-foreground/60">NPCs</span>
                                        <div className="h-px flex-1 bg-border border-t border-dashed" />
                                    </div>
                                    <div className="space-y-2">
                                        {game.npcs.map((npc) => (
                                            <div key={npc.id} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-dashed border-border/60 hover:border-solid hover:border-foreground/20 transition-all">
                                                <div className="w-2 h-2 rounded-full bg-foreground/20" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-serif font-medium text-foreground truncate">{npc.name}</div>
                                                    <div className="text-xs text-muted-foreground truncate font-mono">{npc.location || "Unknown Location"}</div>
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
