import { StoryFeed } from "./StoryFeed";
import { ActionConsole } from "./ActionConsole";
import { CharacterHUD } from "./CharacterHUD";
import { type CharacterStateSnapshot } from "@packages/ui-logic";
import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface GameInterfaceProps {
    gameId: string;
    turnData: {
        turnNumber: number;
        narrative: string;
        sceneImageKey?: string;
        agentThought?: string;
    } | null;
    characterState: CharacterStateSnapshot | null;
    suggestedActions: string[];
    history: { turnNumber: number; summary: string }[];
    isTyping: boolean;
    isConnected: boolean;
    onSendTurn: (text: string) => void;
    onRewind?: (turnNumber: number) => void;
}

export function GameInterface({
    gameId,
    turnData,
    characterState,
    suggestedActions,
    history,
    isTyping,
    isConnected,
    onSendTurn,
    onRewind
}: GameInterfaceProps) {

    return (
        <div className="h-screen w-full flex flex-col bg-background overflow-hidden relative selection:bg-primary/30">
            {/* Scanline Overlay */}
            <div className="scanline-overlay pointer-events-none" />

            {/* Header / Nav */}
            <header className="h-14 border-b border-primary/20 flex items-center px-4 bg-background/80 backdrop-blur-md z-30 shrink-0">
                <Link to="/games/$id" params={{ id: gameId }} className="flex items-center gap-2 text-primary/60 hover:text-primary transition-colors text-sm font-mono uppercase">
                    <ArrowLeft className="w-4 h-4" />
                    <span>ABORT_MISSION</span>
                </Link>
                <div className="mx-auto font-orbitron text-primary tracking-widest text-lg animate-pulse">
                    LORELAND_SIMULATION
                </div>
                <div className="w-20" /> {/* Spacer for centering */}
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Content Area */}
                <main className="flex-1 flex flex-col relative min-w-0">
                    <StoryFeed
                        turnData={turnData}
                        isTyping={isTyping}
                        characterState={characterState}
                    />

                    {/* Input Area - Overlay on top of the turn display at the bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent z-20">
                        <ActionConsole
                            onSendTurn={onSendTurn}
                            suggestedActions={suggestedActions}
                            isTyping={isTyping}
                            isConnected={isConnected}
                        />
                    </div>
                </main>

                {/* Sidebar (HUD) */}
                <aside className="hidden md:flex flex-col w-72 border-l border-primary/20 bg-background/50 backdrop-blur-sm p-4 gap-4 z-20">
                    <CharacterHUD characterState={characterState} />

                    {/* Mission Log */}
                    <div className="flex-1 flex flex-col min-h-0 border border-primary/20 bg-black/20 rounded">
                        <div className="p-2 border-b border-primary/20 bg-primary/5 text-xs font-mono uppercase tracking-wider text-primary/70">
                            MISSION_LOG
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-primary/20">
                            {history.length === 0 ? (
                                <div className="text-center py-8 text-primary/30 text-[10px] font-mono">
                                    NO_PRIOR_RECORDS
                                </div>
                            ) : (
                                [...history].reverse().map((entry) => (
                                    <div
                                        key={entry.turnNumber}
                                        className="group relative p-2 rounded hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all cursor-pointer"
                                        onClick={() => onRewind?.(entry.turnNumber)}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-mono text-primary/50">
                                                TURN_{entry.turnNumber.toString().padStart(3, '0')}
                                            </span>
                                            <span className="opacity-0 group-hover:opacity-100 text-[10px] text-primary/80 uppercase">
                                                RESTORE
                                            </span>
                                        </div>
                                        <div className="text-xs text-primary/80 line-clamp-2">
                                            {entry.summary}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
