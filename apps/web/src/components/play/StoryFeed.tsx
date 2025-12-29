import Markdown from "react-markdown";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ImageIcon, Terminal, Heart, Brain, Zap } from "lucide-react";
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
}

export function TurnDisplay({ turnData, isTyping, characterState }: TurnDisplayProps) {
    const [showDebug, setShowDebug] = useState(false);

    if (!turnData) {
        return (
            <div className="flex-1 flex items-center justify-center text-primary/40 font-mono animate-pulse">
                INITIALIZING_VISUAL_INTERFACE...
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Background / Scene Image Layer */}
            <div className="absolute inset-0 z-0 bg-black">
                {turnData.sceneImageKey ? (
                    <div className="w-full h-full relative">
                        <img
                            src={getImageUrl(turnData.sceneImageKey)}
                            alt="Scene"
                            className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/80 to-transparent" />
                    </div>
                ) : (
                    <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
                )}
            </div>

            {/* Content Layer */}
            <div className="relative z-10 flex-1 flex flex-col p-4 md:p-8 pb-32 md:pb-40 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20">

                {/* Header Info */}
                <div className="flex items-center justify-between mb-8 opacity-70 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 text-xs font-mono text-primary/60">
                        <span className="w-2 h-2 bg-primary/50 rounded-full animate-pulse" />
                        TURN_SEQUENCE: {turnData.turnNumber.toString().padStart(3, '0')}
                    </div>
                    <button
                        onClick={() => setShowDebug(!showDebug)}
                        className="flex items-center gap-2 text-xs font-mono text-primary/40 hover:text-primary transition-colors"
                    >
                        <Terminal className="w-3 h-3" />
                        LOGIC_KERNEL
                    </button>
                </div>

                {/* Vitals Panel (Mobile/Integrated) */}
                {characterState && (
                    <div className="flex gap-4 mb-6 md:hidden">
                        <div className="flex items-center gap-2 text-red-400 font-mono text-xs border border-red-500/20 bg-red-500/10 px-2 py-1 rounded">
                            <Heart className="w-3 h-3" /> {characterState.health}%
                        </div>
                    </div>
                )}

                {/* Agent Thought / Debug View */}
                {showDebug && turnData.agentThought && (
                    <div className="mb-6 p-4 rounded bg-black/60 border-l-2 border-primary/50 font-mono text-xs text-primary/70 animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 mb-1 text-primary/40 uppercase tracking-widest">
                            <Brain className="w-3 h-3" /> Analysis Buffer
                        </div>
                        {turnData.agentThought}
                    </div>
                )}

                {/* Main Narrative */}
                <div className="mt-auto max-w-3xl mx-auto w-full">
                    <div className="prose prose-invert prose-lg md:prose-xl max-w-none text-shadow-sm">
                        <Markdown>{turnData.narrative}</Markdown>
                    </div>

                    {isTyping && (
                        <div className="mt-4 flex items-center gap-2 text-primary/60 font-mono text-xs animate-pulse">
                            <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-2 h-2 bg-current rounded-full animate-bounce" />
                            <span>CALCULATING_OUTCOME...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Re-export as StoryFeed to keep imports working without changing parent file yet
export { TurnDisplay as StoryFeed };
