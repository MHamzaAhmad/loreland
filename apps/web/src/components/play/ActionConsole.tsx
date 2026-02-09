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
        <div className="relative z-20 max-w-3xl mx-auto space-y-2">
            {/* Suggested Actions - Above input, centered wrap */}
            {suggestedActions.length > 0 && !isTyping && (
                <div className="flex flex-wrap gap-1.5 justify-center">
                    {suggestedActions.map((action, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSuggestion(action)}
                            disabled={isTyping || !isConnected}
                            className="group px-2.5 py-1 sm:px-3 sm:py-1.5 bg-white hover:bg-primary hover:text-white border border-border/50 hover:border-primary text-xs sm:text-sm text-foreground transition-all duration-200 rounded-full font-medium shadow-sm"
                        >
                            <span className="flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100" />
                                {action}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="relative flex gap-2">
                <div className="relative flex-1">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isConnected ? "What do you do next?" : "Connecting..."}
                        disabled={!isConnected || isTyping}
                        className="w-full bg-white border border-border/60 focus:border-primary text-foreground px-4 py-2 sm:px-5 sm:py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm sm:text-base shadow-sm disabled:opacity-50 transition-all font-serif placeholder:font-sans placeholder:text-muted-foreground/60"
                    />
                </div>

                <button
                    type="submit"
                    disabled={!input.trim() || !isConnected || isTyping}
                    className={cn(
                        "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all shadow-sm shrink-0",
                        !input.trim() || !isConnected || isTyping
                            ? "bg-secondary text-muted-foreground cursor-not-allowed"
                            : "bg-primary text-primary-foreground hover:scale-105 hover:shadow-md"
                    )}
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
}
