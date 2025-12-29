import { Link } from '@tanstack/react-router'
import type { Game } from '@packages/ui-logic'
import { getImageUrl } from '@packages/ui-logic'
import { Zap } from 'lucide-react'

interface GameCardProps {
    game: Game
}

export function GameCard({ game }: GameCardProps) {
    const imageUrl = getImageUrl(game.previewImage);

    return (
        <Link to="/games/$id" params={{ id: game.id }} className="block h-full group">
            <div className="h-full hud-panel group-hover:border-[var(--primary)]/50 transition-all duration-500 flex flex-col overflow-hidden relative group">
                <div className="hud-bracket absolute inset-0 pointer-events-none" />

                {/* Image Container with HUD overlay */}
                <div className="aspect-[16/10] relative overflow-hidden bg-slate-900/50">
                    <div className="absolute inset-0 z-10 pointer-events-none border-b border-[var(--primary)]/20 shadow-[inset_0_0_40px_rgba(0,243,255,0.1)]" />

                    {/* Technical stats overlay */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1 z-20 font-mono text-[7px] text-[var(--primary)]/60 text-right opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div>REF_ID: {game.id.slice(0, 4)}</div>
                        <div>LOAD_PRM: 88%</div>
                    </div>

                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={game.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60 group-hover:opacity-100"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[var(--primary)]/20">
                            <span className="text-4xl mb-2 animate-pulse">⌬</span>
                            <span className="text-[8px] font-mono tracking-[0.3em]">NO_DATA_SRC</span>
                        </div>
                    )}

                    {/* Animated scanning line */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--primary)]/40 z-20 -translate-y-full group-hover:animate-[scan_3s_linear_infinite]" />
                    <div className="hud-label translate-y-2 opacity-0 group-hover:opacity-100 transition-all duration-500">Visual_Cap</div>
                </div>

                <div className="p-5 flex-1 flex flex-col gap-3 relative bg-background/20 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`w-3 h-1 ${i <= 2 ? 'bg-[var(--primary)]' : 'bg-[var(--primary)]/20'} animate-pulse`} style={{ animationDelay: `${i * 0.2}s` }} />
                            ))}
                        </div>
                        <span className="text-[7px] font-mono text-[var(--primary)] tracking-widest">OBJ_ID_{game.id.slice(0, 6)}</span>
                    </div>

                    <h3 className="text-sm font-bold tracking-[0.2em] group-hover:text-[var(--primary)] group-hover:glow-text transition-all duration-300 uppercase line-clamp-1">
                        {game.title}
                    </h3>

                    <p className="text-[10px] text-[var(--muted-foreground)] line-clamp-2 font-medium leading-relaxed tracking-wide">
                        {game.description}
                    </p>

                    <div className="mt-auto pt-5 flex items-center justify-between border-t border-[var(--primary)]/10">
                        <div className="flex flex-col gap-1">
                            <span className="text-[7px] font-mono text-[var(--primary)]/40">INITIALIZE_LINK</span>
                            <div className="flex items-center gap-2">
                                <div className="h-1 w-20 bg-[var(--primary)]/10 relative overflow-hidden">
                                    <div className="absolute inset-y-0 left-0 w-1/3 bg-[var(--primary)]/60 group-hover:w-full transition-all duration-1000" />
                                </div>
                                <span className="text-[8px] font-mono text-[var(--primary)]">EXECUTE</span>
                            </div>
                        </div>
                        <div className="p-1 border border-[var(--primary)]/30 group-hover:border-[var(--primary)] transition-colors">
                            <Zap size={12} className="text-[var(--primary)]" />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}
