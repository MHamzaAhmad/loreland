import { createFileRoute } from "@tanstack/react-router";
import { useGameSession } from "@packages/ui-logic";
import { GameInterface } from "@/components/play/GameInterface";
import { Loader2 } from "lucide-react";
import { useUser, useApiClient } from "@packages/ui-logic";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/games/$id/play")({
    component: PlayGame,
});

function PlayGame() {
    const { id: gameId } = Route.useParams();
    // Pre-fetch user state if needed, mostly handled by useUser internal cache
    useUser();

    return <GameSessionLoader gameId={gameId} />;
}

function GameSessionLoader({ gameId }: { gameId: string }) {
    const api = useApiClient();
    const [config, setConfig] = useState<{ wsUrl: string; sessionId: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initSession = async () => {
            try {
                // Try to find existing sessions first
                // We assume the API has this endpoint based on our client update
                const sessionsRes = await api.play.listSessions(gameId);
                const latestSession = sessionsRes.sessions[0];

                // Start or resume
                const res = await api.play.start(
                    gameId,
                    latestSession?.id
                );

                // Construct full WS URL
                // The API returns relative path e.g. /api/games/...
                // If in dev, we might need adjustments, but assuming proxy/same-origin in prod.
                const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
                const host = window.location.host.replace(":5173", ":8787"); // Dev hack
                const fullWsUrl = `${protocol}//${host}${res.wsUrl}`;

                setConfig({ wsUrl: fullWsUrl, sessionId: res.sessionId });

            } catch (err) {
                console.error("Failed to init session:", err);
                setError("Failed to initialize game session. Is the game server running?");
            }
        };

        if (gameId) {
            initSession();
        }
    }, [gameId, api]);

    if (error) {
        return (
            <div className="h-screen flex items-center justify-center text-destructive font-mono">
                [ERROR: {error}]
            </div>
        );
    }

    if (!config) {
        return (
            <div className="h-screen flex items-center justify-center bg-black text-primary font-mono gap-2">
                <Loader2 className="animate-spin" />
                <span>INITIALIZING_NEURAL_LINK...</span>
            </div>
        );
    }

    return <ActiveGameSession wsUrl={config.wsUrl} gameId={gameId} />;
}

function ActiveGameSession({ wsUrl, gameId }: { wsUrl: string; gameId: string }) {
    const session = useGameSession({
        url: wsUrl,
        onError: (e: any) => console.error("WS Error", e)
    });

    return (
        <GameInterface
            gameId={gameId}
            {...session}
            onSendTurn={session.sendTurn}
        />
    );
}
