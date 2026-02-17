import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCreditPackages, usePurchaseCredits } from "@packages/ui-logic";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Coin, X, Warning, SpinnerGap, ArrowLeft } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface CreditStoreProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreditStore({ isOpen, onClose }: CreditStoreProps) {
    const navigate = useNavigate();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { data: packagesData, isLoading } = useCreditPackages();
    const purchaseMutation = usePurchaseCredits();

    const handlePurchase = async (productId: string) => {
        setSelectedId(productId);
        setError(null);
        try {
            const response = await purchaseMutation.mutateAsync(productId);
            if (response.checkout_url) {
                window.location.href = response.checkout_url;
            } else {
                setError("No checkout URL returned. Please try again.");
                setSelectedId(null);
            }
        } catch (err: unknown) {
            console.error("Purchase failed:", err);
            
            const errorObj = err as { response?: { data?: { code?: string } }; message?: string };
            if (errorObj?.response?.data?.code === "ANONYMOUS_USER") {
                onClose();
                navigate({ to: "/auth/link", search: { redirect: "/buy-credits" } });
                return;
            }
            
            setError(err instanceof Error ? err.message : "Purchase failed. Please try again.");
            setSelectedId(null);
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
                    <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-dashed border-border/60">
                        <div>
                            <h3 className="font-serif text-lg flex items-center gap-2 font-semibold">
                                <Coin className="w-5 h-5 text-amber-500" weight="fill" />
                                Buy Credits
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Purchase credits to play games and generate content
                            </p>
                        </div>
                        <Button variant="ghost" size="icon-sm" onClick={onClose} className="shrink-0">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    <CardContent className="flex-1 overflow-y-auto py-6">
                        {error && (
                            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                                <Warning className="w-4 h-4 shrink-0" weight="fill" />
                                {error}
                            </div>
                        )}

                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-pulse text-muted-foreground text-sm">
                                    Loading packages...
                                </div>
                            </div>
                        ) : (
                            <PackagesGrid
                                packages={packagesData?.packages ?? []}
                                selectedId={selectedId}
                                isPending={purchaseMutation.isPending}
                                onPurchase={handlePurchase}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

interface CreditStorePageProps {
    onBack: () => void;
}

export function CreditStorePage({ onBack }: CreditStorePageProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { data: packagesData, isLoading } = useCreditPackages();
    const purchaseMutation = usePurchaseCredits();

    const handlePurchase = async (productId: string) => {
        setSelectedId(productId);
        setError(null);
        try {
            const response = await purchaseMutation.mutateAsync(productId);
            if (response.checkout_url) {
                window.location.href = response.checkout_url;
            } else {
                setError("No checkout URL returned. Please try again.");
                setSelectedId(null);
            }
        } catch (err) {
            console.error("Purchase failed:", err);
            setError(err instanceof Error ? err.message : "Purchase failed. Please try again.");
            setSelectedId(null);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft size={16} />
                        <span className="text-sm font-medium">Back</span>
                    </button>
                    <div className="h-4 w-px bg-border/60" />
                    <h1 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Coin className="w-4 h-4 text-amber-500" weight="fill" />
                        Buy Credits
                    </h1>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-6 py-8">
                <div className="mb-6">
                    <p className="text-sm text-muted-foreground">
                        Purchase credits to play games and generate content. Credits are added to your account instantly after purchase.
                    </p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                        <Warning className="w-4 h-4 shrink-0" weight="fill" />
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-pulse text-muted-foreground text-sm">
                            Loading packages...
                        </div>
                    </div>
                ) : (
                    <PackagesGrid
                        packages={packagesData?.packages ?? []}
                        selectedId={selectedId}
                        isPending={purchaseMutation.isPending}
                        onPurchase={handlePurchase}
                    />
                )}
            </main>
        </div>
    );
}

interface Package {
    id: string;
    name: string;
    credits: number;
    price: number;
    discount: number;
    pricePerCredit: number;
}

interface PackagesGridProps {
    packages: Package[];
    selectedId: string | null;
    isPending: boolean;
    onPurchase: (productId: string) => void;
}

function PackagesGrid({ packages, selectedId, isPending, onPurchase }: PackagesGridProps) {
    if (packages.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">
                    No credit packages available at the moment.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {packages.map((pkg) => {
                const isSelected = selectedId === pkg.id;
                const isPurchasing = isPending && isSelected;

                return (
                    <button
                        key={pkg.id}
                        className={cn(
                            "relative p-4 rounded-xl border text-left transition-all group",
                            isSelected
                                ? "border-amber-500 bg-amber-50/50 shadow-md"
                                : "border-dashed border-border/60 hover:border-amber-300 hover:bg-amber-50/30",
                            isPurchasing && "opacity-70 cursor-wait"
                        )}
                        onClick={() => onPurchase(pkg.id)}
                        disabled={isPending}
                    >
                        {pkg.discount > 0 && (
                            <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                -{pkg.discount}%
                            </div>
                        )}

                        <div className="text-center space-y-3">
                            <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                {isPurchasing ? (
                                    <SpinnerGap className="w-6 h-6 text-amber-600 animate-spin" weight="bold" />
                                ) : (
                                    <Coin className="w-6 h-6 text-amber-600" weight="fill" />
                                )}
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
                );
            })}
        </div>
    );
}
