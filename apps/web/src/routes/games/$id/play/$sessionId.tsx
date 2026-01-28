import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useGameSession, useApiClient } from "@packages/ui-logic";
import { GameInterface } from "@/components/play/GameInterface";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/games/$id/play/$sessionId")({
    component: ActiveGameRoute,
});

function buildWebSocketUrl(relativePath: string): string {
    const isDev = import.meta.env.DEV;

    if (isDev) {
        return `ws://localhost:8787${relativePath}`;
    }

    const apiHost = import.meta.env.VITE_API_URL || window.location.host;
    return `${apiHost.replace("http://", "ws://").replace("https://", "wss://")}${relativePath}`;
}

function ActiveGameRoute() {
    const { id: gameId, sessionId } = Route.useParams();
    const api = useApiClient();
    const [wsUrl, setWsUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Initial fetch to get the session config/verify ownership and get WS URL
    // Actually, we can usually construct the WS URL if we know the pattern, 
    // BUT the backend endpoint `GET /play/start` (or similar) validates and returns the specific WS path.
    // The previous implementation used `resumeQuery` calling `api.play.start(gameId, sessionId)` to get the URL.

    useEffect(() => {
        let mounted = true;
        async function initSession() {
            try {
                // We call start to "resume" and get the valid WS URL
                const res = await api.play.start(gameId, sessionId);
                if (mounted) {
                    setWsUrl(buildWebSocketUrl(res.wsUrl));
                }
            } catch (err: any) {
                if (mounted) {
                    setError(err.message || "Failed to connect to session uplink.");
                }
            }
        }
        initSession();
        return () => { mounted = false; };
    }, [gameId, sessionId, api]);

    const handleError = useCallback((e: unknown) => {
        console.error("WebSocket error:", e);
        // Optionally set global error state here if WS fails fatally
    }, []);

    const session = useGameSession({
        url: wsUrl || "",
        onError: handleError,
    });

    if (error) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#fcfbf9]">
                <div className="text-destructive font-serif font-bold">Connection Failed</div>
                <div className="text-muted-foreground text-sm font-serif">{error}</div>
                <Link to="/games/$id/play" params={{ id: gameId }} className="text-primary hover:underline text-sm font-serif">
                    Return to Game
                </Link>
            </div>
        );
    }

    if (!wsUrl) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-[#fcfbf9] text-primary gap-4">
                <Loader2 className="animate-spin text-primary/60" />
                <span className="font-serif italic text-muted-foreground">Connecting to world...</span>
            </div>
        );
    }

    return (
        <GameInterface
            gameId={gameId}
            turnData={session.currentTurnData}
            characterState={session.characterState}
            suggestedActions={session.suggestedActions}
            history={session.history}
            isTyping={session.isTyping}
            isConnected={session.isConnected}
            onSendTurn={session.sendTurn}
            onRewind={session.rewindToTurn}
        />
    );
}
