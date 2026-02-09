import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useApiClient, useGame } from "@packages/ui-logic";
import { ArrowLeft, Clock, FileText, Plus, UserCircle, Play, GameController } from "@phosphor-icons/react";
import type { SessionSummary } from "@packages/ui-logic";
import { useState } from "react";
import { Pagination } from "../../../../components/common/Pagination";
import { Loader2 } from "lucide-react";
import { Button } from "../../../../components/ui/8bit/button";

export const Route = createFileRoute("/games/$id/play/")({
    component: SessionListScreen,
});

function SessionListScreen() {
    const { id: gameId } = Route.useParams();
    const api = useApiClient();
    const [page, setPage] = useState(1);
    const LIMIT = 10;

    const gameQuery = useGame(gameId);
    const game = gameQuery.data?.game;

    const sessionsQuery = useQuery({
        queryKey: ["play", "sessions", gameId, page],
        queryFn: async () => {
            const res = await api.play.listSessions(gameId, { limit: LIMIT, offset: (page - 1) * LIMIT });
            return res;
        },
    });

    // Helper to get character name - API now returns enriched data
    const getCharacterName = (session: SessionSummary) => {
        return session.characterName || "Unnamed Character";
    };

    if (sessionsQuery.isLoading || gameQuery.isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
            </div>
        );
    }

    if (sessionsQuery.isError) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
                <div className="text-destructive font-medium">Error loading sessions</div>
                <Link to="/games/$id" params={{ id: gameId }}>
                    <Button variant="outline" size="sm">Return to World</Button>
                </Link>
            </div>
        );
    }

    const sessions = (sessionsQuery.data?.sessions as unknown as SessionSummary[]) || [];
    const totalCount = sessionsQuery.data?.pagination?.count ?? 0;
    const totalPages = Math.ceil(totalCount / LIMIT);

    return (
        <div className="min-h-screen bg-background">
            {/* Compact Header */}
            <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                        <Link 
                            to="/games/$id" 
                            params={{ id: gameId }}
                            className="flex items-center gap-1 sm:gap-2 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        >
                            <ArrowLeft size={16} />
                            <span className="text-sm font-medium hidden sm:inline">Back</span>
                        </Link>
                        <div className="h-4 w-px bg-border/60 shrink-0" />
                        <h1 className="text-sm font-semibold text-foreground truncate max-w-[120px] sm:max-w-xs">
                            {game?.title || "Game Sessions"}
                        </h1>
                    </div>

                    <Link to="/games/$id/play/new" params={{ id: gameId }}>
                        <Button size="sm" className="h-8 px-2 sm:px-3 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                            <Plus size={14} weight="bold" />
                            <span className="hidden sm:inline">New Session</span>
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
                {/* Page Title */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <GameController size={16} />
                        <span className="text-xs font-medium uppercase tracking-wider">Sessions</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Your Adventures</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Resume a saved game or start a new journey.
                    </p>
                </div>

                {/* Sessions List */}
                {sessions.length > 0 ? (
                    <div className="space-y-3">
                        {sessions.map((session) => (
                            <Link
                                key={session.id}
                                to="/games/$id/play/$sessionId"
                                params={{ id: gameId, sessionId: session.id }}
                                className="group block"
                            >
                                <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card hover:border-border hover:bg-accent/50 transition-all">
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
                                        <UserCircle size={20} weight="duotone" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-medium text-foreground truncate">
                                                {getCharacterName(session)}
                                            </h3>
                                            <span className="px-1.5 py-0.5 rounded bg-secondary text-[10px] font-medium text-muted-foreground">
                                                Turn {session.currentTurn}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {session.lastPlayedAt 
                                                    ? new Date(session.lastPlayedAt).toLocaleDateString(undefined, { 
                                                        month: 'short', 
                                                        day: 'numeric',
                                                        year: new Date(session.lastPlayedAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                                                    })
                                                    : 'Just now'
                                                }
                                            </span>
                                            <span className="font-mono opacity-40">#{session.id.slice(0, 6)}</span>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Play size={16} weight="fill" className="text-primary" />
                                        </Button>
                                    </div>
                                </div>
                            </Link>
                        ))}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="pt-6">
                                <Pagination
                                    currentPage={page}
                                    totalPages={totalPages}
                                    onPageChange={setPage}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="text-center py-16 border border-dashed border-border/60 rounded-xl bg-card/50">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                            <FileText size={20} className="text-muted-foreground" />
                        </div>
                        <h3 className="font-medium text-foreground mb-1">No sessions yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Start your first adventure in this world.
                        </p>
                        <Link to="/games/$id/play/new" params={{ id: gameId }}>
                            <Button size="sm">
                                <Plus size={14} weight="bold" className="mr-1.5" />
                                Start New Game
                            </Button>
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
