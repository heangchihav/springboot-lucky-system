"use client";

import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import {
    marketingHierarchyService,
    type MarketingArea,
    type MarketingSubArea,
} from "@/services/marketing-service/marketingHierarchyService";
import {
    competitorService,
    type MarketingCompetitor,
} from "@/services/marketing-service/competitorService";
import {
    competitorAssignmentService,
    type MarketingCompetitorAssignment,
} from "@/services/marketing-service/competitorAssignmentService";
import { marketingUserAssignmentService, MarketingUserAssignment } from "@/services/marketingUserAssignmentService";
import { fetchAndCacheUserId, getStoredUserId } from "../utils/userUtils";

interface UseMarketingDataOptions {
    loadAreasOnMount?: boolean;
    loadSubAreasOnMount?: boolean;
    loadCompetitorsOnMount?: boolean;
    loadAssignmentsOnMount?: boolean;
    areaIdForSubAreas?: number;
}

interface UseMarketingDataReturn {
    // Data states
    areas: MarketingArea[];
    subAreas: MarketingSubArea[];
    competitors: MarketingCompetitor[];
    assignments: MarketingCompetitorAssignment[];
    currentUserAssignments: MarketingUserAssignment[];

    // Loading states
    loading: {
        areas: boolean;
        subAreas: boolean;
        competitors: boolean;
        assignments: boolean;
    };

    // Data loading functions
    loadAreas: () => Promise<void>;
    loadSubAreas: (areaId?: number) => Promise<void>;
    loadCompetitors: () => Promise<void>;
    loadAssignments: () => Promise<void>;
    loadAllData: () => Promise<void>;

    // Utility functions
    refetchCurrentUserAssignments: () => Promise<void>;
}

export function useMarketingData(options: UseMarketingDataOptions = {}): UseMarketingDataReturn {
    const {
        loadAreasOnMount = false,
        loadSubAreasOnMount = false,
        loadCompetitorsOnMount = false,
        loadAssignmentsOnMount = false,
        areaIdForSubAreas,
    } = options;

    const { showToast } = useToast();

    // Data states
    const [areas, setAreas] = useState<MarketingArea[]>([]);
    const [subAreas, setSubAreas] = useState<MarketingSubArea[]>([]);
    const [competitors, setCompetitors] = useState<MarketingCompetitor[]>([]);
    const [assignments, setAssignments] = useState<MarketingCompetitorAssignment[]>([]);
    const [currentUserAssignments, setCurrentUserAssignments] = useState<MarketingUserAssignment[]>([]);

    // Loading states
    const [loading, setLoading] = useState({
        areas: false,
        subAreas: false,
        competitors: false,
        assignments: false,
    });

    // Load areas and current user assignments
    const loadAreas = useCallback(async () => {
        setLoading(prev => ({ ...prev, areas: true }));
        try {
            const fetchedUserId = await fetchAndCacheUserId();
            const currentUserId = fetchedUserId ?? getStoredUserId();

            // Load all hierarchy data
            const data = await marketingHierarchyService.listAreas();
            setAreas(data);

            // Load current user assignments
            if (currentUserId) {
                try {
                    const assignments = await marketingUserAssignmentService.getUserAssignments(currentUserId);
                    const activeAssignments = assignments.filter(a => a.active);
                    setCurrentUserAssignments(activeAssignments);
                } catch (assignmentError) {
                    console.error("Error loading current user assignments:", assignmentError);
                }
            }
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Failed to load areas", "error");
        } finally {
            setLoading(prev => ({ ...prev, areas: false }));
        }
    }, [showToast]);

    // Load sub-areas
    const loadSubAreas = useCallback(async (areaId?: number) => {
        setLoading(prev => ({ ...prev, subAreas: true }));
        try {
            // If no areaId specified, load all sub-areas (for dropdowns)
            // If areaId specified, load sub-areas for that area (for form logic)
            const data = await marketingHierarchyService.listSubAreas(areaId || undefined);
            setSubAreas(data);
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Failed to load sub-areas", "error");
        } finally {
            setLoading(prev => ({ ...prev, subAreas: false }));
        }
    }, [showToast]);

    // Load competitors
    const loadCompetitors = useCallback(async () => {
        setLoading(prev => ({ ...prev, competitors: true }));
        try {
            const data = await competitorService.listCompetitors();
            setCompetitors(data);
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Failed to load competitors", "error");
        } finally {
            setLoading(prev => ({ ...prev, competitors: false }));
        }
    }, [showToast]);

    // Load assignments
    const loadAssignments = useCallback(async () => {
        setLoading(prev => ({ ...prev, assignments: true }));
        try {
            const data = await competitorAssignmentService.listAssignments();
            setAssignments(data);
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Failed to load assignments", "error");
        } finally {
            setLoading(prev => ({ ...prev, assignments: false }));
        }
    }, [showToast]);

    // Load all data at once
    const loadAllData = useCallback(async () => {
        await Promise.all([
            loadAreas(),
            loadSubAreas(areaIdForSubAreas),
            loadCompetitors(),
            loadAssignments(),
        ]);
    }, [loadAreas, loadSubAreas, loadCompetitors, loadAssignments, areaIdForSubAreas]);

    // Refetch current user assignments
    const refetchCurrentUserAssignments = useCallback(async () => {
        try {
            const fetchedUserId = await fetchAndCacheUserId();
            const currentUserId = fetchedUserId ?? getStoredUserId();

            if (currentUserId) {
                const assignments = await marketingUserAssignmentService.getUserAssignments(currentUserId);
                const activeAssignments = assignments.filter(a => a.active);
                setCurrentUserAssignments(activeAssignments);
            }
        } catch (error) {
            console.error("Error refetching current user assignments:", error);
        }
    }, []);

    // Load data on mount if specified
    useEffect(() => {
        if (loadAreasOnMount) loadAreas();
        if (loadSubAreasOnMount) loadSubAreas(areaIdForSubAreas);
        if (loadCompetitorsOnMount) loadCompetitors();
        if (loadAssignmentsOnMount) loadAssignments();
    }, [loadAreasOnMount, loadSubAreasOnMount, loadCompetitorsOnMount, loadAssignmentsOnMount, loadAreas, loadSubAreas, loadCompetitors, loadAssignments, areaIdForSubAreas]);

    return {
        // Data states
        areas,
        subAreas,
        competitors,
        assignments,
        currentUserAssignments,

        // Loading states
        loading,

        // Data loading functions
        loadAreas,
        loadSubAreas,
        loadCompetitors,
        loadAssignments,
        loadAllData,

        // Utility functions
        refetchCurrentUserAssignments,
    };
}
