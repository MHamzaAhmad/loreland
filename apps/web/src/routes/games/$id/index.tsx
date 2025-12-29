import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useGame, useDeleteGame, getImageUrl } from '@packages/ui-logic'
import { ArrowLeft, Trash2, Users, UserCircle, Play, Globe, MapPin, Target } from 'lucide-react'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/games/$id/')({
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
        if (!confirm('WARNING: PERMANENT DATA PURGE. Are you sure you want to delete this simulation?')) return

        await deleteMutation.mutateAsync(id)
        navigate({ to: '/' })
    }

    if (gameQuery.isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-black text-primary font-mono gap-2">
                <Loader2 className="animate-spin" />
                <span>ACCESSING_ARCHIVES...</span>
            </div>
        )
    }

    if (gameQuery.error || !game) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4 font-mono bg-black">
                <div className="text-destructive">[DATA_CORRUPTION_DETECTED]</div>
                <div className="text-muted-foreground text-sm">Target simulation not found in archives.</div>
                <Link to="/" className="text-primary hover:underline text-sm flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    <span>RETURN_TO_CATALOG</span>
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background relative selection:bg-primary/30 overflow-hidden font-mono text-sm">
            {/* Background elements */}
            <div className="scanline-overlay pointer-events-none fixed inset-0 z-50 opacity-50" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background z-0 pointer-events-none" />

            <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-8 flex flex-col h-full">
                {/* Header */}
                <header className="mb-8 flex items-center justify-between border-b border-primary/20 pb-4">
                    <Link to="/" className="group flex items-center gap-2 text-primary/60 hover:text-primary transition-colors text-xs font-mono uppercase tracking-widest">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>Back_to_Grid</span>
                    </Link>
                    <div className="text-[10px] text-primary/40 font-mono">
                        ARCHIVE_ID: {game.id.split('-')[0].toUpperCase()}
                    </div>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Visuals & Actions */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="relative aspect-[3/4] w-full overflow-hidden border-2 border-primary/20 bg-black/50 group">
                            {previewUrl ? (
                                <>
                                    <img
                                        src={previewUrl}
                                        alt={game.title}
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-primary/30 gap-4">
                                    <Globe className="w-16 h-16 animate-pulse" />
                                    <span className="text-xs uppercase tracking-widest">No_Visual_Data</span>
                                    <div className="grid grid-cols-8 gap-1 opacity-20">
                                        {Array.from({ length: 16 }).map((_, i) => (
                                            <div key={i} className="w-2 h-2 bg-primary" />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Overlay Stats */}
                            <div className="absolute bottom-4 left-4 right-4">
                                <div className="flex justify-between items-end border-b border-primary/30 pb-2 mb-2">
                                    <span className="text-xs text-primary/60">STATUS</span>
                                    <span className="text-xs text-primary font-bold">ONLINE</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Link to="/games/$id/play" params={{ id: game.id }} className="block">
                                <button className="w-full group relative px-6 py-4 bg-primary/10 hover:bg-primary/20 border border-primary/50 hover:border-primary transition-all overflow-hidden">
                                    <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] bg-gradient-to-r from-transparent via-primary/20 to-transparent transition-transform duration-1000" />
                                    <div className="flex items-center justify-center gap-3 text-primary font-orbitron tracking-widest">
                                        <Play className="w-5 h-5 fill-current" />
                                        <span>INITIALIZE_SIMULATION</span>
                                    </div>
                                </button>
                            </Link>

                            <button
                                onClick={handleDelete}
                                disabled={deleteMutation.isPending}
                                className="w-full px-4 py-3 bg-red-950/20 hover:bg-red-950/40 border border-red-500/30 hover:border-red-500/60 text-red-500/80 hover:text-red-400 font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Purge_Archives</span>
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Data & Stats */}
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-orbitron text-primary tracking-wide mb-2 text-shadow-glow">
                                {game.title.toUpperCase()}
                            </h1>
                            <p className="text-primary/60 text-sm md:text-base leading-relaxed border-l-2 border-primary/30 pl-4 py-1">
                                {game.description}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="hud-panel p-4 bg-primary/5 border border-primary/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-1 opacity-20">
                                    <MapPin className="w-12 h-12" />
                                </div>
                                <h3 className="text-xs font-mono text-primary/50 uppercase mb-2 flex items-center gap-2">
                                    <Globe className="w-3 h-3" /> World_Context
                                </h3>
                                <p className="text-sm text-primary/80 line-clamp-4">
                                    {game.background}
                                </p>
                            </div>

                            <div className="hud-panel p-4 bg-primary/5 border border-primary/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-1 opacity-20">
                                    <Target className="w-12 h-12" />
                                </div>
                                <h3 className="text-xs font-mono text-primary/50 uppercase mb-2 flex items-center gap-2">
                                    <Target className="w-3 h-3" /> Directive
                                </h3>
                                <p className="text-sm text-primary/80 line-clamp-4">
                                    {game.objective}
                                </p>
                            </div>
                        </div>

                        {/* Roster */}
                        <div className="border-t border-primary/20 pt-6">
                            <div className="flex items-center gap-4 mb-6">
                                <h2 className="text-xl font-orbitron text-primary tracking-widest">
                                    ACTIVE_ROSTER
                                </h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
                                <span className="text-xs font-mono text-primary/40">
                                    {game.characters?.length || 0} UNITS
                                </span>
                            </div>

                            {game.characters && game.characters.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {game.characters.map((char) => (
                                        <div key={char.id} className="group relative border border-primary/20 bg-black/40 hover:border-primary/60 transition-colors">
                                            <div className="aspect-square relative overflow-hidden">
                                                {char.portrait ? (
                                                    <img
                                                        src={getImageUrl(char.portrait)}
                                                        alt={char.name}
                                                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <UserCircle className="w-8 h-8 text-primary/20" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60" />
                                                <div className="absolute bottom-2 left-2 right-2">
                                                    <div className="text-[10px] font-mono text-primary/50 uppercase">UNIT_{char.id.toString().padStart(2, '0')}</div>
                                                    <div className="text-sm font-bold text-primary truncate">{char.name}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 border border-dashed border-primary/20 text-primary/30 text-xs font-mono uppercase">
                                    NO_PERSONNEL_RECORDS_FOUND
                                </div>
                            )}
                        </div>

                        {/* NPCs */}
                        {game.npcs && game.npcs.length > 0 && (
                            <div className="border-t border-primary/20 pt-6">
                                <div className="flex items-center gap-4 mb-6">
                                    <h2 className="text-lg font-orbitron text-primary/80 tracking-widest">
                                        KNOWN_ENTITIES
                                    </h2>
                                    <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {game.npcs.map((npc) => (
                                        <div key={npc.id} className="p-3 border-l-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <span className="text-sm font-bold text-primary">{npc.name}</span>
                                                <span className="text-[10px] text-primary/40 uppercase font-mono">{npc.location || "UNKNOWN"}</span>
                                            </div>
                                            {npc.oneLiner && (
                                                <div className="mt-1 text-xs text-primary/60 italic">"{npc.oneLiner}"</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
