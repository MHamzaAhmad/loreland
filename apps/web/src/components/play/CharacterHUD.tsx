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
        <div className="hud-panel flex flex-col gap-6">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-3 h-3" />
                Status
            </h3>

            {/* Health Bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-foreground">
                    <span>Health</span>
                    <span className={cn(
                        health < 30 ? "text-destructive" : "text-primary"
                    )}>{health}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                        className={cn(
                            "h-full transition-all duration-500 ease-out rounded-full",
                            health < 30 ? "bg-destructive" : "bg-primary"
                        )}
                        style={{ width: `${healthPercent}%` }}
                    />
                </div>
            </div>

            {/* Skills / Modifiers */}
            <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Modifiers</h4>
                <div className="grid grid-cols-1 gap-2">
                    {Object.entries(skillModifiers as Record<string, number>).length > 0 ? Object.entries(skillModifiers as Record<string, number>).map(([skill, mod]) => (
                        <div key={skill} className="bg-white border md:border-dashed border-border p-2 rounded-lg flex justify-between items-center shadow-sm">
                            <span className="text-xs font-medium text-foreground truncate">{skill}</span>
                            <span className={cn(
                                "text-xs font-bold bg-secondary px-1.5 py-0.5 rounded",
                                mod > 0 ? "text-green-600" : "text-destructive"
                            )}>
                                {mod > 0 ? "+" : ""}{mod}
                            </span>
                        </div>
                    )) : (
                        <div className="text-xs text-muted-foreground/50 italic py-2">
                            No active modifiers
                        </div>
                    )}
                </div>
            </div>

            {/* Status Icons (Decorative) */}
            <div className="mt-auto pt-4 border-t border-dashed border-border/50 flex gap-4 opacity-50">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <Zap className="w-4 h-4 text-muted-foreground" />
                <Skull className={cn("w-4 h-4 transition-colors", health < 30 ? "text-destructive" : "text-muted-foreground")} />
            </div>
        </div >
    );
}
