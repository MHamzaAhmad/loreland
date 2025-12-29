import { type CharacterStateSnapshot } from "@packages/ui-logic";
import { cn } from "@/lib/utils";
import { Shield, Zap, Activity, Skull } from "lucide-react";

interface CharacterHUDProps {
    characterState: CharacterStateSnapshot | null;
}

export function CharacterHUD({ characterState }: CharacterHUDProps) {
    if (!characterState) return null;

    const { health, skillModifiers } = characterState;
    const healthPercent = Math.max(0, Math.min(100, health));

    return (
        <div className="hud-panel p-4 flex flex-col gap-4">
            <h3 className="text-xs font-mono text-primary/60 uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-3 h-3" />
                BIOSCAN_ACTIVE
            </h3>

            {/* Health Bar */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono uppercase text-muted-foreground">
                    <span>Vitality</span>
                    <span className={cn(
                        health < 30 ? "text-destructive" : "text-primary"
                    )}>{health}%</span>
                </div>
                <div className="h-4 bg-black/50 border border-primary/20 relative overflow-hidden">
                    {/* Grid Pattern BG */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCsgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiAvPgo8cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDAsIDI0MywgMjU1LCAwLjEpIiAvPgo8L3N2Zz4=')] opacity-20" />

                    {/* Bar */}
                    <div
                        className={cn(
                            "h-full transition-all duration-500 ease-out relative",
                            health < 30 ? "bg-destructive shadow-[0_0_10px_rgba(255,0,60,0.5)]" : "bg-primary shadow-[0_0_10px_rgba(0,243,255,0.5)]"
                        )}
                        style={{ width: `${healthPercent}%` }}
                    >
                        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/50" />
                    </div>
                </div>
            </div>

            {/* Skills / Modifiers */}
            <div className="space-y-2">
                <h4 className="text-[10px] font-mono text-primary/40 uppercase">Active Modifiers</h4>
                <div className="grid grid-cols-2 gap-2">
                    {Object.entries(skillModifiers as Record<string, number>).length > 0 ? Object.entries(skillModifiers as Record<string, number>).map(([skill, mod]) => (
                        <div key={skill} className="bg-primary/5 border border-primary/10 p-2 flex justify-between items-center">
                            <span className="text-xs text-primary/80 uppercase truncate">{skill}</span>
                            <span className={cn(
                                "text-xs font-mono font-bold",
                                mod > 0 ? "text-green-400" : "text-destructive"
                            )}>
                                {mod > 0 ? "+" : ""}{mod}
                            </span>
                        </div>
                    )) : (
                        <div className="col-span-2 text-[10px] text-muted-foreground/50 italic text-center py-2">
                            NO_ACTIVE_MODIFIERS
                        </div>
                    )}
                </div>
            </div>

            {/* Status Icons (Decorative) */}
            <div className="mt-auto pt-4 border-t border-primary/10 flex justify-around opacity-50">
                <Activity className="w-4 h-4 text-primary animate-pulse" />
                <Zap className="w-4 h-4 text-primary" />
                <Skull className={cn("w-4 h-4 transition-colors", health < 30 ? "text-destructive animate-pulse" : "text-muted-foreground")} />
            </div>

            {/* Corner Brackets */}
            <div className="absolute -top-px -left-px w-2 h-2 border-t border-l border-primary/50" />
            <div className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-primary/50" />
        </div >
    );
}
