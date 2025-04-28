import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Cloud, Sun, CloudRain, CloudLightning, CloudSnow, CloudFog } from 'lucide-react-native';

interface ForecastCardProps {
  day: string;
  temperature: number;
  lowTemperature: number;
  weather: string;
  description: string;
  temperatureUnit?: 'C' | 'F';
  isToday?: boolean;
}

export const ForecastCard: React.FC<ForecastCardProps> = ({
  day,
  temperature,
  lowTemperature,
  weather,
  description,
  temperatureUnit = 'C',
  isToday = false,
}) => {
  const getWeatherIcon = () => {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('cloud')) return Cloud;
    if (lowerDesc.includes('rain')) return CloudRain;
    if (lowerDesc.includes('thunder')) return CloudLightning;
    if (lowerDesc.includes('snow')) return CloudSnow;
    if (lowerDesc.includes('fog') || lowerDesc.includes('mist')) return CloudFog;
    return Sun;
  };

  const WeatherIcon = getWeatherIcon();

  return (
    <View style={styles.container}>
      <Text style={[styles.day, isToday && styles.today]}>
        {isToday ? 'Today' : day}
      </Text>
      <View style={styles.iconContainer}>
        <WeatherIcon color={isToday ? '#ffffff' : '#8e8e93'} size={24} />
      </View>
      <View style={styles.temperatures}>
        <Text style={[styles.highTemp, isToday && styles.today]}>
          {temperature}°{temperatureUnit}
        </Text>
        <Text style={styles.lowTemp}>
          {lowTemperature}°{temperatureUnit}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3c3c3e',
  },
  day: {
    width: 100,
    color: '#8e8e93',
    fontSize: 16,
  },
  today: {
    color: '#ffffff',
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  temperatures: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  highTemp: {
    color: '#8e8e93',
    fontSize: 16,
    marginRight: 8,
  },
  lowTemp: {
    color: '#8e8e93',
    fontSize: 16,
  },
}); 