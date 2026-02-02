import * as React from "react";
import { useState } from "react";
import { useCreditPackages, usePurchaseCredits } from "@packages/ui-logic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Coin, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface CreditStoreProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreditStore({ isOpen, onClose }: CreditStoreProps) {
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const { data: packagesData, isLoading } = useCreditPackages();
  const purchaseMutation = usePurchaseCredits();

  const handlePurchase = async (sku: string) => {
    setSelectedSku(sku);
    try {
      const response = await purchaseMutation.mutateAsync(sku);
      // Redirect to Xsolla Pay Station
      window.location.href = response.payment_url;
    } catch (error) {
      console.error("Purchase failed:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all duration-300",
      isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
    )}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <CardHeader className="border-b border-dashed border-border/60 flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                <Coin className="w-5 h-5 text-amber-500" weight="fill" />
                Buy Credits
              </CardTitle>
              <CardDescription>
                Purchase credits to play games and generate content
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto py-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-muted-foreground text-sm">
                  Loading packages...
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {packagesData?.packages.map((pkg) => (
                  <button
                    key={pkg.sku}
                    className={cn(
                      "relative p-4 rounded-xl border text-left transition-all group",
                      selectedSku === pkg.sku
                        ? "border-amber-500 bg-amber-50/50 shadow-md"
                        : "border-dashed border-border/60 hover:border-amber-300 hover:bg-amber-50/30"
                    )}
                    onClick={() => handlePurchase(pkg.sku)}
                    disabled={purchaseMutation.isPending && selectedSku === pkg.sku}
                  >
                    {pkg.discount > 0 && (
                      <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        -{pkg.discount}%
                      </div>
                    )}
                    
                    <div className="text-center space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Coin className="w-6 h-6 text-amber-600" weight="fill" />
                      </div>
                      
                      <div>
                        <div className="font-serif font-bold text-lg text-foreground">
                          {pkg.credits.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          credits
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-dashed border-border/40">
                        <div className="font-semibold text-foreground">
                          ${pkg.price.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          ${pkg.pricePerCredit.toFixed(4)}/credit
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
