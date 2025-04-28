import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Cloud, Droplets, Wind, Sun, Eye, Gauge, CloudRain, Moon, Sunrise, Sunset, CloudLightning, CloudSnow, CloudFog } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { getWeatherByCoordinates, getForecastByCoordinates, getAirQuality } from '@/lib/services/weather';
import * as Location from 'expo-location';
import Svg, { Path, Circle, G } from 'react-native-svg';
import axios from 'axios';
import { WeatherCard } from '@/components/Weather/WeatherCard';
import { ForecastCard } from '@/components/Weather/ForecastCard';
import { WeatherData, ForecastData, AirQualityData } from '@/lib/types/weather';
import Animated from 'react-native-reanimated';

interface ForecastItem {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  pop: number;
  rain?: {
    '3h': number;
  };
}

interface WeatherAlert {
  event: string;
  description: string;
  start: number;
  end: number;
}

interface HourlyForecast {
  hour: number;
  temp: number;
  feelsLike: number;
  weather: string;
  description: string;
  isNow: boolean;
  precipitation: {
    probability: number;
    amount: number;
  };
  wind: {
    speed: number;
    direction: number;
    gust?: number;
  };
  tempTrend: 'rising' | 'falling' | 'stable';
}

export default function Today() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastData, setForecastData] = useState<{ list: ForecastItem[] } | null>(null);
  const [airQualityData, setAirQualityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExtendedForecast, setShowExtendedForecast] = useState(false);
  const [temperatureUnit, setTemperatureUnit] = useState<'C' | 'F'>('C');
  const [locationName, setLocationName] = useState<string>('Loading location...');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[]>([]);

  const getLocationName = async (latitude: number, longitude: number) => {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${process.env.EXPO_PUBLIC_WEATHER_API_KEY}`
      );
      if (response.data && response.data.length > 0) {
        const { name, country } = response.data[0];
        setLocationName(`${name}, ${country}`);
      }
    } catch (error) {
      console.error('Error fetching location name:', error);
    }
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);

      if (location) {
        try {
          const { latitude, longitude } = location.coords;
          await getLocationName(latitude, longitude);
          const weather = await getWeatherByCoordinates(latitude, longitude);
          const forecast = await getForecastByCoordinates(latitude, longitude);
          const airQuality = await getAirQuality(latitude, longitude);
          setWeatherData(weather as WeatherData);
          setForecastData(forecast as { list: ForecastItem[] });
          setAirQualityData(airQuality);
        } catch (error) {
          console.error('Error fetching weather data:', error);
          setError('Failed to fetch weather data');
        } finally {
          setLoading(false);
        }
      }
    })();
  }, []);

  useEffect(() => {
    const fetchWeatherAlerts = async () => {
      if (location) {
        try {
          // First check if we have access to the OneCall API
          const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${location.coords.latitude}&lon=${location.coords.longitude}&appid=${process.env.EXPO_PUBLIC_WEATHER_API_KEY}`
          );

          // If basic weather call succeeds, check for severe weather
          if (response.status === 200) {
            const alerts = [];
            
            // Check for extreme temperatures
            const temp = response.data.main.temp - 273.15; // Convert to Celsius
            if (temp > 35) {
              alerts.push({
                event: 'Extreme Heat Warning',
                description: 'High temperature conditions. Stay hydrated and avoid prolonged sun exposure.',
                start: Date.now() / 1000,
                end: (Date.now() / 1000) + 86400 // 24 hours
              });
            } else if (temp < 0) {
              alerts.push({
                event: 'Freezing Temperature Alert',
                description: 'Below freezing temperatures expected. Take precautions against frost and ice.',
                start: Date.now() / 1000,
                end: (Date.now() / 1000) + 86400
              });
            }

            // Check for severe weather conditions
            const weatherCondition = response.data.weather[0].main.toLowerCase();
            if (weatherCondition.includes('thunderstorm')) {
              alerts.push({
                event: 'Thunderstorm Warning',
                description: 'Thunderstorms in the area. Seek indoor shelter and avoid open areas.',
                start: Date.now() / 1000,
                end: (Date.now() / 1000) + 7200 // 2 hours
              });
            } else if (weatherCondition.includes('rain') && response.data.rain && response.data.rain['1h'] > 10) {
              alerts.push({
                event: 'Heavy Rain Alert',
                description: 'Heavy rainfall may cause flooding in low-lying areas.',
                start: Date.now() / 1000,
                end: (Date.now() / 1000) + 7200
              });
            }

            setWeatherAlerts(alerts);
          }
        } catch (error) {
          console.log('Weather alerts not available for your API subscription level');
          setWeatherAlerts([]); // Clear any existing alerts
        }
      }
    };

    fetchWeatherAlerts();
  }, [location]);

  const getWeatherIcon = (description: string) => {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('cloud')) return Cloud;
    if (lowerDesc.includes('rain')) return CloudRain;
    return Sun;
  };

  const WeatherIcon = weatherData?.weather[0] 
    ? getWeatherIcon(weatherData.weather[0].description)
    : Sun;

  const toggleTemperatureUnit = () => {
    setTemperatureUnit(prev => prev === 'C' ? 'F' : 'C');
  };

  const convertTemperature = (celsius: number): number => {
    if (temperatureUnit === 'F') {
      return Math.round((celsius * 9/5) + 32);
    }
    return Math.round(celsius);
  };

  const calculateDewPoint = (temp: number, humidity: number): number => {
    // Magnus formula for dew point calculation
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * temp) / (b + temp)) + Math.log(humidity/100);
    const dewPoint = (b * alpha) / (a - alpha);
    return convertTemperature(dewPoint);
  };

  const formatVisibility = (meters: number): string => {
    if (temperatureUnit === 'F') {
      // Convert to miles
      const miles = meters / 1609.34;
      return `${miles.toFixed(1)} mi`;
    }
    // Show in kilometers
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const getDailyForecast = () => {
    if (!forecastData) return [];

    const dailyData = new Map();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    forecastData.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dayName = days[date.getDay()];
      
      if (!dailyData.has(dayName)) {
        dailyData.set(dayName, {
          day: dayName,
          temp: convertTemperature(item.main.temp_max),
          lowTemp: convertTemperature(item.main.temp_min),
          weather: item.weather[0].main,
          description: item.weather[0].description
        });
      }
    });

    const forecast = Array.from(dailyData.values());
    if (forecast.length > 0) {
      forecast[0].day = 'Today';
    }
    return forecast.slice(0, showExtendedForecast ? undefined : 4);
  };

  const weeklyForecast = getDailyForecast();

  const getAirQualityDescription = (aqi: number): { text: string; color: string; recommendations: string[] } => {
    switch (aqi) {
      case 1:
        return { 
          text: 'Good air quality - Perfect for outdoor activities!',
          color: '#4CAF50', // Green
          recommendations: [
            'Ideal for outdoor activities',
            'Great time for exercise',
            'Safe for sensitive groups'
          ]
        };
      case 2:
        return { 
          text: 'Fair air quality - Generally good for outdoor activities',
          color: '#8BC34A', // Light Green
          recommendations: [
            'Good for most outdoor activities',
            'Consider reducing prolonged outdoor exercise for sensitive groups',
            'Keep monitoring if you have respiratory issues'
          ]
        };
      case 3:
        return { 
          text: 'Moderate air quality - Sensitive individuals should be cautious',
          color: '#FFC107', // Amber
          recommendations: [
            'Sensitive groups should limit prolonged outdoor exposure',
            'Consider indoor activities if you experience symptoms',
            'Keep windows closed during peak hours'
          ]
        };
      case 4:
        return { 
          text: 'Poor air quality - Reduce outdoor activities',
          color: '#FF9800', // Orange
          recommendations: [
            'Avoid prolonged outdoor activities',
            'Wear a mask if outdoor activity is necessary',
            'Keep indoor air clean with air purifiers'
          ]
        };
      case 5:
        return { 
          text: 'Very Poor air quality - Avoid outdoor activities',
          color: '#F44336', // Red
          recommendations: [
            'Stay indoors as much as possible',
            'Keep all windows closed',
            'Use air purifiers if available',
            'Wear N95 masks if going outside is necessary'
          ]
        };
      default:
        return { 
          text: 'Air quality data unavailable',
          color: '#9E9E9E', // Grey
          recommendations: []
        };
    }
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateDayProgress = (sunrise: number, sunset: number): number => {
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const dayLength = sunset - sunrise;
    const progress = ((now - sunrise) / dayLength) * 100;
    return Math.min(Math.max(progress, 0), 100); // Clamp between 0 and 100
  };

  const calculateMoonPhase = (date: Date): number => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const c = Math.floor(365.25 * year);
    const e = Math.floor(30.6 * month);
    const jd = c + e + day - 694039.09;
    const phase = (jd % 29.53) / 29.53;
    return phase;
  };

  const getMoonPhaseInfo = (date: Date): { phase: string; emoji: string } => {
    const phase = calculateMoonPhase(date);
    if (phase < 0.03 || phase > 0.97) return { phase: 'New Moon', emoji: '🌑' };
    if (phase < 0.22) return { phase: 'Waxing Crescent', emoji: '🌒' };
    if (phase < 0.28) return { phase: 'First Quarter', emoji: '🌓' };
    if (phase < 0.47) return { phase: 'Waxing Gibbous', emoji: '🌔' };
    if (phase < 0.53) return { phase: 'Full Moon', emoji: '🌕' };
    if (phase < 0.72) return { phase: 'Waning Gibbous', emoji: '🌖' };
    if (phase < 0.78) return { phase: 'Last Quarter', emoji: '🌗' };
    return { phase: 'Waning Crescent', emoji: '🌘' };
  };

  const getMoonPhaseDescription = (phase: string): string => {
    switch (phase) {
      case 'New Moon':
        return 'Moon is not visible from Earth';
      case 'Waxing Crescent':
        return 'Moon is becoming more illuminated';
      case 'First Quarter':
        return 'Half of the Moon is illuminated';
      case 'Waxing Gibbous':
        return 'Moon is approaching fullness';
      case 'Full Moon':
        return 'Moon is fully illuminated';
      case 'Waning Gibbous':
        return 'Moon is starting to decrease';
      case 'Last Quarter':
        return 'Half of the Moon is illuminated';
      case 'Waning Crescent':
        return 'Moon is becoming less illuminated';
      default:
        return '';
    }
  };

  const getWeatherGradient = (weatherMain: string): [string, string] => {
    switch (weatherMain) {
      case 'Clear':
        return ['#4a90e2', '#87ceeb'];
      case 'Clouds':
        return ['#54717a', '#cbd5e0'];
      case 'Rain':
        return ['#465760', '#6b7c85'];
      case 'Thunderstorm':
        return ['#2c3e50', '#34495e'];
      case 'Snow':
        return ['#e8f4f8', '#c8e6f0'];
      case 'Mist':
        return ['#8c9ea3', '#b8c6cc'];
      default:
        return ['#4a90e2', '#87ceeb'];
    }
  };

  const getWeatherDescription = (weatherMain: string) => {
    switch (weatherMain) {
      case 'Clear':
        return 'Clear blue skies with excellent visibility. Perfect weather for outdoor activities.';
      case 'Clouds':
        return 'Cloud cover present, creating a gentle diffused light across the area.';
      case 'Rain':
        return 'Rainfall occurring with varying intensity. Remember to carry an umbrella.';
      case 'Thunderstorm':
        return 'Storm activity with lightning and thunder. Stay indoors if possible.';
      case 'Snow':
        return 'Snowfall creating a serene winter landscape. Bundle up warmly.';
      case 'Mist':
        return 'Misty conditions reducing visibility. Drive carefully.';
      default:
        return 'Current weather conditions affecting your area.';
    }
  };

  const WeatherEffect = ({ type, style }: { type: string; style?: any }) => {
    const [particles, setParticles] = useState<Array<{ id: number; left: number; top: number; delay: number }>>([]);

    useEffect(() => {
      const generateParticles = () => {
        const newParticles = Array.from({ length: 20 }, (_, i) => ({
          id: i,
          left: Math.random() * 100,
          top: Math.random() * 100,
          delay: Math.random() * 2
        }));
        setParticles(newParticles);
      };

      generateParticles();
    }, []);

    const renderParticles = () => {
      switch (type.toLowerCase()) {
        case 'clouds':
        case 'broken clouds':
        case 'scattered clouds':
          return particles.map(particle => (
            <Animated.View
              key={particle.id}
              style={[
                styles.cloudParticle,
                {
                  left: `${particle.left}%`,
                  top: `${particle.top}%`,
                  opacity: 0.3 + Math.random() * 0.4,
                  transform: [{ scale: 0.5 + Math.random() * 0.5 }]
                }
              ]}
            />
          ));
        default:
          return null;
      }
    };

    return (
      <View style={[styles.weatherEffectContainer, style]}>
        {renderParticles()}
      </View>
    );
  };

  const TimeInfo = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

      return () => clearInterval(timer);
    }, []);

    return (
      <View style={styles.timeContainer}>
        <Text style={styles.currentTime}>
          {currentTime.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })}
        </Text>
        <Text style={styles.currentDate}>
          {currentTime.toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </View>
    );
  };

  const getWeatherVariation = (main: string, description: string) => {
    const desc = description.toLowerCase();
    if (!main) return 'Clear';
    
    switch (main) {
      case 'Clear':
        return desc.includes('windy') ? 'ClearWindy' : 'Clear';
      case 'Clouds':
        if (desc.includes('broken')) return 'BrokenClouds';
        if (desc.includes('scattered')) return 'ScatteredClouds';
        if (desc.includes('few')) return 'FewClouds';
        return 'Clouds';
      case 'Rain':
        if (desc.includes('light')) return 'LightRain';
        if (desc.includes('heavy')) return 'HeavyRain';
        if (desc.includes('moderate')) return 'ModerateRain';
        return 'Rain';
      case 'Drizzle':
        return 'LightRain';
      case 'Thunderstorm':
        return 'Thunderstorm';
      case 'Snow':
        return 'Snow';
      case 'Mist':
      case 'Fog':
      case 'Haze':
        return 'Mist';
      default:
        return main;
    }
  };

  const CustomWeatherIcon = ({ type, description = '', size = 140 }: { type: string; description?: string; size?: number }) => {
    const weatherType = getWeatherVariation(type, description);
    const scale = size / 140;

    const renderCloud = (props: any) => (
      <Path
        d="M35 75 
           C35 65 45 55 60 55 
           C65 40 90 40 100 55
           C115 55 125 65 125 75 
           C125 85 115 95 100 95 
           L45 95 
           C40 95 35 85 35 75Z"
        {...props}
      />
    );

    switch (weatherType) {
      case 'Clear':
        return (
          <View style={styles.customIconContainer}>
            <Svg width={size} height={size} viewBox="0 0 140 140">
              <Circle cx="70" cy="70" r="35" fill="#FFB800" />
              {[...Array(8)].map((_, i) => (
                <G key={i} rotate={`${i * 45} ${70} ${70}`}>
                  <Path
                    d={`M70 25 L70 15`}
                    stroke="#FFB800"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                </G>
              ))}
            </Svg>
          </View>
        );

      case 'ClearWindy':
        return (
          <View style={styles.customIconContainer}>
            <Svg width={size} height={size} viewBox="0 0 140 140">
              <Circle cx="70" cy="70" r="35" fill="#FFB800" />
              {/* Wind curves */}
              {[...Array(3)].map((_, i) => (
                <Path
                  key={i}
                  d={`M20 ${65 + i * 15} C40 ${65 + i * 15} 60 ${70 + i * 15} 120 ${65 + i * 15}`}
                  stroke="#87CEEB"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
              ))}
            </Svg>
          </View>
        );

      case 'FewClouds':
      case 'ScatteredClouds':
        return (
          <View style={styles.customIconContainer}>
            <Svg width={size} height={size} viewBox="0 0 140 140">
              {/* Larger sun */}
              <Circle cx="85" cy="55" r="25" fill="#FFB800" />
              {/* Small cloud */}
              <Path
                d="M35 75 
                   C35 65 45 55 60 55 
                   C65 40 90 40 100 55
                   C115 55 125 65 125 75 
                   C125 85 115 95 100 95 
                   L45 95 
                   C40 95 35 85 35 75Z"
                fill="#87CEEB"
                stroke="#6CB4D1"
                strokeWidth="2.5"
                opacity={weatherType === 'FewClouds' ? "0.8" : "1"}
              />
            </Svg>
          </View>
        );

      case 'BrokenClouds':
        return (
          <View style={styles.customIconContainer}>
            <Svg width={size} height={size} viewBox="0 0 140 140">
              {/* Background cloud */}
              <Path
                d="M45 85 
                   C45 75 55 65 70 65 
                   C75 50 100 50 110 65
                   C125 65 135 75 135 85 
                   C135 95 125 105 110 105 
                   L55 105 
                   C50 105 45 95 45 85Z"
                fill="#B8C6CC"
                stroke="#A8B6BC"
                strokeWidth="2.5"
                opacity="0.6"
              />
              {/* Foreground cloud */}
              <Path
                d="M25 65 
                   C25 55 35 45 50 45 
                   C55 30 80 30 90 45
                   C105 45 115 55 115 65 
                   C115 75 105 85 90 85 
                   L35 85 
                   C30 85 25 75 25 65Z"
                fill="#87CEEB"
                stroke="#6CB4D1"
                strokeWidth="2.5"
              />
            </Svg>
          </View>
        );

      case 'LightRain':
        return (
          <View style={styles.customIconContainer}>
            <Svg width={size} height={size} viewBox="0 0 140 140">
              {/* Sun peeking through */}
              <Circle cx="85" cy="45" r="20" fill="#FFB800" />
              {/* Cloud */}
              <Path
                d="M35 65 
                   C35 55 45 45 60 45 
                   C65 30 90 30 100 45
                   C115 45 125 55 125 65 
                   C125 75 115 85 100 85 
                   L45 85 
                   C40 85 35 75 35 65Z"
                fill="#87CEEB"
                stroke="#6CB4D1"
                strokeWidth="2.5"
              />
              {/* Light raindrops */}
              {[...Array(4)].map((_, i) => (
                <G key={i}>
                  <Path
                    d={`M${45 + i * 20} ${95} L${45 + i * 20} ${100}`}
                    stroke="#87CEEB"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.7"
                  />
                </G>
              ))}
            </Svg>
          </View>
        );

      case 'ModerateRain':
        return (
          <View style={styles.customIconContainer}>
            <Svg width={size} height={size} viewBox="0 0 140 140">
              {/* Partial sun */}
              <Circle cx="85" cy="45" r="20" fill="#FFB800" opacity="0.7" />
              {/* Cloud */}
              <Path
                d="M35 65 
                   C35 55 45 45 60 45 
                   C65 30 90 30 100 45
                   C115 45 125 55 125 65 
                   C125 75 115 85 100 85 
                   L45 85 
                   C40 85 35 75 35 65Z"
                fill="#6CB4D1"
                stroke="#5A99B7"
                strokeWidth="2.5"
              />
              {/* Moderate raindrops */}
              {[...Array(6)].map((_, i) => (
                <G key={i}>
                  <Path
                    d={`M${40 + i * 15} ${95} L${40 + i * 15} ${105}`}
                    stroke="#87CEEB"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </G>
              ))}
            </Svg>
          </View>
        );

      case 'HeavyRain':
        return (
          <View style={styles.customIconContainer}>
            <Svg width={size} height={size} viewBox="0 0 140 140">
              {/* Darker cloud */}
              <Path
                d="M35 65 
                   C35 55 45 45 60 45 
                   C65 30 90 30 100 45
                   C115 45 125 55 125 65 
                   C125 75 115 85 100 85 
                   L45 85 
                   C40 85 35 75 35 65Z"
                fill="#5A99B7"
                stroke="#4A89A7"
                strokeWidth="2.5"
              />
              {/* Heavy raindrops */}
              {[...Array(8)].map((_, i) => (
                <G key={i}>
                  <Path
                    d={`M${35 + i * 12} ${95} L${35 + i * 12} ${110}`}
                    stroke="#87CEEB"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <Path
                    d={`M${35 + i * 12} ${85} L${35 + i * 12} ${90}`}
                    stroke="#87CEEB"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.6"
                  />
                </G>
              ))}
            </Svg>
          </View>
        );

      case 'Clouds':
      case 'FewClouds':
      case 'ScatteredClouds':
      case 'BrokenClouds':
      case 'Mist':
      case 'Fog':
      case 'Haze':
        return (
          <View style={styles.customIconContainer}>
            <Svg width={size} height={size} viewBox="0 0 140 140">
              {/* Sun behind cloud for partial clouds */}
              {(weatherType === 'FewClouds' || weatherType === 'ScatteredClouds') && (
                <Circle cx="85" cy="55" r="25" fill="#FFB800" />
              )}
              {/* Background cloud for broken clouds */}
              {weatherType === 'BrokenClouds' && (
                <Path
                  d="M45 85 
                     C45 75 55 65 70 65 
                     C75 50 100 50 110 65
                     C125 65 135 75 135 85 
                     C135 95 125 105 110 105 
                     L55 105 
                     C50 105 45 95 45 85Z"
                  fill="#B8C6CC"
                  stroke="#A8B6BC"
                  strokeWidth="2.5"
                  opacity="0.6"
                />
              )}
              {/* Main cloud */}
              {renderCloud({
                fill: weatherType === 'Mist' || weatherType === 'Fog' || weatherType === 'Haze' 
                  ? '#B8C6CC' : '#87CEEB',
                stroke: weatherType === 'Mist' || weatherType === 'Fog' || weatherType === 'Haze'
                  ? '#A8B6BC' : '#6CB4D1',
                strokeWidth: 2.5,
                opacity: weatherType === 'FewClouds' ? 0.8 : 1
              })}
              {/* Cloud highlight */}
              <Path
                d="M60 60 C70 50 85 50 95 60"
                stroke="#FFFFFF"
                strokeWidth="4"
                strokeLinecap="round"
                fillOpacity="0"
              />
            </Svg>
          </View>
        );

      case 'Rain':
      case 'LightRain':
      case 'ModerateRain':
      case 'HeavyRain':
      case 'Drizzle':
        const isLight = weatherType === 'LightRain' || weatherType === 'Drizzle';
        const isHeavy = weatherType === 'HeavyRain';
        return (
          <View style={styles.customIconContainer}>
            <Svg width={size} height={size} viewBox="0 0 140 140">
              {/* Sun for light rain */}
              {isLight && (
                <Circle cx="85" cy="45" r="20" fill="#FFB800" opacity={0.8} />
              )}
              {/* Cloud */}
              {renderCloud({
                fill: isHeavy ? '#5A99B7' : '#6CB4D1',
                stroke: isHeavy ? '#4A89A7' : '#5A99B7',
                strokeWidth: 2.5
              })}
              {/* Raindrops */}
              {[...Array(isLight ? 4 : isHeavy ? 8 : 6)].map((_, i) => (
                <G key={i}>
                  <Path
                    d={`M${45 + i * (isLight ? 20 : isHeavy ? 12 : 15)} ${95} 
                       L${45 + i * (isLight ? 20 : isHeavy ? 12 : 15)} ${isLight ? 100 : 105}`}
                    stroke="#87CEEB"
                    strokeWidth={isLight ? 2 : 3}
                    strokeLinecap="round"
                    opacity={0.8}
                  />
                  {isHeavy && (
                    <Path
                      d={`M${45 + i * 12} ${85} L${45 + i * 12} ${90}`}
                      stroke="#87CEEB"
                      strokeWidth={3}
                      strokeLinecap="round"
                      opacity={0.6}
                    />
                  )}
                </G>
              ))}
            </Svg>
          </View>
        );

      case 'Thunderstorm':
        return (
          <View style={styles.customIconContainer}>
            <Svg width={size} height={size} viewBox="0 0 140 140">
              {/* Dark cloud */}
              {renderCloud({
                fill: '#4A6670',
                stroke: '#3A5660',
                strokeWidth: 2.5
              })}
              {/* Lightning */}
              <Path
                d="M70 85 L85 95 L75 105 L90 115"
                stroke="#FFB800"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Rain drops */}
              {[...Array(3)].map((_, i) => (
                <G key={i}>
                  <Path
                    d={`M${50 + i * 25} ${95} L${50 + i * 25} ${105}`}
                    stroke="#87CEEB"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </G>
              ))}
            </Svg>
          </View>
        );

      case 'Snow':
        return (
          <View style={styles.customIconContainer}>
            <Svg width={size} height={size} viewBox="0 0 140 140">
              {/* Snow cloud */}
              {renderCloud({
                fill: '#B8C6CC',
                stroke: '#A8B6BC',
                strokeWidth: 2.5
              })}
              {/* Snowflakes */}
              {[...Array(5)].map((_, i) => (
                <G key={i}>
                  <Circle
                    cx={50 + i * 18}
                    cy={100}
                    r="3"
                    fill="#FFFFFF"
                  />
                  {[...Array(6)].map((_, j) => (
                    <Path
                      key={j}
                      d={`M${50 + i * 18} ${100} l${Math.cos(j * Math.PI / 3) * 6} ${Math.sin(j * Math.PI / 3) * 6}`}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  ))}
                </G>
              ))}
            </Svg>
          </View>
        );

      default:
        // Fallback to Clear weather icon instead of Lucide icon
        return (
          <View style={styles.customIconContainer}>
            <Svg width={size} height={size} viewBox="0 0 140 140">
              <Circle cx="70" cy="70" r="35" fill="#FFB800" />
              {[...Array(8)].map((_, i) => (
                <G key={i} rotate={`${i * 45} ${70} ${70}`}>
                  <Path
                    d={`M70 25 L70 15`}
                    stroke="#FFB800"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                </G>
              ))}
            </Svg>
          </View>
        );
    }
  };

  const getHourlyForecast = (): HourlyForecast[] => {
    if (!forecastData) return [];

    const currentHour = new Date().getHours();
    return forecastData.list.slice(0, 24).map((item: ForecastItem) => {
      const date = new Date(item.dt * 1000);
      return {
        hour: date.getHours(),
        temp: convertTemperature(item.main.temp),
        feelsLike: convertTemperature(item.main.feels_like),
        weather: item.weather[0].main,
        description: item.weather[0].description,
        isNow: date.getHours() === currentHour,
        precipitation: {
          probability: item.pop * 100,
          amount: item.rain ? item.rain['3h'] : 0,
        },
        wind: {
          speed: item.wind.speed,
          direction: item.wind.deg,
          gust: item.wind.gust,
        },
        tempTrend: item.main.temp > (forecastData.list[0].main.temp + 1) ? 'rising' :
                   item.main.temp < (forecastData.list[0].main.temp - 1) ? 'falling' : 'stable'
      };
    });
  };

  const getWindDirection = (degrees: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                       'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading weather data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.locationHeader}>
            <View style={styles.locationInfo}>
              <Text style={styles.location}>{locationName}</Text>
              <Text style={styles.coordinates}>
                {location ? 
                  `${location.coords.latitude.toFixed(2)}°N, ${location.coords.longitude.toFixed(2)}°E` 
                  : ''}
              </Text>
            </View>
            <TimeInfo />
          </View>
          <View style={styles.currentWeather}>
            <View style={styles.weatherEffectWrapper}>
              <WeatherEffect 
                type={weatherData?.weather[0]?.main || 'Clear'} 
                style={styles.weatherEffect}
              />
              <LinearGradient
                colors={getWeatherGradient(weatherData?.weather[0]?.main || 'Clear')}
                style={styles.weatherGradient}
              >
                <CustomWeatherIcon 
                  type={weatherData?.weather[0]?.main || 'Clear'}
                  description={weatherData?.weather[0]?.description || ''}
                  size={140}
                />
              </LinearGradient>
              </View>
            <View style={styles.weatherInfo}>
              <View style={styles.temperatureContainer}>
                <Text style={styles.temperature}>
                  {weatherData ? `${Math.round(weatherData.main.temp)}°` : '--°'}
                </Text>
                <View style={styles.tempDetails}>
                  <Text style={styles.feelsLikeTemp}>
                    Feels like {weatherData ? `${Math.round(weatherData.main.feels_like)}°` : '--°'}
                  </Text>
                  <View style={styles.tempRange}>
                    <Text style={styles.tempRangeText}>
                      H: {Math.round(weatherData?.main.temp_max || 0)}° L: {Math.round(weatherData?.main.temp_min || 0)}°
                    </Text>
              </View>
            </View>
              </View>
              <Text style={styles.description}>
                {weatherData?.weather[0]?.description || 'Loading...'}
              </Text>
              <Text style={styles.weatherDescription}>
                {getWeatherDescription(weatherData?.weather[0]?.main || 'Clear')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.hourlyForecastContainer}>
          <Text style={styles.hourlyTitle}>Hourly Forecast</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.hourlyForecast}
            contentContainerStyle={styles.hourlyForecastContent}
          >
            {getHourlyForecast().map((item, index) => (
              <View key={index} style={styles.hourlyItem}>
                <Text style={styles.hourlyTime}>
                  {item.isNow ? 'Now' : `${item.hour}:00`}
                </Text>
                <View style={styles.hourlyIconContainer}>
                  <CustomWeatherIcon 
                    type={item.weather}
                    description={item.description}
                    size={32}
                  />
          </View>
                <View style={styles.tempContainer}>
                  <Text style={styles.hourlyTemp}>
                    {item.temp}°
                  </Text>
                  <Text style={[styles.tempTrend, { color: item.tempTrend === 'rising' ? '#4CAF50' : 
                                                  item.tempTrend === 'falling' ? '#F44336' : '#FFFFFF' }]}>
                    {item.tempTrend === 'rising' ? '↑' : item.tempTrend === 'falling' ? '↓' : ''}
                  </Text>
                </View>
                <Text style={styles.feelsLike}>
                  Feels {item.feelsLike}°
                </Text>
                {item.precipitation.probability > 0 && (
                  <View style={styles.precipContainer}>
                    <Droplets color="#87CEEB" size={14} />
                    <Text style={styles.precipText}>
                      {Math.round(item.precipitation.probability)}%
                    </Text>
                    {item.precipitation.amount > 0 && (
                      <Text style={styles.precipAmount}>
                        {item.precipitation.amount.toFixed(1)}mm
                      </Text>
                    )}
                  </View>
                )}
                <View style={styles.windContainer}>
                  <Wind color="#8E8E93" size={14} />
                  <Text style={styles.windText}>
                    {Math.round(item.wind.speed)}m/s {getWindDirection(item.wind.direction)}
                  </Text>
                  {item.wind.gust && item.wind.gust > item.wind.speed + 2 && (
                    <Text style={styles.windGust}>
                      Gusts: {Math.round(item.wind.gust)}m/s
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.weeklyForecast}>
          {weeklyForecast.map((day, index) => (
            <Pressable key={index} style={styles.forecastDay}>
              <Text style={[styles.dayText, index === 0 && styles.activeDay]}>
                {day.day}
              </Text>
              <View style={styles.forecastIconContainer}>
                <CustomWeatherIcon 
                  type={day.weather}
                  description={day.description}
                  size={40}
                />
              </View>
              <Text style={[styles.tempText, index === 0 && styles.activeTemp]}>
                {day.temp}°
              </Text>
              <Text style={styles.lowTempText}>
                {day.lowTemp}°
              </Text>
            </Pressable>
          ))}
          <Pressable 
            style={styles.showMoreButton}
            onPress={() => setShowExtendedForecast(prev => !prev)}
          >
            <Text style={styles.showMoreText}>
              {showExtendedForecast ? 'Show less' : 'Show more'}
            </Text>
            <Pressable onPress={toggleTemperatureUnit}>
              <Text style={styles.unitToggle}>°{temperatureUnit}</Text>
            </Pressable>
          </Pressable>
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.detailsTitle}>Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Feels like</Text>
              <Text style={styles.detailValue}>
                {weatherData ? `${convertTemperature(weatherData.main.feels_like)}°` : '--°'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Humidity</Text>
              <Text style={styles.detailValue}>
                {weatherData ? `${weatherData.main.humidity}%` : '--%'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Visibility</Text>
              <Text style={styles.detailValue}>
                {weatherData ? formatVisibility(weatherData.visibility) : '--'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Dew point</Text>
              <Text style={styles.detailValue}>
                {weatherData 
                  ? `${calculateDewPoint(weatherData.main.temp, weatherData.main.humidity)}°`
                  : '--°'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.airQualitySection}>
          <View style={styles.airQualityHeader}>
            <Text style={styles.sectionTitle}>Air Quality</Text>
            {airQualityData && (
              <Text style={[
                styles.airQualityIndex,
                { color: getAirQualityDescription(airQualityData.list[0].main.aqi).color }
              ]}>
                {airQualityData.list[0].main.aqi}
              </Text>
            )}
          </View>
          <View style={styles.airQualityContent}>
            <Gauge 
              color={airQualityData 
                ? getAirQualityDescription(airQualityData.list[0].main.aqi).color 
                : '#9E9E9E'} 
              size={32} 
            />
            <Text style={styles.airQualityDescription}>
              {airQualityData 
                ? getAirQualityDescription(airQualityData.list[0].main.aqi).text
                : 'Loading air quality data...'}
            </Text>
          </View>
          {airQualityData && (
            <>
              <View style={styles.airQualityMetrics}>
                <View style={styles.metricsRow}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>PM2.5</Text>
                    <Text style={styles.metricValue}>
                      {airQualityData.list[0].components.pm2_5.toFixed(1)}
                    </Text>
                    <Text style={styles.metricUnit}>μg/m³</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>PM10</Text>
                    <Text style={styles.metricValue}>
                      {airQualityData.list[0].components.pm10.toFixed(1)}
                    </Text>
                    <Text style={styles.metricUnit}>μg/m³</Text>
                  </View>
                </View>
                <View style={styles.metricsRow}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>O₃</Text>
                    <Text style={styles.metricValue}>
                      {airQualityData.list[0].components.o3.toFixed(1)}
                    </Text>
                    <Text style={styles.metricUnit}>μg/m³</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>NO₂</Text>
                    <Text style={styles.metricValue}>
                      {airQualityData.list[0].components.no2.toFixed(1)}
                    </Text>
                    <Text style={styles.metricUnit}>μg/m³</Text>
                  </View>
                </View>
                <View style={styles.metricsRow}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>SO₂</Text>
                    <Text style={styles.metricValue}>
                      {airQualityData.list[0].components.so2.toFixed(1)}
                    </Text>
                    <Text style={styles.metricUnit}>μg/m³</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>CO</Text>
                    <Text style={styles.metricValue}>
                      {airQualityData.list[0].components.co.toFixed(1)}
                    </Text>
                    <Text style={styles.metricUnit}>μg/m³</Text>
                  </View>
                </View>
              </View>
              <View style={styles.recommendationsSection}>
                <Text style={styles.recommendationsTitle}>Recommendations:</Text>
                {getAirQualityDescription(airQualityData.list[0].main.aqi).recommendations.map((rec, index) => (
                  <Text key={index} style={styles.recommendationItem}>
                    • {rec}
                  </Text>
                ))}
              </View>
            </>
          )}
        </View>

        <View style={styles.sunMoonSection}>
          <Text style={styles.sectionTitle}>Sun & Moon</Text>
          <View style={styles.sunMoonContent}>
            <View style={styles.sunMoonCard}>
              <View style={styles.sunMoonHeader}>
              <Sun color="#FFB800" size={24} />
                <Text style={styles.sunMoonTitle}>Sun</Text>
            </View>
              <View style={styles.sunMoonTimes}>
                <View style={styles.timeRow}>
                  <View style={styles.timeBlock}>
                    <Sunrise color="#FFB800" size={20} />
                    <Text style={styles.timeLabel}>Sunrise</Text>
                    <Text style={styles.timeText}>
                      {weatherData ? formatTime(weatherData.sys.sunrise) : '--:--'}
                    </Text>
            </View>
                  <View style={styles.timeBlock}>
                    <Sunset color="#FFB800" size={20} />
                    <Text style={styles.timeLabel}>Sunset</Text>
                    <Text style={styles.timeText}>
                      {weatherData ? formatTime(weatherData.sys.sunset) : '--:--'}
                    </Text>
          </View>
        </View>
                <View style={styles.dayProgress}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        { 
                          width: weatherData 
                            ? `${calculateDayProgress(weatherData.sys.sunrise, weatherData.sys.sunset)}%` 
                            : '0%' 
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={[styles.sunMoonCard, styles.moonCard]}>
              <View style={styles.sunMoonHeader}>
                <Moon color="#ffffff" size={24} />
                <Text style={styles.sunMoonTitle}>Moon</Text>
              </View>
              <View style={styles.moonPhase}>
                <Text style={styles.moonEmoji}>
                  {getMoonPhaseInfo(new Date()).emoji}
                </Text>
                <Text style={styles.moonPhaseText}>
                  {getMoonPhaseInfo(new Date()).phase}
                </Text>
                <Text style={styles.moonPhaseDescription}>
                  {getMoonPhaseDescription(getMoonPhaseInfo(new Date()).phase)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Weather Alerts Section */}
        {weatherAlerts.length > 0 && (
          <View style={styles.alertsSection}>
            <Text style={styles.alertsTitle}>Weather Alerts</Text>
            {weatherAlerts.map((alert, index) => (
              <View key={index} style={styles.alertCard}>
                <View style={[styles.alertHeader, { backgroundColor: '#FF3D00' }]}>
                  <CloudLightning color="#fff" size={20} />
                  <Text style={styles.alertType}>{alert.event}</Text>
                </View>
                <Text style={styles.alertDescription}>{alert.description}</Text>
                <Text style={styles.alertTime}>
                  Until {new Date(alert.end * 1000).toLocaleTimeString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1e',
  },
  scrollContent: {
    padding: 15,
  },
  header: {
    marginBottom: 15,
    backgroundColor: '#2c2c2e',
    borderRadius: 15,
    padding: 20,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  locationInfo: {
    flex: 1,
  },
  location: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 4,
  },
  coordinates: {
    color: '#8e8e93',
    fontSize: 15,
    marginTop: 4,
  },
  currentWeather: {
    alignItems: 'center',
    padding: 15,
  },
  weatherIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#E8F4F8',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4.65,
    elevation: 8,
    overflow: 'hidden',
  },
  weatherEffects: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  raindrop: {
    position: 'absolute',
    width: 2,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 1,
  },
  snowflake: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 2,
  },
  weatherInfo: {
    alignItems: 'center',
    marginBottom: 15,
    padding: 15,
    borderRadius: 15,
    width: '100%',
    backgroundColor: 'rgba(60, 60, 62, 0.5)',
  },
  temperatureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  temperature: {
    fontSize: 48,
    fontWeight: '300',
    color: '#fff',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tempDetails: {
    marginLeft: 15,
  },
  feelsLikeTemp: {
    color: '#8e8e93',
    fontSize: 16,
    marginBottom: 5,
  },
  tempRange: {
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
    borderRadius: 10,
    padding: 5,
  },
  tempRangeText: {
    color: '#fff',
    fontSize: 14,
  },
  description: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 8,
    textTransform: 'capitalize',
    fontWeight: '500',
    textShadowColor: 'rgba(252, 250, 250, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  weatherDescription: {
    fontSize: 14,
    color: '#e0e0e0',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  weatherMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  metricValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  hourlyForecastContainer: {
    backgroundColor: '#2c2c2e',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  hourlyTitle: {
    fontSize: 18,
    color: '#FFB800',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  hourlyForecast: {
    flexDirection: 'row',
  },
  hourlyForecastContent: {
    paddingHorizontal: 5,
  },
  hourlyItem: {
    alignItems: 'center',
    marginRight: 25,
    minWidth: 80,
    backgroundColor: '#3c3c3e',
    borderRadius: 12,
    padding: 10,
  },
  hourlyIconContainer: {
    width: 32,
    height: 32,
    marginVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hourlyTime: {
    color: '#8e8e93',
    fontSize: 13,
    marginBottom: 8,
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  hourlyTemp: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  tempTrend: {
    marginLeft: 2,
    fontSize: 14,
  },
  feelsLike: {
    color: '#8e8e93',
    fontSize: 12,
    marginBottom: 5,
  },
  precipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(135, 206, 235, 0.1)',
    borderRadius: 10,
    padding: 4,
    marginVertical: 3,
  },
  precipText: {
    color: '#87CEEB',
    fontSize: 12,
    marginLeft: 4,
  },
  precipAmount: {
    color: '#87CEEB',
    fontSize: 10,
    marginLeft: 4,
  },
  windContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
    borderRadius: 10,
    padding: 4,
    marginVertical: 3,
  },
  windText: {
    color: '#8e8e93',
    fontSize: 12,
    marginLeft: 4,
  },
  windGust: {
    color: '#8e8e93',
    fontSize: 10,
    marginLeft: 4,
  },
  alertsSection: {
    backgroundColor: '#2c2c2e',
    borderRadius: 15,
    padding: 15,
    marginVertical: 10,
  },
  alertsTitle: {
    fontSize: 18,
    color: '#FFB800',
    fontWeight: '600',
    marginBottom: 10,
  },
  alertCard: {
    backgroundColor: '#3c3c3e',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  alertType: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  alertDescription: {
    color: '#8e8e93',
    fontSize: 14,
    padding: 10,
    paddingTop: 0,
  },
  alertTime: {
    color: '#8e8e93',
    fontSize: 12,
    padding: 10,
    paddingTop: 0,
  },
  weeklyForecast: {
    backgroundColor: '#2c2c2e',
    borderRadius: 15,
    marginBottom: 30,
    overflow: 'hidden',
  },
  forecastDay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3c3c3e',
  },
  forecastIconContainer: {
    width: 40,
    height: 40,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    width: 100,
    color: '#8e8e93',
    fontSize: 16,
  },
  activeDay: {
    color: '#fff',
  },
  tempText: {
    color: '#8e8e93',
    fontSize: 16,
    marginRight: 8,
  },
  activeTemp: {
    color: '#fff',
  },
  lowTempText: {
    color: '#8e8e93',
    fontSize: 16,
  },
  showMoreButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  showMoreText: {
    color: '#0a84ff',
    fontSize: 16,
  },
  unitToggle: {
    color: '#8e8e93',
    fontSize: 16,
  },
  detailsSection: {
    backgroundColor: '#2c2c2e',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 20,
    color: '#FFB800',
    marginBottom: 15,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    width: '50%',
    marginBottom: 20,
  },
  detailLabel: {
    color: '#8e8e93',
    fontSize: 14,
    marginBottom: 5,
  },
  detailValue: {
    color: '#fff',
    fontSize: 16,
  },
  airQualitySection: {
    backgroundColor: '#2c2c2e',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  airQualityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#FFB800',
  },
  airQualityIndex: {
    fontSize: 24,
    color: '#4CAF50',
    fontWeight: '600',
  },
  airQualityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3c3c3e',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  airQualityDescription: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
    marginLeft: 15,
  },
  airQualityMetrics: {
    marginTop: 15,
    backgroundColor: '#2c2c2e',
    borderRadius: 10,
    padding: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metricLabel: {
    color: '#8e8e93',
    fontSize: 14,
    marginBottom: 4,
  },
  metricUnit: {
    color: '#8e8e93',
    fontSize: 12,
    marginTop: 2,
  },
  recommendationsSection: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#2c2c2e',
    borderRadius: 10,
  },
  recommendationsTitle: {
    color: '#FFB800',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  recommendationItem: {
    color: '#8e8e93',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  sunMoonSection: {
    backgroundColor: '#2c2c2e',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  sunMoonContent: {
    marginTop: 15,
    gap: 15,
  },
  sunMoonCard: {
    backgroundColor: '#3c3c3e',
    borderRadius: 12,
    padding: 15,
  },
  moonCard: {
    marginTop: 10,
  },
  sunMoonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sunMoonTitle: {
    color: '#FFB800',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  sunMoonTimes: {
    gap: 15,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeBlock: {
    alignItems: 'center',
    gap: 5,
  },
  timeLabel: {
    color: '#8e8e93',
    fontSize: 14,
    marginTop: 5,
  },
  timeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  dayProgress: {
    marginTop: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2c2c2e',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFB800',
    borderRadius: 2,
  },
  moonPhase: {
    alignItems: 'center',
    padding: 10,
  },
  moonEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  moonPhaseText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  moonPhaseDescription: {
    color: '#8e8e93',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 18,
  },
  customIconContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  weatherEffectContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  cloudParticle: {
    position: 'absolute',
    width: 40,
    height: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    opacity: 0.3,
  },
  weatherEffectWrapper: {
    position: 'relative',
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    marginBottom: 20,
  },
  weatherEffect: {
    borderRadius: 70,
  },
  weatherGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  currentTime: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  currentDate: {
    color: '#8e8e93',
    fontSize: 13,
    marginTop: 4,
  },
});