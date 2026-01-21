import { useState, useEffect, useCallback } from "react";

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface LocationState {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
}

const LOCATION_STORAGE_KEY = "apnea-mate-user-location";
const LOCATION_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

export const useUserLocation = () => {
  const [state, setState] = useState<LocationState>({
    location: null,
    loading: true,
    error: null,
    permissionDenied: false,
  });

  const loadCachedLocation = useCallback(() => {
    try {
      const cached = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (cached) {
        const { location, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < LOCATION_EXPIRY_MS) {
          return location as UserLocation;
        }
      }
    } catch (e) {
      // Invalid cache, ignore
    }
    return null;
  }, []);

  const cacheLocation = useCallback((location: UserLocation) => {
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify({
        location,
        timestamp: Date.now(),
      }));
    } catch (e) {
      // Storage not available, ignore
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: "Geolocation not supported",
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        cacheLocation(location);
        setState({
          location,
          loading: false,
          error: null,
          permissionDenied: false,
        });
      },
      (error) => {
        const permissionDenied = error.code === error.PERMISSION_DENIED;
        setState({
          location: null,
          loading: false,
          error: error.message,
          permissionDenied,
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, [cacheLocation]);

  useEffect(() => {
    // Try to load cached location first
    const cached = loadCachedLocation();
    if (cached) {
      setState({
        location: cached,
        loading: false,
        error: null,
        permissionDenied: false,
      });
      // Still request fresh location in background
      navigator.geolocation?.getCurrentPosition(
        (position) => {
          const location: UserLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          cacheLocation(location);
          setState(prev => ({ ...prev, location }));
        },
        () => {
          // Ignore errors when refreshing cached location
        }
      );
    } else {
      requestLocation();
    }
  }, [loadCachedLocation, requestLocation, cacheLocation]);

  return {
    ...state,
    requestLocation,
    hasLocation: !!state.location,
  };
};

// Calculate distance between two points in km using Haversine formula
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
