import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLeads, deleteLeadService } from "@/lib/leads";

/**
 * useLeads Hook
 * 
 * Centralized hook for managing leads data.
 * Uses shared query key ['leads'] for efficient caching.
 */
export function useLeads(params?: { all?: boolean }) {
    const queryClient = useQueryClient();

    // Query leads
    const query = useQuery({
        queryKey: ["leads", params?.all ? "all" : "mine"], // Diff keys for distinct caches
        queryFn: () => getLeads(params),
        // Note: Global staleTime from Providers.tsx (5 mins) 
        // ensures we don't refetch unnecessarily on navigation.
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: deleteLeadService,
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
