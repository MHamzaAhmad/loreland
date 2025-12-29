import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient, useGame, getImageUrl } from "@packages/ui-logic";
import { Loader2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/games/$id/play/new")({
    component: NewSessionScreen,
});

function NewSessionScreen() {
    const { id: gameId } = Route.useParams();
    const navigate = useNavigate();
    const api = useApiClient();
    const queryClient = useQueryClient();

    // Fetch Game Data for Characters
    const gameQuery = useGame(gameId);

    // Mutation to start session
    const createSessionMutation = useMutation({
        mutationFn: async (characterId: string) => {
            const res = await api.play.start(gameId, undefined, characterId);
            return res; // Returns { sessionId, ... }
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["play", "sessions", gameId] });
            navigate({
                to: "/games/$id/play/$sessionId",
                params: { id: gameId, sessionId: data.sessionId }
            });
        },
        onError: (error) => {
            console.error("Failed to initialize session:", error);
            // In a real app we'd have a toast provider
            alert("Failed to initialize session: " + error.message);
        }
    });

    if (gameQuery.isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-background text-primary font-mono gap-2">
                <Loader2 className="animate-spin" />
                <span>LOADING_CHARACTER_ROSTER...</span>
            </div>
        );
    }

    if (gameQuery.isError || !gameQuery.data?.game) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4 font-mono bg-background">
                <div className="text-destructive">[DATA_CORRUPTION]</div>
                <div className="text-muted-foreground text-sm">Could not load game data.</div>
                <Link to="/games/$id/play" params={{ id: gameId }} className="text-primary hover:underline text-sm">
                    ← RETURN
                </Link>
            </div>
        );
    }

    const characters = gameQuery.data.game.characters || [];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
            <div className="max-w-2xl w-full space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-orbitron text-primary tracking-widest">
                        SELECT_OPERATIVE
                    </h1>
                    <p className="text-muted-foreground font-mono text-sm">
                        Choose your character to begin the simulation
                    </p>
                </div>

                {createSessionMutation.isPending && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-2 text-primary">
                            <Loader2 className="animate-spin w-8 h-8" />
                            <span className="font-mono text-sm animate-pulse">INITIALIZING_TIMELINE...</span>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {characters.map((char) => (
                        <button
                            key={char.characterId}
                            onClick={() => createSessionMutation.mutate(char.characterId)}
                            className="hud-panel p-4 text-left border border-primary/20 bg-background hover:bg-primary/5 hover:border-primary/50 transition-all group relative overflow-hidden rounded-lg flex gap-4"
                            disabled={createSessionMutation.isPending}
                        >
                            {char.portrait ? (
                                <img
                                    src={getImageUrl(char.portrait)}
                                    alt={char.name}
                                    className="w-20 h-20 object-cover border border-primary/20 rounded-sm"
                                />
                            ) : (
                                <div className="w-20 h-20 bg-primary/5 border border-primary/20 flex items-center justify-center text-primary/40 font-mono text-xs rounded-sm">
                                    NO_IMG
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-orbitron text-primary group-hover:animate-pulse truncate">
                                    {char.name}
                                </h3>
                                <p className="text-xs text-muted-foreground line-clamp-3 mt-1">
                                    {char.description || "No description available."}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="text-center">
                    <Link
                        to="/games/$id/play"
                        params={{ id: gameId }}
                        className="text-primary/60 hover:text-primary font-mono text-xs uppercase hover:underline flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-3 h-3" />
                        ABORT_SELECTION
                    </Link>
                </div>
            </div>
        </div>
    );
}
