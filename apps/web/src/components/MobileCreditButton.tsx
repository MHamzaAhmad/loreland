import * as React from "react";
import { useCreditBalance } from "@packages/ui-logic";
import { Coin } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface MobileCreditButtonProps {
  onClick: () => void;
}

export function MobileCreditButton({ onClick }: MobileCreditButtonProps) {
  const { data, isLoading } = useCreditBalance();
  const balance = data?.balance ?? 0;
  const isLow = balance < (data?.minimums.toPlay ?? 10);

  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg border transition-all hover:scale-105 active:scale-95",
        isLow
          ? "bg-rose-500 text-white border-rose-600 shadow-rose-500/30"
          : "bg-background/95 backdrop-blur-sm border-dashed border-border/60 text-foreground shadow-lg hover:border-amber-300"
      )}
    >
      <Coin 
        weight="fill"
        className={cn("w-4 h-4", isLow ? "text-white" : "text-amber-500")} 
      />
      <span className={cn(
        "text-sm font-semibold",
        isLow ? "text-white" : "text-foreground"
      )}>
        {isLoading ? "..." : balance.toLocaleString()}
      </span>
    </button>
  );
}
