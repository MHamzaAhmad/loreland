import { createContext, useContext, type ReactNode } from "react";
import type { ApiClient } from "../api";

/**
 * Context for API client - allows platform-specific configuration
 */
const ApiClientContext = createContext<ApiClient | null>(null);

/**
 * Hook to get the API client from context
 */
export function useApiClient(): ApiClient {
    const client = useContext(ApiClientContext);
    if (!client) {
        throw new Error("useApiClient must be used within an ApiClientProvider");
    }
    return client;
}

/**
 * Provider for API client
 */
interface ApiClientProviderProps {
    client: ApiClient;
    children: ReactNode;
}

export function ApiClientProvider({ client, children }: ApiClientProviderProps) {
    return (
        <ApiClientContext.Provider value={client}>
            {children}
        </ApiClientContext.Provider>
    );
}
