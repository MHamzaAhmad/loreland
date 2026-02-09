import { StoryFeed } from "./StoryFeed";
import { ActionConsole } from "./ActionConsole";
import { CharacterHUD } from "./CharacterHUD";
import { type CharacterStateSnapshot } from "@packages/ui-logic";
import { CreditDisplay } from "@/components/CreditDisplay";
import { ArrowLeft, Settings } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Coin } from "@phosphor-icons/react";

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
    // Credit info
    turnCost?: number | null;
    currentBalance?: number | null;
    onBuyCredits: () => void;
    isLowBalance?: boolean;
    // States panel
    onToggleStatesPanel?: () => void;
    // Storytelling mode
    storytellingMode?: boolean;
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
    onRewind,
    turnCost,
    currentBalance,
    onBuyCredits,
    isLowBalance,
    onToggleStatesPanel,
    storytellingMode,
}: GameInterfaceProps) {

    return (
        <div className="h-[100dvh] w-full flex flex-col bg-[#fcfbf9] overflow-hidden relative selection:bg-primary/10">

            {/* Header / Nav */}
            <header className="h-16 border-b border-dashed border-primary/20 flex items-center px-6 bg-white/50 backdrop-blur-md z-30 shrink-0 justify-between">
                <Link to="/games/$id" params={{ id: gameId }} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-serif font-medium">Return to World</span>
                </Link>

                {/* Center: Turn number with cost badge */}
                <div className="flex flex-col items-center">
                    <div className="font-serif font-bold text-lg text-foreground/80 tracking-tight">
                        Turn {turnData?.turnNumber || 0}
                    </div>
                    {turnCost !== null && turnCost !== undefined && turnCost > 0 && (
                        <div className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Coin className="w-3 h-3" weight="fill" />
                            <span>-{turnCost}</span>
                        </div>
                    )}
                </div>

                {/* Right: Credit balance and Settings */}
                <div className="flex items-center gap-2">
                    {currentBalance !== null && currentBalance !== undefined && (
                        <CreditDisplay
                            balance={currentBalance}
                            isLow={isLowBalance}
                            onBuyClick={onBuyCredits}
                            showAddButton={true}
                        />
                    )}
                    <Link
                        to="/settings"
                        className="p-2 hover:bg-secondary/50 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                        title="Settings"
                    >
                        <Settings className="w-4 h-4" />
                    </Link>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Content Area */}
                <main className="flex-1 flex flex-col relative min-w-0">
                    <StoryFeed
                        turnData={turnData}
                        isTyping={isTyping}
                        characterState={characterState}
                        onToggleStatesPanel={onToggleStatesPanel}
                        history={history}
                        onRewind={onRewind}
                        storytellingMode={storytellingMode}
                    />

                    {/* Input Area - Distinct Footer Section */}
                    <div className="z-20 bg-[#fcfbf9]/80 backdrop-blur-md border-t border-dashed border-primary/20 p-3 sm:p-4">
                        <ActionConsole
                            onSendTurn={onSendTurn}
                            suggestedActions={suggestedActions}
                            isTyping={isTyping}
                            isConnected={isConnected}
                        />
                    </div>
                </main>

                {/* Sidebar (HUD) - Desktop only */}
                <aside className="hidden lg:flex flex-col w-80 border-l border-dashed border-primary/20 bg-[#fcfbf9] p-6 gap-6 z-20">
                    <CharacterHUD characterState={characterState} />

                    {/* Mission Log */}
                    <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl border border-border/40 shadow-sm overflow-hidden">
                        <div className="p-3 border-b border-border/40 bg-secondary/30 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Game History
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-muted-foreground/20">
                            {history.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground/40 text-xs font-serif italic">
                                    No history recorded yet.
                                </div>
                            ) : (
                                [...history].reverse().map((entry) => (
                                    <div
                                        key={entry.turnNumber}
                                        className="group relative p-3 rounded-lg hover:bg-secondary/50 border border-transparent hover:border-border/50 transition-all cursor-pointer"
                                        onClick={() => onRewind?.(entry.turnNumber)}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                                                Turn {entry.turnNumber}
                                            </span>
                                            <span className="opacity-0 group-hover:opacity-100 text-[10px] text-primary font-medium">
                                                Restore
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground line-clamp-2 font-serif leading-relaxed">
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
