import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Svg, Path, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

interface SparklineProps {
  data: number[];
  width: number;
  height: number;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export default function Sparkline({
  data,
  width,
  height,
  onPress,
  accessibilityLabel
}: SparklineProps) {
  const colorScheme = useColorScheme();

  if (data.length === 0) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={[styles.emptyText, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
          Start logging sessions to see trends.
        </Text>
      </View>
    );
  }

  const max = Math.max(...data, 1); // Avoid division by zero
  const min = Math.min(...data);
  const range = max - min || 1; // Avoid division by zero

  // Create path for sparkline
  const pathData = data.map((value, index) => {
    const x = (index / (data.length - 1)) * (width - 20); // 10px padding on each side
    const y = height - 20 - ((value - min) / range) * (height - 40); // 20px padding top/bottom
    return `${index === 0 ? 'M' : 'L'} ${x + 10} ${y}`;
  }).join(' ');

  // Calculate trend
  const currentWeek = data[data.length - 1];
  const previousWeek = data[data.length - 2];
  const trend = currentWeek - previousWeek;
  const trendIcon = trend > 0 ? 'trending-up' : trend < 0 ? 'trending-down' : 'remove';
  const trendColor = trend > 0 ? '#34c759' : trend < 0 ? '#ff3b30' : Colors[colorScheme ?? 'light'].tabIconDefault;

  // Last point coordinates for dot
  const lastX = ((data.length - 1) / (data.length - 1)) * (width - 20) + 10;
  const lastY = height - 20 - ((currentWeek - min) / range) * (height - 40);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff',
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      marginBottom: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
    },
    trendContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    trendText: {
      fontSize: 14,
      color: trendColor,
      marginLeft: 4,
      fontWeight: '500',
    },
    chartContainer: {
      position: 'relative',
    },
    emptyText: {
      fontSize: 14,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel || `Sessions trend chart. Current week: ${currentWeek} sessions, trend: ${trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat'}`}
      accessibilityRole="button"
      disabled={!onPress}
    >
      <View style={styles.header}>
        <Text style={styles.title}>8-week sessions</Text>
        <View style={styles.trendContainer}>
          <Ionicons
            name={trendIcon as any}
            size={16}
            color={trendColor}
          />
          <Text style={styles.trendText}>
            {trend > 0 ? `+${trend}` : trend}
          </Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Svg width={width - 32} height={height - 60}>
          <Path
            d={pathData}
            stroke={Colors[colorScheme ?? 'light'].tint}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle
            cx={lastX}
            cy={lastY}
            r="4"
            fill={Colors[colorScheme ?? 'light'].tint}
          />
        </Svg>
      </View>
    </TouchableOpacity>
  );
}