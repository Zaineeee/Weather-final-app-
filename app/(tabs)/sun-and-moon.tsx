import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sun, Moon, Sunrise, Sunset, MoonStar } from 'lucide-react-native';
import * as Location from 'expo-location';
import SunCalc from 'suncalc';

interface SunTimes {
  sunrise: Date;
  sunset: Date;
  solarNoon: Date;
  dawn: Date;
  dusk: Date;
}

interface MoonData {
  phase: number;
  illumination: number;
  age: number;
}

export default function SunAndMoon() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [location, setLocation] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [sunTimes, setSunTimes] = useState<SunTimes | null>(null);
  const [moonData, setMoonData] = useState<MoonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNightTime, setIsNightTime] = useState(false);
  const celestialPosition = new Animated.Value(0);
  const fadeAnim = new Animated.Value(1);

  // Generate next 7 days
  const DAYS = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      date,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      dayNum: date.getDate()
    };
  });

  useEffect(() => {
    fetchLocation();
  }, []);

  useEffect(() => {
    if (location) {
      calculateCelestialData(selectedDate);
    }
  }, [location, selectedDate]);

  useEffect(() => {
    // Animate to current position when time of day changes
    const position = isNightTime ? getMoonPosition() : getSunPosition();
    animateCelestialPosition(position);
    animateTransition();
  }, [isNightTime]);

  const fetchLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      setLocation({
        lat: location.coords.latitude,
        lon: location.coords.longitude,
        name: address?.city && address?.country ? 
          `${address.city}, ${address.country}` : 
          'Current Location'
      });
    } catch (error) {
      console.error('Error fetching location:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCelestialData = (date: Date) => {
    if (!location) return;

    // Calculate sun times
    const times = SunCalc.getTimes(date, location.lat, location.lon);
    const newSunTimes = {
      sunrise: times.sunrise,
      sunset: times.sunset,
      solarNoon: times.solarNoon,
      dawn: times.dawn,
      dusk: times.dusk
    };
    
    setSunTimes(newSunTimes);
    setIsNightTime(checkTimeOfDay(newSunTimes));

    // Calculate moon data
    const moonIllum = SunCalc.getMoonIllumination(date);
    const moonPos = SunCalc.getMoonPosition(date, location.lat, location.lon);
    setMoonData({
      phase: moonIllum.phase,
      illumination: Math.round(moonIllum.fraction * 100),
      age: Math.round(moonIllum.phase * 29.53)
    });
  };

  const checkTimeOfDay = (sunTimes: SunTimes | null) => {
    if (!sunTimes) return false;
    const now = new Date();
    return now < sunTimes.sunrise || now > sunTimes.sunset;
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getSunPosition = (): number => {
    if (!sunTimes) return 0;
    const now = new Date();
    const sunrise = sunTimes.sunrise.getTime();
    const sunset = sunTimes.sunset.getTime();
    const current = now.getTime();
    
    if (current < sunrise || current > sunset) return 0;
    
    const totalDayTime = sunset - sunrise;
    const progress = ((current - sunrise) / totalDayTime) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const getMoonPosition = (): number => {
    if (!sunTimes) return 0;
    const now = new Date();
    const sunset = sunTimes.sunset.getTime();
    const nextSunrise = new Date(sunTimes.sunrise);
    nextSunrise.setDate(nextSunrise.getDate() + 1);
    const sunrise = nextSunrise.getTime();
    const current = now.getTime();
    
    const totalNightTime = sunrise - sunset;
    const progress = ((current - sunset) / totalNightTime) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const getMoonPhaseName = (phase: number): string => {
    if (phase === 0) return 'New Moon';
    if (phase < 0.25) return 'Waxing Crescent';
    if (phase === 0.25) return 'First Quarter';
    if (phase < 0.5) return 'Waxing Gibbous';
    if (phase === 0.5) return 'Full Moon';
    if (phase < 0.75) return 'Waning Gibbous';
    if (phase === 0.75) return 'Last Quarter';
    return 'Waning Crescent';
  };

  // Add this function to animate position changes
  const animateCelestialPosition = (toValue: number) => {
    Animated.timing(celestialPosition, {
      toValue,
      duration: 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  // Add this function to animate transitions
  const animateTransition = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#0a84ff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.mainScroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.location}>{location?.name || 'Location not available'}</Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.daysScroll}
          contentContainerStyle={styles.daysScrollContent}
        >
          {DAYS.map((day, index) => (
            <Pressable 
              key={day.dayName}
              onPress={() => {
                const newDate = new Date(day.date);
                setSelectedDate(newDate);
              }}
              style={[
                styles.dayItem,
                selectedDate.getDate() === day.date.getDate() && styles.activeDayItem
              ]}
            >
              <Text style={[
                styles.dayText,
                selectedDate.getDate() === day.date.getDate() && styles.activeDayText
              ]}>
                {day.dayName}
              </Text>
              <Text style={[
                styles.dateText,
                selectedDate.getDate() === day.date.getDate() && styles.activeDateText
              ]}>
                {day.dayNum}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.contentContainer}>
          <Animated.View style={[styles.sunPathCard, { opacity: fadeAnim }]}>
            <Text style={styles.cardTitle}>
              {isNightTime ? 'Moon Path' : 'Sun Path'}
            </Text>
            
            <View style={styles.sunPathContainer}>
              <View style={styles.sunTimeContainer}>
                <View style={styles.sunTime}>
                  <Sunrise color={isNightTime ? '#A0A0A0' : '#FFB800'} size={20} />
                  <Text style={[styles.timeText, isNightTime && styles.nightTimeText]}>
                    {sunTimes ? formatTime(sunTimes.sunrise) : '--:--'}
                  </Text>
                  <Text style={styles.timeLabel}>Sunrise</Text>
                </View>
                <View style={styles.sunTime}>
                  <Sunset color={isNightTime ? '#A0A0A0' : '#FFB800'} size={20} />
                  <Text style={[styles.timeText, isNightTime && styles.nightTimeText]}>
                    {sunTimes ? formatTime(sunTimes.sunset) : '--:--'}
                  </Text>
                  <Text style={styles.timeLabel}>Sunset</Text>
                </View>
              </View>

              <View style={styles.arcContainer}>
                <View style={[
                  styles.arc,
                  isNightTime && styles.nightArc,
                  styles.arcGradient
                ]} />
                <Animated.View 
                  style={[
                    styles.celestialPosition,
                    {
                      left: celestialPosition.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%']
                      })
                    }
                  ]}
                >
                  {isNightTime ? (
                    <View style={styles.moonContainer}>
                      <MoonStar color="#fff" size={24} style={styles.glowEffect} />
                      <View style={styles.moonGlow} />
                    </View>
                  ) : (
                    <View style={styles.sunContainer}>
                      <Sun color="#FFB800" size={24} style={styles.glowEffect} />
                      <View style={styles.sunGlow} />
                    </View>
                  )}
                </Animated.View>
              </View>

              <View style={styles.additionalInfo}>
                <Text style={[styles.infoText, isNightTime && styles.nightInfoText]}>
                  Dawn: {sunTimes ? formatTime(sunTimes.dawn) : '--:--'}
                </Text>
                <Text style={[styles.infoText, isNightTime && styles.nightInfoText]}>
                  Dusk: {sunTimes ? formatTime(sunTimes.dusk) : '--:--'}
                </Text>
              </View>
            </View>
          </Animated.View>

          {moonData && (
            <View style={styles.moonCard}>
              <Text style={styles.cardTitle}>Moon</Text>
              <View style={styles.moonInfo}>
                <Moon color="#fff" size={24} />
                <View style={styles.moonDetails}>
                  <Text style={styles.moonPhase}>
                    {getMoonPhaseName(moonData.phase)}
                  </Text>
                  <Text style={styles.moonIllumination}>
                    {moonData.illumination}% Illuminated
                  </Text>
                  <Text style={styles.moonAge}>
                    Moon Age: {moonData.age} days
                  </Text>
                </View>
              </View>
            </View>
          )}
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
  mainScroll: {
    flex: 1,
  },
  location: {
    fontSize: 20,
    color: '#fff',
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  daysScroll: {
    marginBottom: 20,
  },
  daysScrollContent: {
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dayItem: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeDayItem: {
    backgroundColor: '#2c2c2e',
  },
  dayText: {
    color: '#8e8e93',
    fontSize: 14,
  },
  dateText: {
    color: '#8e8e93',
    fontSize: 16,
    marginTop: 4,
  },
  activeDayText: {
    color: '#fff',
  },
  activeDateText: {
    color: '#fff',
  },
  sunPathCard: {
    backgroundColor: '#2c2c2e',
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  moonCard: {
    backgroundColor: '#2c2c2e',
    borderRadius: 15,
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    color: '#FFB800',
    marginBottom: 20,
  },
  sunPathContainer: {
    alignItems: 'center',
  },
  sunTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  sunTime: {
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  timeLabel: {
    color: '#8e8e93',
    fontSize: 14,
  },
  arcContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
    alignItems: 'center',
  },
  celestialPosition: {
    position: 'absolute',
    top: '20%',
    transform: [{ translateX: -12 }],
  },
  arc: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 120,
    borderTopRightRadius: 120,
    borderWidth: 2,
    borderColor: '#FFB800',
    borderBottomWidth: 0,
    opacity: 0.3,
  },
  arcGradient: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  nightArc: {
    borderColor: '#fff',
  },
  additionalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  infoText: {
    color: '#8e8e93',
    fontSize: 14,
  },
  moonInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  moonDetails: {
    flex: 1,
  },
  moonPhase: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  moonIllumination: {
    color: '#8e8e93',
    fontSize: 14,
    marginBottom: 2,
  },
  moonAge: {
    color: '#8e8e93',
    fontSize: 14,
  },
  sunContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  moonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowEffect: {
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  sunGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFB800',
    opacity: 0.2,
    transform: [{ scale: 1.5 }],
  },
  moonGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    opacity: 0.15,
    transform: [{ scale: 1.5 }],
  },
  nightTimeText: {
    color: '#A0A0A0',
  },
  nightInfoText: {
    color: '#A0A0A0',
  },
});