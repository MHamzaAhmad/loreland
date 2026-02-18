import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useImageModels, useApiClient, type ImageModel } from "@packages/ui-logic";
import { cn } from "@/lib/utils";
import {
    ArrowLeft,
    Check,
    Info,
    Image as ImageIcon,
    Lightning,
    Palette,
    Clock,
} from "phosphor-react";

export const Route = createFileRoute("/games/$id/play/$sessionId/settings")({
    component: SessionSettingsPage,
});

function SessionSettingsPage() {
    const { id: gameId, sessionId } = Route.useParams();
    const api = useApiClient();
    const { data: modelsData, isLoading: modelsLoading } = useImageModels();
    const [currentImageModel, setCurrentImageModel] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<string | null>(null);
    const [expandedModel, setExpandedModel] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        async function fetchSessionState() {
            try {
                const state = await api.play.start(gameId, sessionId);
                setCurrentImageModel(state.imageModel || "prism-flash");
                setSelectedModel(state.imageModel || "prism-flash");
            } catch (error) {
                console.error("Failed to fetch session state:", error);
            }
        }
        fetchSessionState();
    }, [gameId, sessionId, api]);

    const handleModelSelect = async (modelId: string) => {
        if (modelId === selectedModel || isUpdating) return;
        setSelectedModel(modelId);
        setIsUpdating(true);

        try {
            await api.play.updateImageModel(gameId, sessionId, modelId);
            setCurrentImageModel(modelId);
        } catch (error) {
            console.error("Failed to update image model:", error);
            setSelectedModel(currentImageModel);
        } finally {
            setIsUpdating(false);
        }
    };

    const toggleModelDetails = (modelId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedModel(expandedModel === modelId ? null : modelId);
    };

    if (modelsLoading || !currentImageModel) {
        return (
            <div className="min-h-screen bg-[#fcfbf9] flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (!modelsData) return null;

    const currentModel = modelsData.models.find((m: ImageModel) => m.id === currentImageModel);

    return (
        <div className="min-h-screen bg-[#fcfbf9]">
            <header className="border-b border-dashed border-primary/20 bg-white/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-xl mx-auto px-4 h-12 flex items-center justify-between">
                    <Link 
                        to="/games/$id/play/$sessionId"
                        params={{ id: gameId, sessionId }}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors group"
                    >
                        <ArrowLeft size={14} weight="bold" className="group-hover:-translate-x-0.5 transition-transform" />
                        <span className="text-xs font-medium">Back to Game</span>
                    </Link>
                    <h1 className="text-xs font-semibold text-foreground">Session Settings</h1>
                    <div className="w-10" />
                </div>
            </header>

            <main className="max-w-xl mx-auto px-4 py-8">
                <div className="space-y-8">
                    <div className="text-center">
                        <h1 className="text-lg font-semibold text-foreground">Image Model</h1>
                        <p className="text-xs text-muted-foreground mt-1">
                            Choose the image generation style for this session
                        </p>
                    </div>

                    <section className="space-y-3">
                        <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-primary" weight="fill" />
                            <h2 className="text-sm font-semibold text-foreground">Scene Generation</h2>
                        </div>

                        {currentModel && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-border/40 text-xs">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-muted-foreground">Active:</span>
                                <span className="font-medium">{currentModel.name}</span>
                                <span className="text-muted-foreground ml-auto flex items-center gap-1">
                                    <Clock size={10} />
                                    {currentModel.speed}
                                </span>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            {modelsData.models.map((model: ImageModel) => (
                                <ImageModelRow
                                    key={model.id}
                                    model={model}
                                    isSelected={model.id === selectedModel}
                                    isUpdating={isUpdating && selectedModel === model.id}
                                    isExpanded={expandedModel === model.id}
                                    onSelect={() => handleModelSelect(model.id)}
                                    onToggleDetails={(e) => toggleModelDetails(model.id, e)}
                                />
                            ))}
                        </div>
                    </section>

                    <div className="border-t border-dashed border-primary/20" />

                    <section className="space-y-3">
                        <p className="text-[10px] text-muted-foreground text-center">
                            Changes apply to future scene images only. Previously generated images remain unchanged.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}

interface ImageModelRowProps {
    model: ImageModel;
    isSelected: boolean;
    isUpdating: boolean;
    isExpanded: boolean;
    onSelect: () => void;
    onToggleDetails: (e: React.MouseEvent) => void;
}

function ImageModelRow({ model, isSelected, isUpdating, isExpanded, onSelect, onToggleDetails }: ImageModelRowProps) {
    const getModelIcon = () => {
        if (model.speed === "instant" || model.speed === "fast") {
            return <Lightning size={14} weight="fill" className="text-amber-500" />;
        }
        if (model.id.includes("canvas")) {
            return <Palette size={14} weight="fill" className="text-purple-500" />;
        }
        return <ImageIcon size={14} weight="fill" className="text-blue-500" />;
    };

    const getCostDot = () => {
        if (model.costLevel <= 2) return <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />;
        if (model.costLevel <= 3) return <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />;
        return <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />;
    };

    return (
        <div
            className={cn(
                "border rounded-lg overflow-hidden transition-colors",
                isSelected
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/60 hover:border-foreground/20 bg-white",
                isUpdating && "opacity-60"
            )}
        >
            <div 
                className="px-3 py-2 flex items-center gap-2 cursor-pointer"
                onClick={isUpdating ? undefined : onSelect}
            >
                <div className="shrink-0">
                    {isUpdating ? (
                        <div className="w-4 h-4 border border-primary/30 border-t-primary rounded-full animate-spin" />
                    ) : isSelected ? (
                        <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <Check size={8} weight="bold" className="text-primary-foreground" />
                        </div>
                    ) : (
                        <div className="w-4 h-4 rounded-full border border-border" />
                    )}
                </div>

                <div className="shrink-0 w-6 h-6 rounded-md bg-secondary flex items-center justify-center">
                    {getModelIcon()}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium truncate">{model.name}</span>
                        {model.isDefault && (
                            <span className="text-[9px] px-1 py-0 rounded bg-primary/10 text-primary">Def</span>
                        )}
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-muted-foreground capitalize">{model.speed}</span>
                    {getCostDot()}
                </div>

                <button
                    className="shrink-0 p-1 hover:bg-secondary rounded transition-colors"
                    onClick={onToggleDetails}
                >
                    <Info size={12} className={cn(isExpanded ? "text-primary" : "text-muted-foreground")} />
                </button>
            </div>

            {isExpanded && (
                <div className="px-3 pb-2 pt-0 border-t border-border/30">
                    <div className="pt-2 pl-6 space-y-2">
                        <p className="text-[10px] text-muted-foreground leading-relaxed">{model.description}</p>
                        
                        <div className="flex sm:hidden items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="capitalize">{model.speed}</span>
                            {getCostDot()}
                        </div>

                        <div className="flex flex-wrap gap-1">
                            {model.bestFor.slice(0, 3).map((use) => (
                                <span key={use} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                                    {use}
                                </span>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <div>
                                <span className="text-[9px] font-medium text-emerald-600">Pros</span>
                                <ul className="text-[9px] text-muted-foreground mt-0.5 space-y-0.5">
                                    {model.pros.slice(0, 2).map((pro) => (
                                        <li key={pro}>+ {pro}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <span className="text-[9px] font-medium text-rose-600">Cons</span>
                                <ul className="text-[9px] text-muted-foreground mt-0.5 space-y-0.5">
                                    {model.cons.slice(0, 2).map((con) => (
                                        <li key={con}>- {con}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
