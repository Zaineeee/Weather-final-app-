import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WeatherData } from '@/lib/types/weather';

interface WeatherCardProps {
  data: WeatherData;
  temperatureUnit?: 'C' | 'F';
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ data, temperatureUnit = 'C' }) => {
  const convertTemperature = (celsius: number): number => {
    if (temperatureUnit === 'F') {
      return Math.round((celsius * 9/5) + 32);
    }
    return Math.round(celsius);
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainInfo}>
        <Text style={styles.temperature}>
          {convertTemperature(data.main.temp)}°{temperatureUnit}
        </Text>
        <Text style={styles.description}>
          {data.weather[0].description}
        </Text>
      </View>
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Feels like</Text>
          <Text style={styles.value}>
            {convertTemperature(data.main.feels_like)}°{temperatureUnit}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Humidity</Text>
          <Text style={styles.value}>{data.main.humidity}%</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Wind</Text>
          <Text style={styles.value}>{Math.round(data.wind.speed)} m/s</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2c2c2e',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  mainInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  temperature: {
    fontSize: 48,
    color: '#ffffff',
    fontWeight: '300',
  },
  description: {
    fontSize: 18,
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: '#3c3c3e',
    paddingTop: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    color: '#8e8e93',
    fontSize: 16,
  },
  value: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
}); 