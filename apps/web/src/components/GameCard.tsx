import { Link, useNavigate } from '@tanstack/react-router'
import type { Game } from '@packages/ui-logic'
import { getImageUrl, useUser, useForkGame } from '@packages/ui-logic'
import { GitFork, PencilSimple, UserCircle } from '@phosphor-icons/react'
import { useMemo } from 'react'

interface GameCardProps {
    game: Game
}

// Pastel colors for the top section of the card
const pastelClasses = [
    'bg-[var(--pastel-red)] text-[var(--pastel-red-fg)]',
    'bg-[var(--pastel-orange)] text-[var(--pastel-orange-fg)]',
    'bg-[var(--pastel-yellow)] text-[var(--pastel-yellow-fg)]',
    'bg-[var(--pastel-green)] text-[var(--pastel-green-fg)]',
    'bg-[var(--pastel-blue)] text-[var(--pastel-blue-fg)]',
    'bg-[var(--pastel-purple)] text-[var(--pastel-purple-fg)]',
    'bg-[var(--pastel-pink)] text-[var(--pastel-pink-fg)]',
]

export function GameCard({ game }: GameCardProps) {
    const { data: userData } = useUser();
    const user = userData?.user;
    const isOwner = user?.id === game.userId;
    const forkGame = useForkGame();
    const navigate = useNavigate();

    // Deterministic color based on game ID length/chars
    const colorClass = useMemo(() => {
        const index = game.id.charCodeAt(0) % pastelClasses.length;
        return pastelClasses[index];
    }, [game.id]);

    const handleFork = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        forkGame.mutate(game.id, {
            onSuccess: (response) => {
                navigate({ to: '/games/$id', params: { id: response.game.id } });
            }
        });
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
    }

    return (
        <Link
            to="/games/$id"
            params={{ id: game.id }}
            className="block h-full group outline-none"
        >
            <article className="h-full flex flex-col bg-card rounded-3xl overflow-hidden border border-dashed border-border/60 hover:border-foreground/40 transition-all duration-500 shadow-sm hover:shadow-xl hover:-translate-y-1">
                {/* Pastel Header Block - Larger */}
                <div className={`h-40 p-6 flex flex-col justify-between ${colorClass} opacity-90 group-hover:opacity-100 transition-opacity relative overflow-hidden`}>
                    {/* Decorative Serif Letter */}
                    <div className="absolute -bottom-8 -right-4 text-9xl font-serif font-black opacity-10 select-none">
                        {game.title.charAt(0)}
                    </div>

                    <div className="flex justify-between items-start z-10">
                        <div className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center backdrop-blur-sm border border-white/20">
                            <span className="text-xs font-bold font-serif">Aa</span>
                        </div>

                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                            {isOwner && (
                                <button onClick={handleEdit} className="p-2 bg-white/60 rounded-full hover:bg-white text-current shadow-sm">
                                    <PencilSimple size={16} weight="bold" />
                                </button>
                            )}
                            {(game.public || isOwner) && (
                                <button onClick={handleFork} className="p-2 bg-white/60 rounded-full hover:bg-white text-current shadow-sm">
                                    <GitFork size={16} weight="bold" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="z-10">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/30 backdrop-blur-md border border-white/20 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                            {game.public ? 'Public' : 'Private'}
                        </span>
                    </div>
                </div>

                {/* Content Block - Spacious & Serif */}
                <div className="p-8 flex-1 flex flex-col gap-4">
                    <h3 className="font-serif text-3xl font-medium leading-tight text-foreground/90 group-hover:text-foreground transition-colors">
                        {game.title}
                    </h3>

                    <p className="font-serif text-sm text-muted-foreground/80 line-clamp-3 leading-relaxed">
                        {game.description}
                    </p>

                    <div className="mt-auto pt-6 border-t border-dashed border-border/40 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-serif text-muted-foreground">
                            <UserCircle size={16} weight="fill" className="text-muted-foreground/60" />
                            <span>{user?.name || 'Unknown Author'}</span>
                        </div>

                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/40 text-xs font-serif font-medium text-foreground/70">
                            <span>{game.characters?.length || 0}</span>
                            <span className="text-muted-foreground/60">items</span>
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    )
}
