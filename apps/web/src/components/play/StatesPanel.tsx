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
import { useState } from "react";

interface StatesPanelProps {
  states: GameStateItem[];
  isVisible: boolean;
  onToggle: () => void;
}

export function StatesPanel({ states, isVisible, onToggle }: StatesPanelProps) {
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());

  const toggleStateExpand = (stateId: string) => {
    setExpandedStates(prev => {
      const next = new Set(prev);
      if (next.has(stateId)) {
        next.delete(stateId);
      } else {
        next.add(stateId);
      }
      return next;
    });
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-4 top-20 z-40 p-2 rounded-lg bg-white border border-border shadow-md hover:shadow-lg transition-all hover:bg-secondary/30"
        title="Show states"
      >
        <div className="flex items-center gap-1.5">
          <ListDashes className="w-4 h-4 text-muted-foreground" weight="duotone" />
          <span className="text-xs font-medium text-muted-foreground">States</span>
        </div>
      </button>
    );
  }

  // Group states by visibility
  const visibleStates = states.filter(s => s.visibility === "visible");
  const hiddenStates = states.filter(s => s.visibility === "hidden");
  const conditionalStates = states.filter(s => s.visibility === "conditional");

  return (
    <div className="fixed right-4 top-20 z-40 w-96 max-h-[80vh] bg-white rounded-xl border border-border shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border bg-secondary/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <ListDashes className="w-4 h-4 text-primary" weight="duotone" />
          <h3 className="font-semibold text-sm">States</h3>
          <span className="text-xs text-muted-foreground">({states.length})</span>
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-secondary transition-colors"
          title="Hide panel"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" weight="bold" />
        </button>
      </div>

      {/* States List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {states.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No states available
          </div>
        ) : (
          <>
            {/* Visible States */}
            {visibleStates.length > 0 && (
              <StateGroup 
                title="Visible" 
                icon={<Eye className="w-3 h-3" />}
                states={visibleStates}
                expandedStates={expandedStates}
                onToggleExpand={toggleStateExpand}
              />
            )}

            {/* Conditional States */}
            {conditionalStates.length > 0 && (
              <StateGroup 
                title="Conditional" 
                icon={<ToggleLeft className="w-3 h-3" />}
                states={conditionalStates}
                expandedStates={expandedStates}
                onToggleExpand={toggleStateExpand}
              />
            )}

            {/* Hidden States */}
            {hiddenStates.length > 0 && (
              <StateGroup 
                title="Hidden" 
                icon={<EyeSlash className="w-3 h-3" />}
                states={hiddenStates}
                expandedStates={expandedStates}
                onToggleExpand={toggleStateExpand}
              />
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-border bg-secondary/20 shrink-0">
        <p className="text-[10px] text-muted-foreground text-center">
          Storytelling Mode
        </p>
      </div>
    </div>
  );
}

interface StateGroupProps {
  title: string;
  icon: React.ReactNode;
  states: GameStateItem[];
  expandedStates: Set<string>;
  onToggleExpand: (stateId: string) => void;
}

function StateGroup({ title, icon, states, expandedStates, onToggleExpand }: StateGroupProps) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 px-1">
        {icon}
        {title}
        <span className="text-[9px]">({states.length})</span>
      </h4>
      <div className="space-y-1">
        {states.map(state => (
          <StateItem 
            key={state.id} 
            state={state} 
            isExpanded={expandedStates.has(state.id)}
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
        return <Hash className="w-3 h-3 text-blue-500" weight="duotone" />;
      case "boolean":
        return <ToggleLeft className="w-3 h-3 text-purple-500" weight="duotone" />;
      default:
        return <TextT className="w-3 h-3 text-amber-500" weight="duotone" />;
    }
  };

  const getValueDisplay = () => {
    if (state.dataType === "boolean") {
      return state.value.toLowerCase() === "true" ? "Yes" : "No";
    }
    return state.value;
  };

  const isValueLong = state.value.length > 30 || (state.description && state.description.length > 0);

  return (
    <div className={cn(
      "rounded-lg border transition-all overflow-hidden",
      isExpanded 
        ? "border-primary/30 bg-primary/5" 
        : "border-border/60 bg-secondary/20 hover:border-border hover:bg-secondary/40"
    )}>
      {/* Main Row */}
      <div 
        className="flex items-start gap-2 p-2 cursor-pointer"
        onClick={isValueLong ? onToggleExpand : undefined}
      >
        {/* Expand Icon (if expandable) */}
        {isValueLong ? (
          <div className="shrink-0 mt-0.5 text-muted-foreground">
            {isExpanded ? (
              <CaretDown className="w-3 h-3" weight="bold" />
            ) : (
              <CaretRight className="w-3 h-3" weight="bold" />
            )}
          </div>
        ) : (
          <div className="shrink-0 mt-0.5">
            {getIcon()}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name */}
          <div className="flex items-center gap-1.5">
            {!isValueLong && getIcon()}
            <span className="text-xs font-medium text-foreground">
              {state.name}
            </span>
          </div>
          
          {/* Value (truncated if not expanded) */}
          <div className={cn(
            "mt-0.5 text-xs",
            isExpanded ? "text-foreground whitespace-pre-wrap break-all" : "text-muted-foreground truncate"
          )}>
            {getValueDisplay()}
          </div>
        </div>

        {/* Type Badge */}
        <span className={cn(
          "shrink-0 text-[9px] px-1.5 py-0.5 rounded font-medium uppercase",
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
        <div className="px-2 pb-2 pt-0 border-t border-border/30">
          <div className="pl-5 pt-2 space-y-2">
            {/* Full Value */}
            <div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Value</p>
              <p className="text-xs text-foreground whitespace-pre-wrap break-all font-mono bg-secondary/50 p-2 rounded">
                {state.value}
              </p>
            </div>

            {/* Description (if exists) */}
            {state.description && (
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Description</p>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {state.description}
                </p>
              </div>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-1">
                {getIcon()}
                <span className="text-[9px] text-muted-foreground capitalize">{state.dataType}</span>
              </div>
              <div className="flex items-center gap-1">
                {state.visibility === "visible" && <Eye className="w-3 h-3 text-muted-foreground" />}
                {state.visibility === "hidden" && <EyeSlash className="w-3 h-3 text-muted-foreground" />}
                {state.visibility === "conditional" && <ToggleLeft className="w-3 h-3 text-muted-foreground" />}
                <span className="text-[9px] text-muted-foreground capitalize">{state.visibility}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
