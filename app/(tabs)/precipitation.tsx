import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Cloud, CloudRain, CloudLightning, Sun } from 'lucide-react-native';
import * as Location from 'expo-location';
import axios from 'axios';

interface ForecastItem {
  dt: number;
  pop: number;
  rain?: {
    '3h': number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
}

interface LocationData {
  name: string;
  country: string;
}

export default function Precipitation() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forecastData, setForecastData] = useState<ForecastItem[]>([]);
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission is required');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Fetch location name
      const locationResponse = await axios.get(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${process.env.EXPO_PUBLIC_WEATHER_API_KEY}`
      );
      
      if (locationResponse.data && locationResponse.data.length > 0) {
        const { name, country } = locationResponse.data[0];
        setLocationData({ name, country });
      }

      // Fetch forecast data
      const forecastResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${process.env.EXPO_PUBLIC_WEATHER_API_KEY}`
      );

      setForecastData(forecastResponse.data.list);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setError('Failed to fetch weather data');
      setLoading(false);
    }
  };

  const getWeatherIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'rain':
      case 'drizzle':
        return <CloudRain size={20} color="#0a84ff" />;
      case 'thunderstorm':
        return <CloudLightning size={20} color="#ffb800" />;
      case 'clear':
        return <Sun size={20} color="#ffb800" />;
      default:
        return <Cloud size={20} color="#8e8e93" />;
    }
  };

  const getDailyPrecipitation = () => {
    if (!forecastData.length) return [];
    
    const dailyData = new Map();
    
    forecastData.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dayKey = date.toLocaleDateString();
      
      if (!dailyData.has(dayKey)) {
        dailyData.set(dayKey, {
          date: date,
          maxPop: item.pop,
          rain: item.rain ? item.rain['3h'] : 0,
          weather: item.weather[0]
        });
      } else {
        const existing = dailyData.get(dayKey);
        if (item.pop > existing.maxPop) {
          existing.maxPop = item.pop;
          existing.weather = item.weather[0];
          if (item.rain) {
            existing.rain = Math.max(existing.rain, item.rain['3h']);
          }
        }
      }
    });

    return Array.from(dailyData.values());
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a84ff" />
          <Text style={styles.loadingText}>Loading precipitation data...</Text>
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

  const dailyPrecipitation = getDailyPrecipitation();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.location}>
          {locationData ? `${locationData.name}, ${locationData.country}` : 'Loading location...'}
        </Text>
        
        <View style={styles.precipitationChart}>
          {dailyPrecipitation.slice(0, 7).map((day, i) => (
            <View key={i} style={styles.chartColumn}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    height: Math.min(160, Math.max(30, day.maxPop * 160)),
                    backgroundColor: day.maxPop > 0.4 ? '#0a84ff' : '#465760'
                  }
                ]} 
              />
              <Text style={styles.dayText}>
                {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text style={[
                styles.precipValue,
                { color: day.maxPop > 0.4 ? '#0a84ff' : '#8e8e93' }
              ]}>
                {`${Math.round(day.maxPop * 100)}%`}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.detailsList}>
          {dailyPrecipitation.slice(0, 7).map((day, i) => (
            <View key={i} style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <Text style={styles.detailDay}>
                  {day.date.toLocaleDateString('en-US', { weekday: 'long' })}
                </Text>
                <View style={styles.weatherInfo}>
                  {getWeatherIcon(day.weather.main)}
                  <Text style={styles.detailDescription}>
                    {day.weather.description}
                  </Text>
                </View>
                {day.rain > 0 && (
                  <Text style={styles.rainAmount}>
                    {day.rain.toFixed(1)}mm expected
                  </Text>
                )}
              </View>
              <Text style={[
                styles.detailPrecip,
                { color: day.maxPop > 0.4 ? '#0a84ff' : '#8e8e93' }
              ]}>
                {`${Math.round(day.maxPop * 100)}%`}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    padding: 20,
  },
  location: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  precipitationChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 220,
    marginBottom: 20,
    backgroundColor: '#2c2c2e',
    borderRadius: 15,
    padding: 16,
    paddingBottom: 8,
    paddingTop: 20,
  },
  chartColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    height: '100%',
  },
  bar: {
    width: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  dayText: {
    color: '#8e8e93',
    fontSize: 12,
    marginBottom: 4,
  },
  precipValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailsList: {
    backgroundColor: '#2c2c2e',
    borderRadius: 15,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#3c3c3e',
  },
  detailLeft: {
    flex: 1,
  },
  detailDay: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailDescription: {
    color: '#8e8e93',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  detailPrecip: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 15,
  },
  rainAmount: {
    color: '#0a84ff',
    fontSize: 12,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});