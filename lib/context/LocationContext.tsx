import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface LocationContextType {
  location: {
    lat: number;
    lon: number;
    name: string;
    country: string;
  } | null;
  setLocation: (location: { lat: number; lon: number; name: string; country: string } | null) => void;
  loading: boolean;
  error: string | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<{
    lat: number;
    lon: number;
    name: string;
    country: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission is required');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Get location name using reverse geocoding
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${process.env.EXPO_PUBLIC_WEATHER_API_KEY}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { name, country } = data[0];
        setLocation({
          lat: latitude,
          lon: longitude,
          name,
          country,
        });
      }
    } catch (error) {
      setError('Failed to get location');
      console.error('Error getting location:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocationContext.Provider value={{ location, setLocation, loading, error }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
} 