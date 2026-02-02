import * as React from "react";
import { useCreditBalance } from "@packages/ui-logic";
import { Coin, Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CreditBalanceProps {
  onBuyClick: () => void;
}

export function CreditBalance({ onBuyClick }: CreditBalanceProps) {
  const { data, isLoading } = useCreditBalance();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 rounded-md border border-dashed border-border/40 bg-secondary/20">
        <Coin className="w-3.5 h-3.5 text-amber-500" weight="fill" />
        <span className="text-xs text-muted-foreground">...</span>
      </div>
    );
  }

  const balance = data?.balance ?? 0;
  const isLow = balance < (data?.minimums.toPlay ?? 10);

  return (
    <div className="flex items-center gap-1.5">
      <button 
        onClick={onBuyClick}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium transition-all hover:scale-105",
          isLow 
            ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100" 
            : "bg-secondary/40 border-dashed border-border/40 text-foreground hover:border-amber-300 hover:bg-amber-50/30"
        )}
        title={`Lifetime: ${data?.lifetimeSpent} spent, ${data?.lifetimeEarned} earned`}
      >
        <Coin 
          weight="fill"
          className={cn("w-3.5 h-3.5", isLow ? "text-rose-500" : "text-amber-500")} 
        />
        <span>{balance.toLocaleString()}</span>
      </button>
      
      <Button 
        variant="ghost" 
        size="icon-sm" 
        className="h-7 w-7 text-muted-foreground hover:text-foreground"
        onClick={onBuyClick}
      >
        <Plus className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
