import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";

export const creditKeys = {
    all: ["credits"] as const,
    balance: () => [...creditKeys.all, "balance"] as const,
    packages: (locale?: string) => [...creditKeys.all, "packages", locale] as const,
    transactions: () => [...creditKeys.all, "transactions"] as const,
    config: () => [...creditKeys.all, "config"] as const,
};

export function useCreditBalance() {
    const api = useApiClient();
    return useQuery({
        queryKey: creditKeys.balance(),
        queryFn: () => api.credits.getBalance(),
        staleTime: 1000 * 60, // 1 minute
    });
}

export function useCreditPackages(locale?: string) {
    const api = useApiClient();
    return useQuery({
        queryKey: creditKeys.packages(locale),
        queryFn: () => api.credits.getPackages(locale),
        staleTime: 1000 * 60 * 5, // 5 minutes (cached in KV)
    });
}

export function usePurchaseCredits() {
    const api = useApiClient();
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (sku: string) => api.credits.purchase(sku),
        onSuccess: () => {
            // Invalidate balance after purchase
            queryClient.invalidateQueries({ queryKey: creditKeys.balance() });
            queryClient.invalidateQueries({ queryKey: creditKeys.transactions() });
        },
    });
}

export function useCreditTransactions(limit?: number) {
    const api = useApiClient();
    return useQuery({
        queryKey: creditKeys.transactions(),
        queryFn: () => api.credits.getTransactions(limit),
    });
}

export function useBillingConfig() {
    const api = useApiClient();
    return useQuery({
        queryKey: creditKeys.config(),
        queryFn: () => api.credits.getConfig(),
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
