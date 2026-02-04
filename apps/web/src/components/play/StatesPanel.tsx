import { cn } from "@/lib/utils";
import { 
  ListDashes, 
  Eye, 
  EyeSlash, 
  Hash, 
  TextT, 
  ToggleLeft,
  CaretDown,
  CaretRight,
  X
} from "@phosphor-icons/react";
import type { GameStateItem } from "@packages/ui-logic";
import { useState, useCallback } from "react";

interface StatesPanelProps {
  states: GameStateItem[];
  isOpen: boolean;
  onClose: () => void;
}

export function StatesPanel({ states, isOpen, onClose }: StatesPanelProps) {
  const [expandedStateId, setExpandedStateId] = useState<string | null>(null);

  const toggleStateExpand = useCallback((stateId: string) => {
    setExpandedStateId(prev => prev === stateId ? null : stateId);
  }, []);

  // Group states by visibility
  const visibleStates = states.filter(s => s.visibility === "visible");
  const hiddenStates = states.filter(s => s.visibility === "hidden");
  const conditionalStates = states.filter(s => s.visibility === "conditional");

  return (
    <>
      {/* Backdrop - Mobile only */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Panel - Mobile: Full-screen slide-out, Desktop: Fixed side panel */}
      <div
        className={cn(
          "fixed z-50 bg-background border-l border-border shadow-2xl transition-transform duration-300 ease-in-out",
          // Mobile: Full width with margin, slides from right
          "inset-y-0 right-0 w-full md:w-96 md:top-20 md:bottom-4 md:right-4 md:h-auto",
          "md:rounded-xl md:border md:shadow-xl",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30 shrink-0">
          <div className="flex items-center gap-2">
            <ListDashes className="w-5 h-5 text-primary" weight="duotone" />
            <h3 className="font-semibold text-base">States</h3>
            <span className="text-sm text-muted-foreground">({states.length})</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Close states panel"
          >
            <X className="w-5 h-5 text-muted-foreground" weight="bold" />
          </button>
        </div>

        {/* States List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {states.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ListDashes className="w-12 h-12 mx-auto mb-3 opacity-20" weight="duotone" />
              <p className="text-sm">No states available</p>
            </div>
          ) : (
            <>
              {/* Visible States */}
              {visibleStates.length > 0 && (
                <StateGroup 
                  title="Visible" 
                  icon={<Eye className="w-3.5 h-3.5" />}
                  states={visibleStates}
                  expandedStateId={expandedStateId}
                  onToggleExpand={toggleStateExpand}
                />
              )}

              {/* Conditional States */}
              {conditionalStates.length > 0 && (
                <StateGroup 
                  title="Conditional" 
                  icon={<ToggleLeft className="w-3.5 h-3.5" />}
                  states={conditionalStates}
                  expandedStateId={expandedStateId}
                  onToggleExpand={toggleStateExpand}
                />
              )}

              {/* Hidden States */}
              {hiddenStates.length > 0 && (
                <StateGroup 
                  title="Hidden" 
                  icon={<EyeSlash className="w-3.5 h-3.5" />}
                  states={hiddenStates}
                  expandedStateId={expandedStateId}
                  onToggleExpand={toggleStateExpand}
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-secondary/20 shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            Storytelling Mode
          </p>
        </div>
      </div>
    </>
  );
}

interface StateGroupProps {
  title: string;
  icon: React.ReactNode;
  states: GameStateItem[];
  expandedStateId: string | null;
  onToggleExpand: (stateId: string) => void;
}

function StateGroup({ title, icon, states, expandedStateId, onToggleExpand }: StateGroupProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 px-1">
        {icon}
        {title}
        <span className="text-[10px] font-normal">({states.length})</span>
      </h4>
      <div className="space-y-2">
        {states.map(state => (
          <StateItem 
            key={state.id} 
            state={state} 
            isExpanded={expandedStateId === state.id}
            onToggleExpand={() => onToggleExpand(state.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface StateItemProps {
  state: GameStateItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function StateItem({ state, isExpanded, onToggleExpand }: StateItemProps) {
  const getIcon = () => {
    switch (state.dataType) {
      case "number":
        return <Hash className="w-4 h-4 text-blue-500" weight="duotone" />;
      case "boolean":
        return <ToggleLeft className="w-4 h-4 text-purple-500" weight="duotone" />;
      default:
        return <TextT className="w-4 h-4 text-amber-500" weight="duotone" />;
    }
  };

  const getValueDisplay = () => {
    if (state.dataType === "boolean") {
      return state.value.toLowerCase() === "true" ? "Yes" : "No";
    }
    return state.value;
  };

  const hasDescription = state.description && state.description.length > 0;

  return (
    <div 
      className={cn(
        "rounded-xl border transition-all duration-200 overflow-hidden",
        isExpanded 
          ? "border-primary/30 bg-primary/5 shadow-sm" 
          : "border-border/60 bg-secondary/30 hover:border-border hover:bg-secondary/50"
      )}
    >
      {/* Header - Always visible */}
      <div 
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={onToggleExpand}
      >
        {/* Expand/Collapse Icon */}
        <div className="shrink-0 text-muted-foreground">
          {isExpanded ? (
            <CaretDown className="w-4 h-4" weight="bold" />
          ) : (
            <CaretRight className="w-4 h-4" weight="bold" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">
              {state.name}
            </span>
          </div>
          
          {/* Value Preview */}
          <div className={cn(
            "mt-0.5 text-sm",
            isExpanded ? "text-foreground" : "text-muted-foreground truncate"
          )}>
            {getValueDisplay()}
          </div>
        </div>

        {/* Type Badge */}
        <span className={cn(
          "shrink-0 text-[10px] px-2 py-1 rounded-full font-semibold uppercase tracking-wide",
          state.dataType === "boolean" && state.value.toLowerCase() === "true"
            ? "bg-emerald-100 text-emerald-700"
            : state.dataType === "boolean" && state.value.toLowerCase() === "false"
            ? "bg-rose-100 text-rose-700"
            : state.dataType === "number"
            ? "bg-blue-100 text-blue-700"
            : "bg-amber-100 text-amber-700"
        )}>
          {state.dataType}
        </span>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-border/40 animate-in slide-in-from-top-2 duration-200">
          <div className="pt-3 space-y-4">
            {/* Description Section - Always show label, conditionally show content */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Description
              </p>
              {hasDescription ? (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {state.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground/50 italic">No description available</p>
              )}
            </div>

            {/* Full Value Section */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Value
              </p>
              <div className="relative">
                <pre className={cn(
                  "text-xs font-mono bg-secondary/70 p-3 rounded-lg break-all whitespace-pre-wrap",
                  state.value.length > 200 && "max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20"
                )}>
                  {state.value}
                </pre>
              </div>
            </div>

            {/* Metadata Row */}
            <div className="flex items-center gap-4 pt-2 border-t border-border/30">
              <div className="flex items-center gap-1.5">
                {getIcon()}
                <span className="text-[10px] text-muted-foreground capitalize">{state.dataType}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {state.visibility === "visible" && <Eye className="w-3.5 h-3.5 text-muted-foreground" />}
                {state.visibility === "hidden" && <EyeSlash className="w-3.5 h-3.5 text-muted-foreground" />}
                {state.visibility === "conditional" && <ToggleLeft className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className="text-[10px] text-muted-foreground capitalize">{state.visibility}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
