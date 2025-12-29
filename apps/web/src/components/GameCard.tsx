import { Link } from '@tanstack/react-router'
import type { Game } from '@packages/ui-logic'
import { getImageUrl } from '@packages/ui-logic'
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from './ui/8bit/card'

interface GameCardProps {
    game: Game
}

export function GameCard({ game }: GameCardProps) {
    const imageUrl = getImageUrl(game.previewImage);

    return (
        <Link to="/games/$id" params={{ id: game.id }} className="block h-full group">
            <Card className="h-full border-4 border-[var(--8bit-foreground)] bg-[var(--8bit-card)] shadow-[4px_4px_0px_0px_var(--8bit-foreground)] group-hover:translate-y-[2px] group-hover:translate-x-[2px] group-hover:shadow-[2px_2px_0px_0px_var(--8bit-foreground)] transition-all duration-200 cursor-pointer rounded-none">
                <div className="aspect-square bg-[var(--8bit-muted)] relative overflow-hidden border-b-4 border-[var(--8bit-foreground)]">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={game.title}
                            className="w-full h-full object-cover pixelated"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[var(--8bit-muted-foreground)] bg-[var(--8bit-muted)]">
                            <span className="text-4xl mb-2">👾</span>
                            <span className="text-[10px] font-retro text-center px-2">NO IMAGE</span>
                        </div>
                    )}
                </div>
                <CardHeader className="p-4 space-y-2">
                    <CardTitle className="text-sm truncate font-retro leading-tight">
                        {game.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3 text-[10px] font-retro opacity-80 leading-relaxed">
                        {game.description}
                    </CardDescription>
                </CardHeader>
            </Card>
        </Link>
    )
}
