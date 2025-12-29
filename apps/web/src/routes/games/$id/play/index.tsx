import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@packages/ui-logic";
import { Loader2, Plus, Clock, Play, LogOut } from "lucide-react";
import type { SessionSummary } from "@packages/ui-logic";

export const Route = createFileRoute("/games/$id/play/")({
    component: SessionListScreen,
});

function SessionListScreen() {
    const { id: gameId } = Route.useParams();
    const api = useApiClient();

    const sessionsQuery = useQuery({
        queryKey: ["play", "sessions", gameId],
        queryFn: async () => {
            const res = await api.play.listSessions(gameId);
            return (res.sessions as unknown as SessionSummary[]) || [];
        },
    });

    if (sessionsQuery.isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-background text-primary font-mono gap-2">
                <Loader2 className="animate-spin" />
                <span>LOADING_MISSION_LOGS...</span>
            </div>
        );
    }

    if (sessionsQuery.isError) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4 font-mono bg-background">
                <div className="text-destructive">[SYSTEM_ERROR]</div>
                <div className="text-muted-foreground text-sm">{(sessionsQuery.error as Error).message}</div>
                <Link to="/games/$id" params={{ id: gameId }} className="text-primary hover:underline text-sm">
                    ← RETURN TO BRIEFING
                </Link>
            </div>
        );
    }

    const sessions = sessionsQuery.data || [];

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
                        className="hud-button-secondary text-xs flex items-center gap-2 px-3 py-2 border border-primary/30 rounded hover:bg-primary/10 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
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
                        <Link
                            to="/games/$id/play/new"
                            params={{ id: gameId }}
                            className="group relative flex items-center gap-4 p-6 border border-dashed border-primary/30 hover:border-primary/80 hover:bg-primary/5 transition-all w-full text-left rounded-lg"
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
                        </Link>

                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                className="group flex items-center gap-4 p-4 border border-primary/10 bg-primary/5 hover:border-primary/50 transition-all rounded-lg"
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

                                <Link
                                    to="/games/$id/play/$sessionId"
                                    params={{ id: gameId, sessionId: session.id }}
                                    className="hud-button-primary text-xs whitespace-nowrap flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded font-bold"
                                >
                                    <Play className="w-3 h-3" />
                                    RESUME
                                </Link>
                            </div>
                        ))}

                        {sessions.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground font-mono text-sm border border-primary/10 rounded-lg">
                                [NO_ACTIVE_SESSIONS_DETECTED]
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
