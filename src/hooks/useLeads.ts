import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLeads, deleteLead } from "@/lib/leads";

/**
 * useLeads Hook
 * 
 * Centralized hook for managing leads data.
 * Uses shared query key ['leads'] for efficient caching.
 */
export function useLeads() {
    const queryClient = useQueryClient();

    // Query leads
    const query = useQuery({
        queryKey: ["leads"],
        queryFn: getLeads,
        // Note: Global staleTime from Providers.tsx (5 mins) 
        // ensures we don't refetch unnecessarily on navigation.
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: deleteLead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
        },
    });

    return {
        leads: query.data ?? [],
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        error: query.error,
        refetch: query.refetch,
        deleteLead: deleteMutation.mutate,
        isDeleting: deleteMutation.isPending,
    };
}
