import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@packages/ui-logic";
import { ArrowLeft, BookOpen, Clock, FileText, Plus, UserCircle, CaretRight } from "@phosphor-icons/react";
import type { SessionSummary } from "@packages/ui-logic";
import { useState } from "react";
import { Pagination } from "../../../../components/common/Pagination";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/games/$id/play/")({
    component: SessionListScreen,
});

function SessionListScreen() {
    const { id: gameId } = Route.useParams();
    const api = useApiClient();
    const [page, setPage] = useState(1);
    const LIMIT = 10;

    const sessionsQuery = useQuery({
        queryKey: ["play", "sessions", gameId, page],
        queryFn: async () => {
            const res = await api.play.listSessions(gameId, { limit: LIMIT, offset: (page - 1) * LIMIT });
            return res;
        },
    });

    if (sessionsQuery.isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#fcfbf9]">
                <Loader2 className="animate-spin w-8 h-8 text-muted-foreground" />
            </div>
        );
    }

    if (sessionsQuery.isError) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#fcfbf9]">
                <div className="text-destructive font-bold">Error loading sessions</div>
                <Link to="/games/$id" params={{ id: gameId }} className="text-primary hover:underline text-sm">
                    Return to World
                </Link>
            </div>
        );
    }

    const sessions = (sessionsQuery.data?.sessions as unknown as SessionSummary[]) || [];
    const totalCount = sessionsQuery.data?.pagination?.count ?? 0;
    const totalPages = Math.ceil(totalCount / LIMIT);

    return (
        <div className="min-h-screen bg-[#fcfbf9] pb-20 font-sans">
            {/* Header Section */}
            <div className="relative bg-[var(--pastel-blue)] text-[var(--pastel-blue-fg)] transition-colors duration-500">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />

                <div className="relative max-w-4xl mx-auto px-6 md:px-12 py-8 md:py-12">
                    <header className="flex items-center justify-between mb-8">
                        <Link to="/games/$id" params={{ id: gameId }} className="flex items-center gap-2 text-current/70 hover:text-current transition-colors group">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-medium font-serif">Back to World</span>
                        </Link>
                    </header>

                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 border border-white/20 text-[11px] font-bold uppercase tracking-wider shadow-sm text-current">
                            <BookOpen size={14} weight="bold" />
                            <span>Game History</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black font-serif tracking-tight text-current/90">
                            Your Games
                        </h1>
                        <p className="text-lg text-current/80 max-w-2xl font-serif">
                            Resume your adventures or start a new game.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 relative z-10 -mt-8">
                <div className="space-y-6">
                    {/* New Session Button */}
                    <Link
                        to="/games/$id/play/new"
                        params={{ id: gameId }}
                        className="group flex items-center gap-6 p-6 bg-card rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary hover:bg-white shadow-sm hover:shadow-md transition-all"
                    >
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus size={24} weight="bold" className="text-primary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-serif font-bold text-foreground group-hover:text-primary transition-colors">Start New Game</h3>
                            <p className="text-muted-foreground text-sm mt-1">Begin a new adventure with a selected character.</p>
                        </div>
                    </Link>

                    {/* Session List */}
                    <div className="bg-card rounded-3xl border border-dashed border-border/60 p-6 md:p-8 shadow-sm space-y-4">
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-muted-foreground px-2 pb-2">
                            <span>Saved Games</span>
                            <span>{totalCount} Total</span>
                        </div>

                        {sessions.length > 0 ? (
                            <div className="grid gap-3">
                                {sessions.map((session) => (
                                    <Link
                                        key={session.id}
                                        to="/games/$id/play/$sessionId"
                                        params={{ id: gameId, sessionId: session.id }}
                                        className="group block"
                                    >
                                        <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-secondary/20 hover:bg-white hover:border-border hover:shadow-sm transition-all">
                                            <div className="w-12 h-12 rounded-full bg-white border border-border/50 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                                <UserCircle size={28} weight="duotone" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-serif font-bold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                                                        {session.characterName || "Unknown Character"}
                                                    </h3>
                                                    <span className="px-1.5 py-0.5 rounded-md bg-white border border-border/50 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                                                        Turn {session.currentTurn}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock size={14} />
                                                        {session.lastPlayedAt ? new Date(session.lastPlayedAt).toLocaleDateString() : 'Just now'}
                                                    </span>
                                                    <span className="font-mono opacity-50">#{session.id.slice(0, 6)}</span>
                                                </div>
                                            </div>

                                            <div className="text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all">
                                                <CaretRight size={20} weight="bold" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground/60 space-y-2">
                                <FileText size={32} className="mx-auto opacity-50" />
                                <p className="font-serif italic">No games found. Start a new one above.</p>
                            </div>
                        )}

                        {totalPages > 1 && (
                            <div className="pt-4 border-t border-dashed border-border/50">
                                <Pagination
                                    currentPage={page}
                                    totalPages={totalPages}
                                    onPageChange={setPage}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
