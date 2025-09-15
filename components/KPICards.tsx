import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DashboardKPIs } from '../utils/analytics';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  onPress?: () => void;
  accessibilityLabel: string;
}

interface KPICardsProps {
  kpis: DashboardKPIs;
  dateRangeLabel: string;
  onCardPress: (type: string) => void;
  showAll: boolean;
  onToggleShowAll: () => void;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon,
  onPress,
  accessibilityLabel
}) => {
  const colorScheme = useColorScheme();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff',
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      flex: 1,
      minHeight: 100,
    },
    cardContent: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    icon: {
      marginBottom: 8,
    },
    value: {
      fontSize: 28,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
      textAlign: 'center',
      marginBottom: 4,
    },
    title: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      textAlign: 'center',
      marginBottom: 2,
    },
    subtitle: {
      fontSize: 11,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      textAlign: 'center',
    },
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <View style={styles.cardContent}>
        <Ionicons
          name={icon as any}
          size={24}
          color={Colors[colorScheme ?? 'light'].tint}
          style={styles.icon}
        />
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </TouchableOpacity>
  );
};

export default function KPICards({
  kpis,
  dateRangeLabel,
  onCardPress,
  showAll,
  onToggleShowAll
}: KPICardsProps) {
  const colorScheme = useColorScheme();

  const primaryCards = [
    {
      title: 'Active',
      value: kpis.activeClients.toString(),
      icon: 'people',
      type: 'active',
      accessibilityLabel: `Active clients: ${kpis.activeClients} clients`
    },
    {
      title: `Sessions (${dateRangeLabel})`,
      value: kpis.sessionsCompleted.toString(),
      icon: 'fitness',
      type: 'sessions',
      accessibilityLabel: `Sessions completed in ${dateRangeLabel}: ${kpis.sessionsCompleted} sessions`
    },
    {
      title: 'Avg / wk',
      value: kpis.avgPerWeekMean.toString(),
      subtitle: `mean (med ${kpis.avgPerWeekMedian})`,
      icon: 'trending-up',
      type: 'avg-week',
      accessibilityLabel: `Average sessions per week: ${kpis.avgPerWeekMean} mean, ${kpis.avgPerWeekMedian} median`
    },
    {
      title: 'Inactive 14+ d',
      value: `${kpis.percentInactive}%`,
      icon: 'time',
      type: 'inactive',
      accessibilityLabel: `Inactive 14+ days: ${kpis.percentInactive} percent of clients`
    }
  ];

  const secondaryCards = [
    {
      title: 'At-risk',
      value: kpis.atRiskCount.toString(),
      icon: 'warning',
      type: 'at-risk',
      accessibilityLabel: `At-risk renewals: ${kpis.atRiskCount} clients`
    },
    {
      title: 'Median days→0',
      value: kpis.medianDaysToZero ? kpis.medianDaysToZero.toString() : '—',
      icon: 'calendar',
      type: 'days-to-zero',
      accessibilityLabel: `Median days to zero sessions: ${kpis.medianDaysToZero || 'not projectable'}`
    }
  ];

  const cardsToShow = showAll ? [...primaryCards, ...secondaryCards] : primaryCards;

  const styles = StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 12,
    },
    cardWrapper: {
      width: '47%',
    },
    toggleButton: {
      alignSelf: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault + '20',
    },
    toggleText: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].tint,
      fontWeight: '500',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {cardsToShow.map((card, index) => (
          <View key={card.type} style={styles.cardWrapper}>
            <KPICard
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
              icon={card.icon}
              accessibilityLabel={card.accessibilityLabel}
              onPress={() => onCardPress(card.type)}
            />
          </View>
        ))}
      </View>

      {!showAll && (
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={onToggleShowAll}
          accessibilityLabel="Show more KPIs"
          accessibilityRole="button"
        >
          <Text style={styles.toggleText}>Show more KPIs</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}