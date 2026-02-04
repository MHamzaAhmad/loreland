import Markdown from "react-markdown";
import { ListDashes, Heart } from "@phosphor-icons/react";
import { getImageUrl } from "@packages/ui-logic";
import type { CharacterStateSnapshot } from "@packages/ui-logic";

interface TurnDisplayProps {
    isTyping: boolean;
    turnData: {
        turnNumber: number;
        narrative: string;
        sceneImageKey?: string;
        agentThought?: string;
    } | null;
    characterState: CharacterStateSnapshot | null;
    showStatesPanel?: boolean;
    onToggleStatesPanel?: () => void;
}

export function TurnDisplay({ turnData, isTyping, characterState, onToggleStatesPanel }: TurnDisplayProps) {
    if (!turnData || !turnData.narrative) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/40 gap-4 animate-pulse">
                <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                <div className="text-sm font-serif italic">Loading story...</div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden relative bg-[#fcfbf9]">
            {/* Content Layer */}
            <div className="relative z-10 flex-1 flex flex-col p-4 md:p-12 pb-32 md:pb-40 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/10">
                <div className="max-w-3xl mx-auto w-full space-y-8">
                    {/* Header Info */}
                    <div className="flex items-center justify-between opacity-40 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            Turn {turnData.turnNumber}
                        </div>
                        {onToggleStatesPanel && (
                            <button
                                onClick={onToggleStatesPanel}
                                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                            >
                                <ListDashes className="w-3 h-3" weight="duotone" />
                                States
                            </button>
                        )}
                    </div>

                    {/* Vitals Panel (Mobile/Integrated) */}
                    {characterState && (
                        <div className="flex gap-4 md:hidden">
                            <div className="flex items-center gap-2 text-primary font-bold text-xs border border-primary/20 bg-primary/5 px-2 py-1 rounded-full">
                                <Heart className="w-3 h-3" weight="fill" /> {characterState.health}%
                            </div>
                        </div>
                    )}

                    {/* Scene Image - Polaroid Style */}
                    {turnData.sceneImageKey && (
                        <div className="relative w-full aspect-video md:aspect-[21/9] rounded-xl overflow-hidden shadow-sm border border-border/50 bg-secondary/20">
                            <img
                                src={getImageUrl(turnData.sceneImageKey)}
                                alt="Scene"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-xl pointer-events-none" />
                        </div>
                    )}

                    {/* Main Narrative */}
                    <div className="prose prose-lg md:prose-xl max-w-none prose-p:font-serif prose-headings:font-serif prose-p:text-foreground/90 prose-headings:text-foreground">
                        <Markdown>{turnData.narrative}</Markdown>
                    </div>

                    {isTyping && (
                        <div className="mt-8 flex items-center gap-3 text-muted-foreground/50">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
                            </div>
                            <span className="font-serif italic text-sm">Writing...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Re-export as StoryFeed to keep imports working
export { TurnDisplay as StoryFeed };
