"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { useState } from "react";

/**
 * Providers Wrapper Component
 * 
 * Centralizes all global context providers for the application:
 * 1. React Query: Handles remote state, caching, and background revalidation.
 * 2. AuthProvider: Handles Supabase authentication state.
 * 
 * Performance: React Query significantly improves app speed by caching API responses
 * and reducing redundant network requests.
 */
export function Providers({ children }: { children: React.ReactNode }) {
    // Create a single QueryClient instance for the duration of the component's lifecycle.
    // We use useState to ensure the client is only created once on the client side.
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Data stays fresh for 5 minutes (reduced network calls)
                        staleTime: 5 * 60 * 1000,
                        // Cache data for 10 minutes
                        gcTime: 10 * 60 * 1000,
                        // Disable refetch on window focus in development
                        refetchOnWindowFocus: process.env.NODE_ENV === 'production',
                        // Retry failed requests only once
                        retry: 1,
                        // Faster retry delay
                        retryDelay: 1000,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                {children}
            </AuthProvider>
        </QueryClientProvider>
    );
}
