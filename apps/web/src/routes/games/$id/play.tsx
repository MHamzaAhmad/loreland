import { useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { usePlaySession, useGame, useGameSession, getImageUrl, SessionSummary } from "@packages/ui-logic";
import { GameInterface } from "@/components/play/GameInterface";
import { Loader2, Play, Plus, Clock, LogOut } from "lucide-react";

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

        case "session_list":
            return (
                <SessionSelectionScreen
                    sessions={playSession.state.sessions}
                    onResume={playSession.resumeSession}
                    onNew={playSession.createNewSession}
                    gameId={gameId}
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
                    onBack={playSession.backToSessions}
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
    const handleError = useCallback((e: unknown) => {
        console.error("WebSocket error:", e);
    }, []);

    const session = useGameSession({
        url: wsUrl,
        onError: handleError,
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

function SessionSelectionScreen({
    sessions,
    onResume,
    onNew,
    gameId
}: {
    sessions: SessionSummary[];
    onResume: (id: string) => void;
    onNew: () => void;
    gameId: string;
}) {
    return (
        <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col items-center">
            <div className="max-w-4xl w-full space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-primary/20 pb-6">
                    <div>
                        <h1 className="text-3xl font-orbitron text-primary tracking-widest mb-2">
                            SESSION_LOG
                        </h1>
                        <p className="text-muted-foreground font-mono text-sm">
                            Select a simulation to resume or initialize a new one.
                        </p>
                    </div>
                    <Link
                        to="/games/$id"
                        params={{ id: gameId }}
                        className="hud-button-secondary text-xs"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        EXIT_SIMULATION
                    </Link>
                </div>

                {/* Session List */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-mono text-primary/50 uppercase tracking-wider px-2">
                        <span>Available Sessions</span>
                        <span>{sessions.length} Records Found</span>
                    </div>

                    <div className="grid gap-3">
                        <button
                            onClick={onNew}
                            className="group relative flex items-center gap-4 p-6 border border-dashed border-primary/30 hover:border-primary/80 hover:bg-primary/5 transition-all w-full text-left"
                        >
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Plus className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-orbitron text-lg text-primary group-hover:translate-x-1 transition-transform">
                                    INITIALIZE_NEW_SIMULATION
                                </h3>
                                <p className="text-sm text-muted-foreground font-mono mt-1">
                                    Begin a new story timeline
                                </p>
                            </div>
                        </button>

                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                className="group flex items-center gap-4 p-4 border border-primary/10 bg-primary/5 hover:border-primary/50 transition-all"
                            >
                                <div className="hidden md:flex w-12 h-12 rounded-full bg-black border border-primary/20 items-center justify-center font-mono text-xs text-primary/50">
                                    {session.currentTurn}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-orbitron text-lg text-primary truncate">
                                        {session.characterName || "Unknown Operative"}
                                    </h3>
                                    <div className="flex items-center gap-4 mt-1 text-xs font-mono text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {session.lastPlayedAt ? new Date(session.lastPlayedAt).toLocaleDateString() : 'New'}
                                        </span>
                                        <span className="text-primary/40">ID: {session.id.slice(0, 8)}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary/60 text-[10px]">
                                            {session.model}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => onResume(session.id)}
                                    className="hud-button-primary text-xs whitespace-nowrap"
                                >
                                    <Play className="w-3 h-3 mr-2" />
                                    RESUME
                                </button>
                            </div>
                        ))}

                        {sessions.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground font-mono text-sm">
                                [NO_ACTIVE_SESSIONS_DETECTED]
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function CharacterSelectionScreen({
    characters,
    onSelect,
    onBack,
}: {
    characters: Array<{ characterId: string; name: string; description: string | null; portrait: string | null }>;
    onSelect: (id: string) => void;
    onBack: () => void;
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
                    <button
                        onClick={onBack}
                        className="text-primary/60 hover:text-primary font-mono text-xs uppercase hover:underline"
                    >
                        ← RETURN_TO_SESSION_LIST
                    </button>
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
            onClick={() => {
                onSelect();
            }}
            className="hud-panel p-4 text-left hover:border-primary/50 transition-colors group"
        >
            <div className="flex gap-4">
                {character.portrait ? (
                    <img
                        src={getImageUrl(character.portrait)}
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
