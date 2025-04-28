import { trackApiCall } from './api-logger';

const WEATHER_API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY;
const BASE_URL = 'https://api.weatherapi.com/v1';

export interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    localtime: string;
  };
  current: {
    temp_c: number;
    temp_f: number;
    condition: {
      text: string;
      icon: string;
    };
    wind_kph: number;
    wind_dir: string;
    humidity: number;
    precip_mm: number;
    feelslike_c: number;
    feelslike_f: number;
  };
  forecast?: {
    forecastday: Array<{
      date: string;
      day: {
        maxtemp_c: number;
        mintemp_c: number;
        condition: {
          text: string;
          icon: string;
        };
      };
    }>;
  };
}

export const getCurrentWeather = async (location: string): Promise<WeatherData> => {
  return trackApiCall(
    '/current.json',
    'GET',
    async () => {
      const response = await fetch(
        `${BASE_URL}/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(location)}&aqi=no`
      );
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      return await response.json();
    }
  );
};

export const getForecast = async (location: string, days: number = 3): Promise<WeatherData> => {
  return trackApiCall(
    '/forecast.json',
    'GET',
    async () => {
      const response = await fetch(
        `${BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(location)}&days=${days}&aqi=no`
      );
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      return await response.json();
    }
  );
}; 