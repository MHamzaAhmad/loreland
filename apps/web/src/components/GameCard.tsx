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
        <Link to="/games/$id" params={{ id: game.id }}>
            <Card className="h-full hover:scale-[1.02] transition-transform cursor-pointer">
                <div className="aspect-square bg-[var(--8bit-muted)] relative overflow-hidden">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={game.title}
                            className="w-full h-full object-cover pixelated"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--8bit-muted-foreground)]">
                            <span className="text-4xl">🎮</span>
                        </div>
                    )}
                </div>
                <CardHeader className="p-3">
                    <CardTitle className="text-xs truncate">
                        {game.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-[10px]">
                        {game.description}
                    </CardDescription>
                </CardHeader>
            </Card>
        </Link>
    )
}
