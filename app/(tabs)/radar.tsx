import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { AlertTriangle, MapPin, Clock, ChevronRight, CloudRain, Wind, Thermometer, Cloud, Compass, ArrowUp } from 'lucide-react-native';
import WebView from 'react-native-webview';
import { useLocation } from '@/lib/context/LocationContext';

interface WeatherData {
  temp: number;
  feelsLike: number;
  rain: number;
  humidity: number;
  windSpeed: number;
  windGust: number;
  windDirection: number;
  time: string;
  date: string;
  weatherIcon: string;
  description: string;
}

export default function Radar() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<'radar' | 'satellite'>('radar');
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const { location, loading: locationLoading, error: locationError } = useLocation();

  useEffect(() => {
    if (location && !locationLoading) {
      fetchWeatherData();
    } else if (locationError) {
      setError(locationError);
      setLoading(false);
    }
  }, [location, locationLoading, locationError]);

  const fetchWeatherData = async () => {
    if (!location) return;
    
    try {
      const weatherResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${location.lat}&lon=${location.lon}&units=metric&appid=${process.env.EXPO_PUBLIC_WEATHER_API_KEY}`
      );

      // Process weather data
      if (weatherResponse.data && weatherResponse.data.list) {
        const next24Hours = weatherResponse.data.list.slice(0, 8).map((item: any) => ({
          temp: Math.round(item.main.temp),
          feelsLike: Math.round(item.main.feels_like),
          rain: item.rain?.['3h'] || 0,
          humidity: item.main.humidity,
          windSpeed: Math.round(item.wind.speed * 3.6),
          windGust: Math.round((item.wind.gust || item.wind.speed) * 3.6),
          windDirection: item.wind.deg,
          time: new Date(item.dt * 1000).toLocaleTimeString('en-US', {
            hour: 'numeric',
            hour12: true
          }),
          date: new Date(item.dt * 1000).toLocaleDateString('en-US', {
            weekday: 'short',
            day: 'numeric'
          }),
          weatherIcon: item.weather[0].icon,
          description: item.weather[0].description
        }));
        setWeatherData(next24Hours);
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching data:', error.message);
      setError('Failed to fetch weather data');
      setLoading(false);
    }
  };

  const getWindDirection = (degrees: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  if (loading || locationLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a84ff" />
          <Text style={styles.loadingText}>Loading radar data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || locationError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || locationError}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getEmblemMapUrl = () => {
    if (!location) return '';
    const baseUrl = 'https://embed.windy.com/embed2.html';
    const params = new URLSearchParams({
      lat: location.lat.toString(),
      lon: location.lon.toString(),
      zoom: '8',
      overlay: selectedLayer === 'radar' ? 'radar' : 'satellite',
      level: 'surface',
      menu: 'false',
      message: 'false',
      marker: 'true',
      calendar: 'false',
      pressure: 'false',
      type: 'map',
      location: 'coordinates',
      detail: 'false',
      detailLat: location.lat.toString(),
      detailLon: location.lon.toString(),
      metricWind: 'default',
      metricTemp: 'default',
      product: 'radar',
      widgets: 'false',
      timestamp: Date.now().toString()
    });
    return `${baseUrl}?${params.toString()}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <MapPin size={20} color="#fff" />
          <Text style={styles.location}>
            {location ? `${location.name}, ${location.country}` : 'Loading location...'}
          </Text>
        </View>
        
        <View style={styles.mapContainer}>
          {location && (
            <WebView
              source={{ uri: getEmblemMapUrl() }}
              style={styles.map}
              scrollEnabled={false}
              bounces={false}
            />
          )}
          <View style={styles.layerControls}>
            <Pressable
              style={[
                styles.layerButton,
                selectedLayer === 'radar' && styles.layerButtonActive
              ]}
              onPress={() => setSelectedLayer('radar')}
            >
              <CloudRain size={20} color={selectedLayer === 'radar' ? '#fff' : '#8e8e93'} />
              <Text style={[
                styles.layerText,
                selectedLayer === 'radar' && styles.layerTextActive
              ]}>
                Radar
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.layerButton,
                selectedLayer === 'satellite' && styles.layerButtonActive
              ]}
              onPress={() => setSelectedLayer('satellite')}
            >
              <Cloud size={20} color={selectedLayer === 'satellite' ? '#fff' : '#8e8e93'} />
              <Text style={[
                styles.layerText,
                selectedLayer === 'satellite' && styles.layerTextActive
              ]}>
                Satellite
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Weather Details Section */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weatherDetailsContainer}
        >
          {weatherData.map((data, index) => (
            <View key={index} style={styles.weatherCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.dateText}>{data.date}</Text>
                <Text style={styles.timeText}>{data.time}</Text>
              </View>
              
              <View style={styles.weatherIconContainer}>
                <Image
                  source={{ 
                    uri: `https://openweathermap.org/img/wn/${data.weatherIcon}@2x.png`
                  }}
                  style={styles.weatherIcon}
                />
                <Text style={styles.descriptionText}>
                  {data.description.charAt(0).toUpperCase() + data.description.slice(1)}
                </Text>
              </View>

              <View style={styles.weatherInfo}>
                <View style={styles.mainTemp}>
                  <Thermometer size={24} color="#fff" />
                  <Text style={styles.tempText}>{data.temp}°C</Text>
                </View>
                
                <Text style={styles.feelsLikeText}>Feels like {data.feelsLike}°C</Text>

                <View style={styles.divider} />

                <View style={styles.infoGrid}>
                  <View style={styles.infoColumn}>
                    <View style={styles.infoRow}>
                      <CloudRain size={16} color="#0a84ff" />
                      <Text style={styles.infoText}>{data.rain}mm</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Wind size={16} color="#32d74b" />
                      <Text style={styles.infoText}>{data.windSpeed}km/h</Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoColumn}>
                    <View style={styles.infoRow}>
                      <ArrowUp size={16} color="#ff9f0a" />
                      <Text style={styles.infoText}>{data.windGust}km/h</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Compass size={16} color="#bf5af2" />
                      <Text style={styles.infoText}>{getWindDirection(data.windDirection)}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.humidityRow}>
                  <View style={styles.humidityIndicator}>
                    <View 
                      style={[
                        styles.humidityFill, 
                        { width: `${data.humidity}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.humidityText}>{data.humidity}%</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Radar data provided by Windy.com
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    paddingTop: -75,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  location: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
  mapContainer: {
    height: 400,
    backgroundColor: '#2c2c2e',
    borderRadius: 15,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  layerControls: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    backgroundColor: 'rgba(44, 44, 46, 0.9)',
    borderRadius: 12,
    padding: 8,
  },
  layerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  layerButtonActive: {
    backgroundColor: '#3a3a3c',
  },
  layerText: {
    fontSize: 14,
    color: '#8e8e93',
  },
  layerTextActive: {
    color: '#fff',
  },
  weatherDetailsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  weatherCard: {
    backgroundColor: '#2c2c2e',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 180,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardHeader: {
    marginBottom: 12,
  },
  dateText: {
    color: '#FFB800',
    fontSize: 16,
    fontWeight: '600',
  },
  timeText: {
    color: '#8e8e93',
    fontSize: 14,
    marginTop: 2,
  },
  weatherIconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  weatherIcon: {
    width: 64,
    height: 64,
  },
  descriptionText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  mainTemp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tempText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '600',
  },
  feelsLikeText: {
    color: '#8e8e93',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#3a3a3c',
    marginVertical: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoColumn: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
  },
  humidityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  humidityIndicator: {
    flex: 1,
    height: 4,
    backgroundColor: '#3a3a3c',
    borderRadius: 2,
    overflow: 'hidden',
  },
  humidityFill: {
    height: '100%',
    backgroundColor: '#0a84ff',
    borderRadius: 2,
  },
  humidityText: {
    color: '#8e8e93',
    fontSize: 12,
  },
  weatherInfo: {
    gap: 8,
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
  disclaimer: {
    padding: 16,
    alignItems: 'center',
  },
  disclaimerText: {
    color: '#8e8e93',
    fontSize: 12,
  }
});