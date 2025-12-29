import { createFileRoute, Link } from "@tanstack/react-router";
import { usePlaySession, useGame, useGameSession } from "@packages/ui-logic";
import { GameInterface } from "@/components/play/GameInterface";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/games/$id/play")({
    component: PlayGame,
});

/**
 * Build WebSocket URL based on environment
 */
function buildWebSocketUrl(relativePath: string): string {
    const isDev = import.meta.env.DEV;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

    if (isDev) {
        return `${protocol}//localhost:8787${relativePath}`;
    }

    const apiHost = import.meta.env.VITE_API_HOST || window.location.host;
    return `${protocol}//${apiHost}${relativePath}`;
}

function PlayGame() {
    const { id: gameId } = Route.useParams();
    const gameQuery = useGame(gameId);
    const playSession = usePlaySession(gameId, buildWebSocketUrl);

    console.log("[PlayGame] Render", {
        gameId,
        playSessionState: playSession.state,
        gameQueryLoading: gameQuery.isLoading,
    });

    // Route based on state machine
    switch (playSession.state.status) {
        case "loading":
            return <LoadingScreen />;

        case "error":
            return (
                <ErrorScreen
                    message={playSession.state.error.message}
                    gameId={gameId}
                    onRetry={playSession.reset}
                />
            );

        case "select_character":
            if (gameQuery.isLoading) {
                return <LoadingScreen />;
            }
            if (!gameQuery.data?.game) {
                return (
                    <ErrorScreen
                        message="Failed to load game data"
                        gameId={gameId}
                        onRetry={playSession.reset}
                    />
                );
            }
            return (
                <CharacterSelectionScreen
                    characters={gameQuery.data.game.characters || []}
                    onSelect={playSession.selectCharacter}
                    gameId={gameId}
                />
            );

        case "ready":
            return (
                <ActiveGameSession
                    wsUrl={playSession.state.config.wsUrl}
                    gameId={gameId}
                />
            );
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Active Game Session (uses useGameSession hook)
// ─────────────────────────────────────────────────────────────────────────────

function ActiveGameSession({ wsUrl, gameId }: { wsUrl: string; gameId: string }) {
    const session = useGameSession({
        url: wsUrl,
        onError: (e) => console.error("WebSocket error:", e),
    });

    return (
        <GameInterface
            gameId={gameId}
            {...session}
            onSendTurn={session.sendTurn}
        />
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Presentational Components (Dumb)
// ─────────────────────────────────────────────────────────────────────────────

function LoadingScreen() {
    return (
        <div className="h-screen flex items-center justify-center bg-black text-primary font-mono gap-2">
            <Loader2 className="animate-spin" />
            <span>INITIALIZING_NEURAL_LINK...</span>
        </div>
    );
}

function ErrorScreen({
    message,
    gameId,
    onRetry
}: {
    message: string;
    gameId: string;
    onRetry: () => void;
}) {
    return (
        <div className="h-screen flex flex-col items-center justify-center gap-4 font-mono">
            <div className="text-destructive">[SYSTEM_ERROR]</div>
            <div className="text-muted-foreground text-sm">{message}</div>
            <div className="flex gap-4">
                <button
                    onClick={onRetry}
                    className="text-primary hover:underline text-sm"
                >
                    RETRY
                </button>
                <Link
                    to="/games/$id"
                    params={{ id: gameId }}
                    className="text-primary hover:underline text-sm"
                >
                    ← RETURN TO MISSION BRIEFING
                </Link>
            </div>
        </div>
    );
}

function CharacterSelectionScreen({
    characters,
    onSelect,
    gameId,
}: {
    characters: Array<{ characterId: string; name: string; description: string | null; portrait: string | null }>;
    onSelect: (id: string) => void;
    gameId: string;
}) {
    return (
        <div className="h-screen flex flex-col items-center justify-center bg-background p-4">
            <div className="max-w-2xl w-full space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-orbitron text-primary tracking-widest">
                        SELECT_OPERATIVE
                    </h1>
                    <p className="text-muted-foreground font-mono text-sm">
                        Choose your character to begin the simulation
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {characters.map((char) => (
                        <CharacterCard
                            key={char.characterId}
                            character={char}
                            onSelect={() => onSelect(char.characterId)}
                        />
                    ))}
                </div>

                <div className="text-center">
                    <Link
                        to="/games/$id"
                        params={{ id: gameId }}
                        className="text-primary/60 hover:text-primary font-mono text-xs uppercase"
                    >
                        ← ABORT_MISSION
                    </Link>
                </div>
            </div>
        </div>
    );
}

function CharacterCard({
    character,
    onSelect,
}: {
    character: { characterId: string; name: string; description: string | null; portrait: string | null };
    onSelect: () => void;
}) {
    return (
        <button
            onClick={onSelect}
            className="hud-panel p-4 text-left hover:border-primary/50 transition-colors group"
        >
            <div className="flex gap-4">
                {character.portrait ? (
                    <img
                        src={`https://pub-2d2c730403754714b2d93aa5408544d9.r2.dev/${character.portrait}`}
                        alt={character.name}
                        className="w-20 h-20 object-cover border border-primary/20"
                    />
                ) : (
                    <div className="w-20 h-20 bg-primary/5 border border-primary/20 flex items-center justify-center text-primary/40 font-mono text-xs">
                        NO_IMG
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <h3 className="font-orbitron text-primary group-hover:animate-pulse truncate">
                        {character.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-3 mt-1">
                        {character.description || "No description available."}
                    </p>
                </div>
            </div>
        </button>
    );
}
