import Markdown from "react-markdown";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ImageIcon } from "lucide-react";

interface StoryFeedProps {
    isTyping: boolean;
    messages: { role: "user" | "assistant"; content: string; id: string; sceneImageKey?: string }[];
}

export function StoryFeed({ messages, isTyping }: StoryFeedProps) {
    const [expandedImage, setExpandedImage] = useState<string | null>(null);

    // Get R2 public URL (assuming it's configured or proxied)
    const getImageUrl = (key: string) => {
        return `https://pub-2d2c730403754714b2d93aa5408544d9.r2.dev/${key}`; // TODO: Replace with env var
    };

    return (
        <div className="flex-1 overflow-y-auto space-y-6 p-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
            {messages.map((msg, _idx) => (
                <div
                    key={msg.id}
                    className={cn(
                        "flex flex-col gap-2 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500",
                        msg.role === "assistant" ? "items-start" : "items-end"
                    )}
                >
                    <div
                        className={cn(
                            "rounded-lg p-4 max-w-[90%] backdrop-blur-sm relative border",
                            msg.role === "assistant"
                                ? "bg-card/40 border-primary/20 text-foreground"
                                : "bg-primary/10 border-primary/40 text-primary-foreground"
                        )}
                    >
                        {/* Message Content */}
                        <div className="prose prose-invert prose-sm max-w-none">
                            <Markdown>{msg.content}</Markdown>
                        </div>

                        {/* Scene Image Thumbnail (Assistant only) */}
                        {msg.role === "assistant" && msg.sceneImageKey && (
                            <div className="mt-4 group relative">
                                <div
                                    className="cursor-pointer overflow-hidden rounded-md border border-primary/30 w-full h-32 md:h-48 relative"
                                    onClick={() => setExpandedImage(getImageUrl(msg.sceneImageKey!))}
                                >
                                    <img
                                        src={getImageUrl(msg.sceneImageKey)}
                                        alt="Scene visualization"
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                        <div className="flex items-center gap-1 text-xs text-primary font-mono">
                                            <ImageIcon className="w-3 h-3" />
                                            <span>VIEW_SCENE_DATA</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Decorative Corner Brackets */}
                        <div className="absolute -top-px -left-px w-2 h-2 border-t border-l border-current opacity-50" />
                        <div className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-current opacity-50" />
                    </div>
                </div>
            ))}

            {isTyping && (
                <div className="flex items-center gap-2 max-w-3xl mx-auto text-primary/60 font-mono text-xs animate-pulse">
                    <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-current rounded-full animate-bounce" />
                    <span>NEURAL_PROCESSING...</span>
                </div>
            )}

            {/* Expanded Image Modal */}
            {expandedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-300"
                    onClick={() => setExpandedImage(null)}
                >
                    <div className="relative max-w-7xl max-h-[90vh] w-full rounded-lg border border-primary/30 overflow-hidden shadow-[0_0_50px_rgba(0,243,255,0.2)]">
                        <img
                            src={expandedImage}
                            alt="Scene Full"
                            className="w-full h-full object-contain"
                        />
                        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 border border-primary/20 text-xs font-mono text-primary/80">
                            CLICK_TO_CLOSE
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
