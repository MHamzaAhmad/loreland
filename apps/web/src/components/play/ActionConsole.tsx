import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionConsoleProps {
    onSendTurn: (message: string) => void;
    suggestedActions: string[];
    isTyping: boolean;
    isConnected: boolean;
}

export function ActionConsole({ onSendTurn, suggestedActions, isTyping, isConnected }: ActionConsoleProps) {
    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isTyping || !isConnected) return;

        onSendTurn(input);
        setInput("");
    };

    const handleSuggestion = (action: string) => {
        if (isTyping || !isConnected) return;
        onSendTurn(action);
    };

    // Auto-focus input when suggestions appear (turn end)
    useEffect(() => {
        if (!isTyping && suggestedActions.length > 0) {
            inputRef.current?.focus();
        }
    }, [isTyping, suggestedActions]);

    return (
        <div className="p-4 border-t border-primary/20 bg-background/50 backdrop-blur-xl relative z-20">
            {/* Suggested Actions */}
            {suggestedActions.length > 0 && !isTyping && (
                <div className="flex flex-wrap gap-2 mb-4 justify-center">
                    {suggestedActions.map((action, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSuggestion(action)}
                            disabled={isTyping || !isConnected}
                            className="group relative px-4 py-2 bg-primary/5 hover:bg-primary/10 border border-primary/30 hover:border-primary/60 text-xs md:text-sm text-primary transition-all duration-300 rounded-sm clip-path-polygon"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <Sparkles className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                                {action}
                            </span>
                            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 blur-md transition-opacity" />
                        </button>
                    ))}
                </div>
            )}

            <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto flex gap-2">
                <div className="relative flex-1">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isConnected ? "Enter action..." : "Connecting..."}
                        disabled={!isConnected || isTyping}
                        className="w-full bg-black/40 border border-primary/20 focus:border-primary/60 text-foreground px-4 py-3 pr-10 rounded-sm focus:outline-none focus:ring-1 focus:ring-primary/40 font-mono text-sm disabled:opacity-50 transition-all"
                    />
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
                </div>

                <button
                    type="submit"
                    disabled={!input.trim() || !isConnected || isTyping}
                    className={cn(
                        "px-4 bg-primary text-black font-bold uppercase tracking-wider text-xs md:text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2",
                        "clip-path-polygon" // Assuming you add a custom class or style for shaped buttons if needed, or rely on standard rounded
                    )}
                >
                    <span>Execute</span>
                    <Send className="w-4 h-4" />
                </button>
            </form>

            {/* Connection Status Indicator */}
            <div className="absolute bottom-1 right-2 flex items-center gap-1.5 pointer-events-none">
                <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isConnected ? "bg-green-500" : "bg-red-500")} />
                <span className="text-[9px] text-muted-foreground font-mono uppercase">
                    {isConnected ? "NET_ONLINE" : "NET_OFFLINE"}
                </span>
            </div>
        </div>
    );
}
