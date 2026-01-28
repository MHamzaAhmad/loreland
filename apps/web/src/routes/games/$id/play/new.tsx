import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient, useGame, getImageUrl } from "@packages/ui-logic";
import { ArrowLeft, User, CircleNotch, Plus } from "@phosphor-icons/react";


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
            alert("Failed to initialize session: " + error.message);
        }
    });

    if (gameQuery.isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#fcfbf9]">
                <div className="flex flex-col items-center gap-4 text-muted-foreground/50">
                    <CircleNotch size={32} className="animate-spin text-primary" />
                    <span className="font-serif italic text-sm">Loading characters...</span>
                </div>
            </div>
        );
    }

    if (gameQuery.isError || !gameQuery.data?.game) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#fcfbf9]">
                <div className="text-destructive font-serif font-bold">Unable to load characters</div>
                <Link to="/games/$id/play" params={{ id: gameId }} className="text-primary hover:underline text-sm font-serif">
                    Return to Games
                </Link>
            </div>
        );
    }

    const characters = gameQuery.data.game.characters || [];

    return (
        <div className="min-h-screen bg-[#fcfbf9] font-sans pb-20">
            {/* Header */}
            <div className="bg-white/50 backdrop-blur-sm sticky top-0 z-30 border-b border-primary/10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link
                        to="/games/$id/play"
                        params={{ id: gameId }}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium font-serif">Cancel</span>
                    </Link>
                    <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground/50">
                        Select Character
                    </span>
                    <div className="w-16" /> {/* Spacer for balance */}
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12 md:py-16 space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black font-serif tracking-tight text-foreground">
                        Choose Your Character
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-serif leading-relaxed">
                        Choose a character to start your adventure. Each perspective offers unique insights into this world.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {characters.map((char) => (
                        <button
                            key={char.characterId}
                            onClick={() => {
                                createSessionMutation.mutate(char.characterId);
                            }}
                            disabled={createSessionMutation.isPending}
                            className="group relative flex flex-col text-left bg-card hover:bg-white rounded-2xl border-2 border-dashed border-border/60 hover:border-primary hover:shadow-lg transition-all overflow-hidden"
                        >
                            <div className="aspect-[16/9] w-full bg-secondary/20 relative overflow-hidden border-b border-dashed border-border/60">
                                {char.portrait ? (
                                    <img
                                        src={getImageUrl(char.portrait)}
                                        alt={char.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                                        <User size={48} weight="duotone" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                                <div className="absolute bottom-4 left-6 text-white">
                                    <h3 className="font-serif font-bold text-2xl leading-none tracking-tight">
                                        {char.name}
                                    </h3>
                                </div>
                            </div>

                            <div className="p-6 md:p-8 space-y-4">
                                <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 font-serif">
                                    {char.description || "No biographical data available."}
                                </p>
                                <div className="pt-4 flex items-center text-primary font-bold text-xs uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                                    <Plus size={14} className="mr-2" weight="bold" />
                                    Start Game
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {createSessionMutation.isPending && (
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
                        <div className="bg-card p-8 rounded-3xl shadow-xl border border-dashed border-primary/20 flex flex-col items-center gap-6 max-w-sm w-full mx-6 text-center">
                            <CircleNotch size={48} className="animate-spin text-primary" weight="duotone" />
                            <div className="space-y-2">
                                <h3 className="text-xl font-serif font-bold">Starting Game</h3>
                                <p className="text-sm text-muted-foreground">Preparing narrative context and loading character memory...</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

