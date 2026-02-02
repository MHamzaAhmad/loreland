import * as React from "react";
import { useCreditBalance } from "@packages/ui-logic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coin, Warning, ArrowRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface LowCreditsPaywallProps {
  action: "play" | "generate";
  requiredCredits: number;
  onBuyCredits: () => void;
  onCancel: () => void;
}

export function LowCreditsPaywall({ 
  action, 
  requiredCredits, 
  onBuyCredits, 
  onCancel 
}: LowCreditsPaywallProps) {
  const { data } = useCreditBalance();
  const currentBalance = data?.balance ?? 0;

  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 flex items-center justify-center">
            <Warning className="w-8 h-8 text-rose-500" weight="fill" />
          </div>
          <div>
            <CardTitle className="font-serif text-xl text-rose-600">
              Insufficient Credits
            </CardTitle>
            <CardDescription className="text-base mt-2">
              You need {requiredCredits} credits to {action === "play" ? "start playing" : "generate a game"}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 border border-dashed border-border/40">
            <span className="text-sm text-muted-foreground">Current Balance</span>
            <div className="flex items-center gap-1.5 font-medium">
              <Coin className="w-4 h-4 text-amber-500" weight="fill" />
              {currentBalance.toLocaleString()} credits
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
              onClick={onBuyCredits}
            >
              Buy Credits
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
