import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useUserLocation, calculateDistance } from "@/hooks/useUserLocation";

export interface CommunityFilters {
  nearbyOnly: boolean;
  radiusKm: number;
}

const DEFAULT_RADIUS_KM = 50;
const FILTERS_STORAGE_KEY = "apnea-mate-community-filters";

export const useCommunityContext = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, role, isCertified, isInstructor, loading: profileLoading } = useProfile();
  const { location, loading: locationLoading, hasLocation, requestLocation } = useUserLocation();

  const [filters, setFilters] = useState<CommunityFilters>(() => {
    try {
      const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // Invalid storage
    }
    return {
      nearbyOnly: false,
      radiusKm: DEFAULT_RADIUS_KM,
    };
  });

  // Persist filters
  useEffect(() => {
    try {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
    } catch (e) {
      // Storage not available
    }
  }, [filters]);

  const toggleNearbyFilter = useCallback(() => {
    if (!hasLocation) {
      requestLocation();
    }
    setFilters(prev => ({
      ...prev,
      nearbyOnly: !prev.nearbyOnly,
    }));
  }, [hasLocation, requestLocation]);

  const setRadius = useCallback((radiusKm: number) => {
    setFilters(prev => ({
      ...prev,
      radiusKm,
    }));
  }, []);

  // Filter function for items with coordinates
  const isWithinRadius = useCallback((
    itemLat: number | null,
    itemLon: number | null
  ): boolean => {
    if (!filters.nearbyOnly) return true;
    if (!location || !itemLat || !itemLon) return true; // Show if no location data
    
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      itemLat,
      itemLon
    );
    return distance <= filters.radiusKm;
  }, [filters.nearbyOnly, filters.radiusKm, location]);

  // Calculate distance to an item
  const getDistanceKm = useCallback((
    itemLat: number | null,
    itemLon: number | null
  ): number | null => {
    if (!location || !itemLat || !itemLon) return null;
    return Math.round(calculateDistance(
      location.latitude,
      location.longitude,
      itemLat,
      itemLon
    ));
  }, [location]);

  // Check if user can join a session based on level requirements
  const canJoinSession = useCallback((sessionLevel: string): { 
    allowed: boolean; 
    requiresWarning: boolean;
    reason?: string;
  } => {
    // Everyone can join all_levels sessions
    if (sessionLevel === "all_levels" || sessionLevel === "beginner") {
      return { allowed: true, requiresWarning: false };
    }

    // Certified users can join intermediate sessions
    if (sessionLevel === "intermediate") {
      if (isCertified) {
        return { allowed: true, requiresWarning: false };
      }
      return { 
        allowed: true, 
        requiresWarning: true,
        reason: "Questa sessione è per apneisti intermedi"
      };
    }

    // Advanced sessions: instructors can join freely, others need warning
    if (sessionLevel === "advanced") {
      if (isInstructor) {
        return { allowed: true, requiresWarning: false };
      }
      if (isCertified) {
        return { 
          allowed: true, 
          requiresWarning: true,
          reason: "Questa sessione è per apneisti avanzati"
        };
      }
      return { 
        allowed: true, 
        requiresWarning: true,
        reason: "Questa sessione richiede esperienza avanzata"
      };
    }

    return { allowed: true, requiresWarning: false };
  }, [isCertified, isInstructor]);

  // Check if user can host sessions
  const canHostSession = isCertified || isInstructor;
  const canHostInstructorSession = isInstructor;

  return {
    // User context
    user,
    profile,
    role,
    isCertified,
    isInstructor,
    loading: authLoading || profileLoading,

    // Location
    location,
    locationLoading,
    hasLocation,
    requestLocation,
    getDistanceKm,

    // Filters
    filters,
    toggleNearbyFilter,
    setRadius,
    isWithinRadius,

    // Permissions
    canJoinSession,
    canHostSession,
    canHostInstructorSession,
  };
};
