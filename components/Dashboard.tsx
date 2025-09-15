import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Client } from '../types/client';
import { clientStorage } from '../storage/clientStorage';
import {
  DashboardFilters,
  calculateDashboardKPIs,
  getWeeklySessionCounts,
  getRenewalQueue,
  getInactiveQueue,
  getDateRanges
} from '../utils/analytics';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import KPICards from './KPICards';
import Sparkline from './Sparkline';
import ActionQueues from './ActionQueues';
import RosterPreview from './RosterPreview';
import FiltersBottomSheet from './FiltersBottomSheet';

interface DashboardProps {
  onClientPress?: (client: Client) => void;
  onNavigateToClients?: (filters?: any) => void;
}

export default function Dashboard({ onClientPress, onNavigateToClients }: DashboardProps) {
  const colorScheme = useColorScheme();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAllKPIs, setShowAllKPIs] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>(() => ({
    dateRange: getDateRanges()['7d'],
    tags: [],
    status: 'all',
    riskLevel: 'all'
  }));

  const { width } = Dimensions.get('window');

  const loadClients = useCallback(async () => {
    try {
      const allClients = await clientStorage.listClients();
      setClients(allClients);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadClients();
  }, [loadClients]);

  // Memoized calculations for performance
  const { filteredClients, kpis, weeklyData, renewalQueue, inactiveQueue, availableTags } = useMemo(() => {
    // Apply filters to clients
    const filtered = clients.filter(client => {
      // Tag filter
      if (filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => client.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      // Status filter (for now, all clients are considered active)
      if (filters.status !== 'all') {
        // Could add status field to client model later
      }

      return true;
    });

    // Calculate KPIs
    const calculatedKPIs = calculateDashboardKPIs(filtered, filters);

    // Get weekly session data
    const weekly = getWeeklySessionCounts(filtered, filters);

    // Get action queues
    const renewals = getRenewalQueue(filtered);
    const inactive = getInactiveQueue(filtered);

    // Get all unique tags for filter options
    const tags = [...new Set(clients.flatMap(c => c.tags))].sort();

    return {
      filteredClients: filtered,
      kpis: calculatedKPIs,
      weeklyData: weekly,
      renewalQueue: renewals,
      inactiveQueue: inactive,
      availableTags: tags
    };
  }, [clients, filters]);

  const handleKPICardPress = (type: string) => {
    if (!onNavigateToClients) return;

    // Navigate to clients list with appropriate filters
    switch (type) {
      case 'active':
        onNavigateToClients({ status: 'active' });
        break;
      case 'inactive':
        onNavigateToClients({ riskLevel: 'inactive' });
        break;
      case 'at-risk':
        onNavigateToClients({ riskLevel: 'at-risk' });
        break;
      default:
        onNavigateToClients();
    }
  };

  const handleClientPress = (client: Client) => {
    if (onClientPress) {
      onClientPress(client);
    }
  };

  const handleQueueViewAll = (type: 'renewal' | 'inactive') => {
    if (!onNavigateToClients) return;

    onNavigateToClients({
      riskLevel: type === 'renewal' ? 'at-risk' : 'inactive'
    });
  };

  const handleApplyFilters = (newFilters: DashboardFilters) => {
    setFilters(newFilters);
  };

  const getActiveFilterCount = (): number => {
    let count = 0;
    if (filters.tags.length > 0) count++;
    if (filters.status !== 'all') count++;
    if (filters.riskLevel !== 'all') count++;
    return count;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 12,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    dateRangeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: Colors[colorScheme ?? 'light'].tint + '20',
    },
    dateRangeText: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].tint,
      fontWeight: '500',
      marginRight: 4,
    },
    filterButton: {
      position: 'relative',
      padding: 8,
      borderRadius: 20,
      backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault + '20',
    },
    filterBadge: {
      position: 'absolute',
      top: 2,
      right: 2,
      backgroundColor: Colors[colorScheme ?? 'light'].tint,
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterBadgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '600',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyText: {
      fontSize: 18,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      textAlign: 'center',
      marginBottom: 20,
    },
    emptySubtext: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      textAlign: 'center',
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        </View>
      </View>
    );
  }

  if (clients.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No clients yet</Text>
          <Text style={styles.emptySubtext}>
            Start logging sessions to see trends and analytics
          </Text>
        </View>
      </View>
    );
  }

  const activeFilterCount = getActiveFilterCount();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.dateRangeButton}>
            <Text style={styles.dateRangeText}>{filters.dateRange.label}</Text>
            <Ionicons
              name="chevron-down"
              size={14}
              color={Colors[colorScheme ?? 'light'].tint}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
            accessibilityLabel={`Filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ''}`}
          >
            <Ionicons
              name="options"
              size={20}
              color={Colors[colorScheme ?? 'light'].tabIconDefault}
            />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors[colorScheme ?? 'light'].tint}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <KPICards
          kpis={kpis}
          dateRangeLabel={filters.dateRange.label}
          onCardPress={handleKPICardPress}
          showAll={showAllKPIs}
          onToggleShowAll={() => setShowAllKPIs(!showAllKPIs)}
        />

        <Sparkline
          data={weeklyData}
          width={width - 40}
          height={72}
          accessibilityLabel={`8-week session trend. Data: ${weeklyData.join(', ')} sessions per week`}
        />

        <ActionQueues
          renewalQueue={renewalQueue}
          inactiveQueue={inactiveQueue}
          onClientPress={handleClientPress}
          onViewAll={handleQueueViewAll}
        />

        <RosterPreview
          clients={filteredClients}
          onClientPress={handleClientPress}
          onViewAll={() => onNavigateToClients?.()}
        />
      </ScrollView>

      <FiltersBottomSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={handleApplyFilters}
        availableTags={availableTags}
        resultCount={filteredClients.length}
      />
    </View>
  );
}