import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Cloud, Droplet, Wind, Sun, CloudRain, CloudLightning, CloudSnow, CloudFog } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import axios from 'axios';
import Animated from 'react-native-reanimated';
import { LineChart } from 'react-native-chart-kit';

interface WeatherData {
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
  };
  rain?: {
    '1h': number;
  };
}

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
  };
  pop: number;
  rain?: {
    '3h': number;
  };
}

export default function Forecast() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastData, setForecastData] = useState<{ list: ForecastItem[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string>('Loading location...');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

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
          
          // Fetch current weather
          const weatherResponse = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${process.env.EXPO_PUBLIC_WEATHER_API_KEY}`
          );
          setWeatherData(weatherResponse.data);

          // Fetch forecast data
          const forecastResponse = await axios.get(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${process.env.EXPO_PUBLIC_WEATHER_API_KEY}`
          );
          setForecastData(forecastResponse.data);
        } catch (error) {
          console.error('Error fetching weather data:', error);
          setError('Failed to fetch weather data');
        } finally {
          setLoading(false);
        }
      }
    })();
  }, []);

  const getWeatherIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'clear':
        return Sun;
      case 'clouds':
      case 'broken clouds':
      case 'scattered clouds':
        return Cloud;
      case 'rain':
      case 'drizzle':
        return CloudRain;
      case 'thunderstorm':
        return CloudLightning;
      case 'snow':
        return CloudSnow;
      case 'mist':
      case 'fog':
        return CloudFog;
      default:
        return Sun;
    }
  };

  const getWeatherGradient = (weatherMain: string): [string, string] => {
    switch (weatherMain.toLowerCase()) {
      case 'clear':
        return ['#4a90e2', '#87ceeb'];
      case 'clouds':
        return ['#54717a', '#cbd5e0'];
      case 'rain':
        return ['#465760', '#6b7c85'];
      case 'thunderstorm':
        return ['#2c3e50', '#34495e'];
      case 'snow':
        return ['#e8f4f8', '#c8e6f0'];
      case 'mist':
        return ['#8c9ea3', '#b8c6cc'];
      default:
        return ['#4a90e2', '#87ceeb'];
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
          <Text style={styles.loadingText}>Loading forecast data...</Text>
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
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.location}>{locationName}</Text>
          <Text style={styles.coordinates}>
            {location ? 
              `${location.coords.latitude.toFixed(2)}°N, ${location.coords.longitude.toFixed(2)}°E` 
              : ''}
          </Text>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Temperature Trend</Text>
          {forecastData && (
            <>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#0a84ff' }]} />
                  <Text style={styles.legendText}>Temperature</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#32d74b' }]} />
                  <Text style={styles.legendText}>Feels Like</Text>
                </View>
              </View>
              <LineChart
                data={{
                  labels: forecastData.list.slice(0, 12).map(item => 
                    new Date(item.dt * 1000).toLocaleTimeString('en-US', { hour: 'numeric' })
                  ),
                  datasets: [
                    {
                      data: forecastData.list.slice(0, 12).map(item => Math.round(item.main.temp)),
                      color: (opacity = 1) => `rgba(10, 132, 255, ${opacity})`,
                      strokeWidth: 2
                    },
                    {
                      data: forecastData.list.slice(0, 12).map(item => Math.round(item.main.feels_like)),
                      color: (opacity = 1) => `rgba(50, 215, 75, ${opacity})`,
                      strokeWidth: 2
                    }
                  ]
                }}
                width={Dimensions.get('window').width - 48}
                height={160}
                yAxisLabel=""
                yAxisSuffix="°"
                chartConfig={{
                  backgroundColor: '#2c2c2e',
                  backgroundGradientFrom: '#2c2c2e',
                  backgroundGradientTo: '#2c2c2e',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: '3',
                    strokeWidth: '1',
                  },
                  propsForLabels: {
                    fontSize: 10
                  },
                  propsForVerticalLabels: {
                    fontSize: 10
                  },
                  propsForHorizontalLabels: {
                    fontSize: 10,
                    rotation: 0
                  },
                  formatYLabel: (yLabel: string) => Math.round(parseFloat(yLabel)).toString(),
                  formatXLabel: (value) => value.replace(' ', ''),
                }}
                bezier
                style={{
                  marginVertical: 4,
                  borderRadius: 16,
                  paddingRight: 0,
                  paddingTop: 4
                }}
                withDots={true}
                withInnerLines={true}
                withOuterLines={true}
                withVerticalLines={false}
                withHorizontalLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                segments={4}
              />
              <View style={styles.chartStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>High</Text>
                  <Text style={styles.statValue}>
                    {Math.round(Math.max(...forecastData.list.slice(0, 12).map(item => Number(item.main.temp))))}°
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Low</Text>
                  <Text style={styles.statValue}>
                    {Math.round(Math.min(...forecastData.list.slice(0, 12).map(item => Number(item.main.temp))))}°
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Average</Text>
                  <Text style={styles.statValue}>
                    {Math.round(
                      forecastData.list.slice(0, 12).reduce((acc, item) => acc + Number(item.main.temp), 0) / 12
                    )}°
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        <View style={styles.dailyForecast}>
          <Text style={styles.sectionTitle}>5-Day Forecast</Text>
          {forecastData?.list.filter((_, index) => index % 8 === 0).map((item, index) => (
            <Pressable 
              key={index} 
              style={({pressed}) => [
                styles.dailyItem,
                pressed && styles.dailyItemPressed
              ]}
              android_ripple={{color: 'rgba(255, 255, 255, 0.1)'}}
            >
              <Text style={styles.dayText}>
                {new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' })}
              </Text>
              <View style={styles.dailyIconContainer}>
                <LinearGradient
                  colors={getWeatherGradient(item.weather[0].main)}
                  style={styles.dailyGradient}
                >
                  {React.createElement(
                    getWeatherIcon(item.weather[0].main),
                    { color: '#fff', size: 20 }
                  )}
                </LinearGradient>
              </View>
              <View style={styles.dailyTemp}>
                <Text style={[styles.maxTemp, styles.forecastValue]}>{Math.round(item.main.temp_max)}°</Text>
                <Text style={[styles.minTemp, styles.forecastValue]}>{Math.round(item.main.temp_min)}°</Text>
              </View>
              <View style={styles.dailyDetails}>
                <View style={styles.detailRow}>
                  <Droplet size={12} color="#0A84FF" />
                  <Text style={[styles.detailText, styles.forecastText]}>{Math.round(item.pop * 100)}%</Text>
                </View>
                <View style={styles.detailRow}>
                  <Wind size={12} color="#8e8e93" />
                  <Text style={[styles.detailText, styles.forecastText]}>
                    {Math.round(item.wind.speed)}
                  </Text>
                </View>
              </View>
            </Pressable>
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
  },
  header: {
    padding: 16,
    alignItems: 'center',
  },
  location: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 4,
  },
  coordinates: {
    fontSize: 12,
    color: '#8e8e93',
  },
  chartContainer: {
    backgroundColor: '#2c2c2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden'
  },
  sectionTitle: {
    fontSize: 18,
    color: '#FFB800',
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dailyForecast: {
    backgroundColor: '#2c2c2e',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dailyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#3c3c3e',
  },
  dailyItemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  dayText: {
    width: 90,
    color: '#ffffff',
    fontSize: 14,
  },
  dailyIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
  },
  dailyGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dailyTemp: {
    flexDirection: 'row',
    width: 70,
    justifyContent: 'space-between',
    marginRight: 12,
  },
  maxTemp: {
    color: '#ffffff',
    fontSize: 14,
  },
  minTemp: {
    color: '#8e8e93',
    fontSize: 14,
  },
  dailyDetails: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    color: '#8e8e93',
    fontSize: 12,
  },
  forecastText: {
    fontSize: 12,
    color: '#fff',
  },
  forecastValue: {
    fontSize: 14,
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#ffffff',
    fontSize: 12,
  },
  chartStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#3c3c3e',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#8e8e93',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});