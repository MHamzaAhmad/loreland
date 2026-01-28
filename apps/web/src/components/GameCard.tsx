import { Link, useNavigate } from '@tanstack/react-router'
import type { Game } from '@packages/ui-logic'
import { getImageUrl, useUser, useForkGame } from '@packages/ui-logic'
import { Copy, PencilSimple } from '@phosphor-icons/react'
import { useMemo } from 'react'

interface GameCardProps {
    game: Game
}

// Pastel colors for fallback when no preview image
const pastelClasses = [
    'bg-[var(--pastel-red)] text-[var(--pastel-red-fg)]',
    'bg-[var(--pastel-orange)] text-[var(--pastel-orange-fg)]',
    'bg-[var(--pastel-yellow)] text-[var(--pastel-yellow-fg)]',
    'bg-[var(--pastel-green)] text-[var(--pastel-green-fg)]',
    'bg-[var(--pastel-pink)] text-[var(--pastel-pink-fg)]',
    'bg-[var(--pastel-blue)] text-[var(--pastel-blue-fg)]',
    'bg-[var(--pastel-purple)] text-[var(--pastel-purple-fg)]',
]

export function GameCard({ game }: GameCardProps) {
    const { data: userData } = useUser();
    const user = userData?.user;
    const isOwner = user?.id === game.userId;
    const forkGame = useForkGame();
    const navigate = useNavigate();

    // Deterministic color based on game ID
    const colorClass = useMemo(() => {
        const index = game.id.charCodeAt(0) % pastelClasses.length;
        return pastelClasses[index];
    }, [game.id]);

    const previewUrl = game.previewImage ? getImageUrl(game.previewImage) : null;

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
        e.preventDefault();
        e.stopPropagation();
        navigate({ to: '/games/$id/edit', params: { id: game.id } });
    }

    return (
        <Link
            to="/games/$id"
            params={{ id: game.id }}
            className="block h-full group outline-none"
        >
            <article className="h-full flex flex-col bg-card rounded-3xl overflow-hidden border border-dashed border-border/60 hover:border-foreground/40 transition-all duration-500 shadow-sm hover:shadow-xl hover:-translate-y-1">
                {/* Header - Preview Image or Pastel Fallback */}
                <div className="h-40 relative overflow-hidden">
                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt={game.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className={`w-full h-full ${colorClass} opacity-90 group-hover:opacity-100 transition-opacity relative`}>
                            {/* Decorative Serif Letter */}
                            <div className="absolute -bottom-8 -right-4 text-9xl font-serif font-black opacity-10 select-none">
                                {game.title.charAt(0)}
                            </div>
                        </div>
                    )}

                    {/* Overlay for image readability */}
                    {previewUrl && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
                    )}

                    {/* Action buttons - top right */}
                    <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-10">
                        {isOwner && (
                            <button
                                onClick={handleEdit}
                                className="p-2 bg-white/60 rounded-full hover:bg-white text-gray-700 shadow-sm backdrop-blur-sm"
                                title="Edit"
                            >
                                <PencilSimple size={16} weight="bold" />
                            </button>
                        )}
                        {(game.public || isOwner) && (
                            <button
                                onClick={handleFork}
                                className="p-2 bg-white/60 rounded-full hover:bg-white text-gray-700 shadow-sm backdrop-blur-sm"
                                title="Make a copy"
                            >
                                <Copy size={16} weight="bold" />
                            </button>
                        )}
                    </div>

                    {/* Public/Private badge - bottom left */}
                    <div className="absolute bottom-4 left-4 z-10">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md border text-[10px] font-bold uppercase tracking-wider shadow-sm ${previewUrl
                                ? 'bg-black/40 border-white/20 text-white'
                                : 'bg-white/30 border-white/20 text-current'
                            }`}>
                            {game.public ? 'Public' : 'Private'}
                        </span>
                    </div>
                </div>

                {/* Content Block - Serif & Warm */}
                <div className="p-8 flex-1 flex flex-col gap-4">
                    <h3 className="font-serif text-3xl font-medium leading-tight text-foreground/90 group-hover:text-foreground transition-colors">
                        {game.title}
                    </h3>

                    <p className="font-serif text-sm text-muted-foreground/80 line-clamp-3 leading-relaxed">
                        {game.description}
                    </p>

                    <div className="mt-auto pt-6 border-t border-dashed border-border/40 flex items-center justify-between">
                        <span className="text-xs font-serif text-muted-foreground">
                            {isOwner ? 'Your world' : 'Community'}
                        </span>

                        <span className="px-3 py-1.5 rounded-full bg-secondary/40 text-xs font-serif font-medium text-foreground/70">
                            Enter World →
                        </span>
                    </div>
                </div>
            </article>
        </Link>
    )
}
