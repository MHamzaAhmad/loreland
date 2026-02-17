import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";
import { useUser } from "./use-auth";

export const creditKeys = {
    all: ["credits"] as const,
    balance: () => [...creditKeys.all, "balance"] as const,
    packages: (locale?: string) => [...creditKeys.all, "packages", locale] as const,
    transactions: () => [...creditKeys.all, "transactions"] as const,
    config: () => [...creditKeys.all, "config"] as const,
};

export function useCreditBalance() {
    const { data: authData } = useUser();
    const api = useApiClient();
    return useQuery({
        queryKey: creditKeys.balance(),
        queryFn: () => api.credits.getBalance(),
        staleTime: 1000 * 60,
        enabled: authData?.authenticated === true,
    });
}

export function useCreditPackages(locale?: string) {
    const { data: authData } = useUser();
    const api = useApiClient();
    return useQuery({
        queryKey: creditKeys.packages(locale),
        queryFn: () => api.credits.getPackages(locale),
        staleTime: 1000 * 60 * 5,
        enabled: authData?.authenticated === true,
    });
}

export function usePurchaseCredits() {
    const api = useApiClient();
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (productId: string) => api.credits.purchase(productId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: creditKeys.balance() });
            queryClient.invalidateQueries({ queryKey: creditKeys.transactions() });
        },
    });
}

export function useCreditTransactions(limit?: number) {
    const { data: authData } = useUser();
    const api = useApiClient();
    return useQuery({
        queryKey: creditKeys.transactions(),
        queryFn: () => api.credits.getTransactions(limit),
        enabled: authData?.authenticated === true,
    });
}

export function useBillingConfig() {
    const { data: authData } = useUser();
    const api = useApiClient();
    return useQuery({
        queryKey: creditKeys.config(),
        queryFn: () => api.credits.getConfig(),
        staleTime: 1000 * 60 * 60,
        enabled: authData?.authenticated === true,
    });
}
