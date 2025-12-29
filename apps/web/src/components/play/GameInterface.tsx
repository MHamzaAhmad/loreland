import { StoryFeed } from "./StoryFeed";
import { ActionConsole } from "./ActionConsole";
import { CharacterHUD } from "./CharacterHUD";
import { type CharacterStateSnapshot } from "@packages/ui-logic";
import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface GameInterfaceProps {
    gameId: string;
    messages: { role: "user" | "assistant"; content: string; id: string; sceneImageKey?: string }[];
    characterState: CharacterStateSnapshot | null;
    suggestedActions: string[];
    isTyping: boolean;
    isConnected: boolean;
    onSendTurn: (text: string) => void;
}

export function GameInterface({
    gameId,
    messages,
    characterState,
    suggestedActions,
    isTyping,
    isConnected,
    onSendTurn
}: GameInterfaceProps) {

    // Find latest scene image for Hero Header
    // We look for the MOST RECENT assistant message with a sceneImageKey
    const latestSceneMessage = [...messages].reverse().find(m => m.role === "assistant" && m.sceneImageKey);
    const heroImageUrl = latestSceneMessage?.sceneImageKey
        ? `https://pub-2d2c730403754714b2d93aa5408544d9.r2.dev/${latestSceneMessage.sceneImageKey}`
        : null;

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
                {/* Main Content Area (Story) */}
                <main className="flex-1 flex flex-col relative min-w-0">
                    {/* Cinematic Hero Image (Background/Top) */}
                    <div className="shrink-0 w-full h-48 md:h-64 relative border-b border-primary/20 overflow-hidden bg-black">
                        {heroImageUrl ? (
                            <>
                                <img
                                    src={heroImageUrl}
                                    alt="Current LOCATION"
                                    className="w-full h-full object-cover opacity-60 animate-in fade-in duration-1000 scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-background/50" />

                                {/* Overlay Text/Label */}
                                <div className="absolute bottom-4 left-4">
                                    <div className="text-[10px] font-mono text-primary/60 uppercase mb-1">CURRENT_LOCALE_RENDER</div>
                                    <div className="h-1 w-20 bg-primary/40" />
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary/20 font-mono text-sm uppercase">
                                [NO_VISUAL_DATA_AVAILABLE]
                            </div>
                        )}
                    </div>

                    <StoryFeed
                        messages={messages}
                        isTyping={isTyping}
                    />

                    {/* Input Area */}
                    <ActionConsole
                        onSendTurn={onSendTurn}
                        suggestedActions={suggestedActions}
                        isTyping={isTyping}
                        isConnected={isConnected}
                    />
                </main>

                {/* Sidebar (HUD) - Hidden on mobile, overlay or stacked maybe? For now sidebar on md+ */}
                <aside className="hidden md:flex flex-col w-72 border-l border-primary/20 bg-background/50 backdrop-blur-sm p-4 gap-4 z-20">
                    <CharacterHUD characterState={characterState} />

                    {/* Log / Mini Map Placeholder */}
                    <div className="flex-1 hud-panel p-4 opacity-50 min-h-[100px] flex items-center justify-center text-xs font-mono text-primary/40">
                        [TACTICAL_MAP_OFFLINE]
                    </div>
                </aside>
            </div>
        </div>
    );
}
