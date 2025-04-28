import axios from 'axios';
import { trackApiCall } from '../api-logger';

const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const WEATHER_API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY;

export interface WeatherData {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    temp_min: number;
    temp_max: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  visibility: number;
  sys: {
    sunrise: number;
    sunset: number;
  };
}

export interface ForecastData {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      temp_min: number;
      temp_max: number;
    };
    weather: Array<{
      main: string;
      description: string;
    }>;
  }>;
}

export interface AirQualityData {
  list: Array<{
    main: {
      aqi: number; // Air Quality Index 1-5 (1: Good, 2: Fair, 3: Moderate, 4: Poor, 5: Very Poor)
    };
    components: {
      co: number;    // Carbon monoxide (μg/m3)
      no: number;    // Nitrogen monoxide (μg/m3)
      no2: number;   // Nitrogen dioxide (μg/m3)
      o3: number;    // Ozone (μg/m3)
      so2: number;   // Sulphur dioxide (μg/m3)
      pm2_5: number; // Fine particles (μg/m3)
      pm10: number;  // Coarse particles (μg/m3)
      nh3: number;   // Ammonia (μg/m3)
    };
  }>;
}

export const getWeatherByCity = async (city: string): Promise<WeatherData> => {
  return trackApiCall(
    '/weather?q=' + city,
    'GET',
    async () => {
      if (!WEATHER_API_KEY) {
        throw new Error('Weather API key is not configured');
      }

      const response = await axios.get(`${BASE_URL}/weather`, {
        params: {
          q: city,
          appid: WEATHER_API_KEY,
          units: 'metric'
        }
      });
      return response.data;
    }
  );
};

export const getWeatherByCoordinates = async (lat: number, lon: number): Promise<WeatherData> => {
  return trackApiCall(
    `/weather?lat=${lat}&lon=${lon}`,
    'GET',
    async () => {
      if (!WEATHER_API_KEY) {
        throw new Error('Weather API key is not configured');
      }

      const response = await axios.get(`${BASE_URL}/weather`, {
        params: {
          lat,
          lon,
          appid: WEATHER_API_KEY,
          units: 'metric'
        }
      });
      return response.data;
    }
  );
};

export const getForecastByCity = async (city: string): Promise<ForecastData> => {
  return trackApiCall(
    '/forecast?q=' + city,
    'GET',
    async () => {
      if (!WEATHER_API_KEY) {
        throw new Error('Weather API key is not configured');
      }

      const response = await axios.get(`${BASE_URL}/forecast`, {
        params: {
          q: city,
          appid: WEATHER_API_KEY,
          units: 'metric'
        }
      });
      return response.data;
    }
  );
};

export const getForecastByCoordinates = async (lat: number, lon: number): Promise<ForecastData> => {
  return trackApiCall(
    `/forecast?lat=${lat}&lon=${lon}`,
    'GET',
    async () => {
      if (!WEATHER_API_KEY) {
        throw new Error('Weather API key is not configured');
      }

      const response = await axios.get(`${BASE_URL}/forecast`, {
        params: {
          lat,
          lon,
          appid: WEATHER_API_KEY,
          units: 'metric'
        }
      });
      return response.data;
    }
  );
};

export const getAirQuality = async (lat: number, lon: number): Promise<AirQualityData> => {
  return trackApiCall(
    `/air_pollution?lat=${lat}&lon=${lon}`,
    'GET',
    async () => {
      if (!WEATHER_API_KEY) {
        throw new Error('Weather API key is not configured');
      }

      const response = await axios.get(`${BASE_URL}/air_pollution`, {
        params: {
          lat,
          lon,
          appid: WEATHER_API_KEY
        }
      });
      return response.data;
    }
  );
}; 