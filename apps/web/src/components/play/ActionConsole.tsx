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
        <div className="relative z-20 max-w-3xl mx-auto space-y-4">

            {/* Suggested Actions */}
            {suggestedActions.length > 0 && !isTyping && (
                <div className="flex flex-wrap gap-2 justify-center animate-in slide-in-from-bottom-2 fade-in">
                    {suggestedActions.map((action, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSuggestion(action)}
                            disabled={isTyping || !isConnected}
                            className="group px-4 py-2 bg-white hover:bg-primary hover:text-white border border-border/60 hover:border-primary shadow-sm hover:shadow-md text-sm text-foreground transition-all duration-200 rounded-full font-medium"
                        >
                            <span className="flex items-center gap-2">
                                <Sparkles className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                                {action}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            <form onSubmit={handleSubmit} className="relative flex gap-2">
                <div className="relative flex-1">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isConnected ? "What do you do next?" : "Connecting..."}
                        disabled={!isConnected || isTyping}
                        className="w-full bg-white border border-border/60 focus:border-primary text-foreground px-6 py-4 pr-12 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 text-lg shadow-sm disabled:opacity-50 transition-all font-serif placeholder:font-sans placeholder:text-muted-foreground/60"
                    />
                </div>

                <button
                    type="submit"
                    disabled={!input.trim() || !isConnected || isTyping}
                    className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-sm",
                        !input.trim() || !isConnected || isTyping
                            ? "bg-secondary text-muted-foreground cursor-not-allowed"
                            : "bg-primary text-primary-foreground hover:scale-105 hover:shadow-md"
                    )}
                >
                    <Send className="w-5 h-5 ml-0.5" />
                </button>
            </form>

            {/* Connection Status Indicator */}
            <div className="flex justify-center">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/50 border border-border/20 backdrop-blur-sm">
                    <div className={cn("w-1.5 h-1.5 rounded-full", isConnected ? "bg-green-500" : "bg-red-500")} />
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                        {isConnected ? "Connected" : "Offline"}
                    </span>
                </div>
            </div>
        </div>
    );
}
