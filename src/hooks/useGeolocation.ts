import { useState, useEffect, useCallback } from 'react';

export interface LocationData {
  latitude: number;
  longitude: number;
  region?: string;
  district?: string;
  state?: string;
  country?: string;
}

export interface GeolocationState {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    loading: false,
    error: null,
    permissionDenied: false,
  });

  const reverseGeocode = async (lat: number, lon: number): Promise<Partial<LocationData>> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'FarmerAssistant/1.0',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to reverse geocode');
      }
      
      const data = await response.json();
      const address = data.address || {};
      
      return {
        region: address.county || address.suburb || address.village || address.town,
        district: address.state_district || address.city || address.municipality,
        state: address.state,
        country: address.country,
      };
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return {};
    }
  };

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        const geoData = await reverseGeocode(latitude, longitude);
        
        setState({
          location: {
            latitude,
            longitude,
            ...geoData,
          },
          loading: false,
          error: null,
          permissionDenied: false,
        });
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        let permissionDenied = false;
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            permissionDenied = true;
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        setState({
          location: null,
          loading: false,
          error: errorMessage,
          permissionDenied,
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  }, []);

  return {
    ...state,
    requestLocation,
  };
}
