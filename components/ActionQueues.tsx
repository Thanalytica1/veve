import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Client } from '../types/client';
import { analyzeClient } from '../utils/analytics';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

interface QueueRowProps {
  client: Client;
  type: 'renewal' | 'inactive';
  onPress: (client: Client) => void;
}

interface ActionQueuesProps {
  renewalQueue: Client[];
  inactiveQueue: Client[];
  onClientPress: (client: Client) => void;
  onViewAll: (type: 'renewal' | 'inactive') => void;
}

const QueueRow: React.FC<QueueRowProps> = ({ client, type, onPress }) => {
  const colorScheme = useColorScheme();
  const analytics = analyzeClient(client);

  const getFullName = (): string => {
    if (client.displayName) return client.displayName;
    const name = `${client.firstName || ''} ${client.lastName || ''}`.trim();
    return name || 'Unnamed Client';
  };

  const getRelativeTime = (days: number): string => {
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 14) return '1 week ago';
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  const styles = StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme ?? 'light'].tabIconDefault + '20',
    },
    content: {
      flex: 1,
    },
    name: {
      fontSize: 16,
      fontWeight: '500',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 4,
    },
    details: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    detailText: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
    },
    sessionsLeft: {
      fontSize: 12,
      fontWeight: '500',
      color: client.package.sessionsRemaining <= 1 ? '#ff3b30' : '#ff9500',
    },
    chevron: {
      marginLeft: 12,
    },
  });

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onPress(client)}
      accessibilityRole="button"
      accessibilityLabel={
        type === 'renewal'
          ? `${getFullName()}, ${client.package.sessionsRemaining} sessions left, ${analytics.daysToZero} days to zero`
          : `${getFullName()}, ${analytics.daysSinceLast} days since last session, ${analytics.avgPerWeek} average per week`
      }
    >
      <View style={styles.content}>
        <Text style={styles.name}>{getFullName()}</Text>
        <View style={styles.details}>
          {type === 'renewal' ? (
            <>
              <Text style={styles.sessionsLeft}>
                {client.package.sessionsRemaining} left
              </Text>
              <Text style={styles.detailText}>•</Text>
              <Text style={styles.detailText}>
                {analytics.daysToZero ? `${analytics.daysToZero}d to zero` : 'No projection'}
              </Text>
              {client.dates.endDate && (
                <>
                  <Text style={styles.detailText}>•</Text>
                  <Text style={styles.detailText}>
                    Ends {new Date(client.dates.endDate).toLocaleDateString()}
                  </Text>
                </>
              )}
            </>
          ) : (
            <>
              <Text style={styles.detailText}>
                {analytics.daysSinceLast ? getRelativeTime(analytics.daysSinceLast) : 'No sessions'}
              </Text>
              <Text style={styles.detailText}>•</Text>
              <Text style={styles.detailText}>
                {analytics.avgPerWeek}/wk avg
              </Text>
            </>
          )}
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={16}
        color={Colors[colorScheme ?? 'light'].tabIconDefault}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
};

export default function ActionQueues({
  renewalQueue,
  inactiveQueue,
  onClientPress,
  onViewAll
}: ActionQueuesProps) {
  const colorScheme = useColorScheme();
  const [expandedRenewals, setExpandedRenewals] = useState(false);
  const [expandedInactive, setExpandedInactive] = useState(false);

  const maxPreviewItems = 5;

  const styles = StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    queueContainer: {
      backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff',
      borderRadius: 12,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme ?? 'light'].tabIconDefault + '20',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      marginRight: 8,
    },
    badge: {
      backgroundColor: Colors[colorScheme ?? 'light'].tint,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
      minWidth: 20,
      alignItems: 'center',
    },
    badgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    emptyContainer: {
      padding: 20,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      fontStyle: 'italic',
    },
    viewAllButton: {
      padding: 16,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: Colors[colorScheme ?? 'light'].tabIconDefault + '20',
    },
    viewAllText: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].tint,
      fontWeight: '500',
    },
  });

  const renderQueue = (
    title: string,
    queue: Client[],
    type: 'renewal' | 'inactive',
    expanded: boolean,
    onToggle: () => void
  ) => {
    const itemsToShow = expanded ? queue : queue.slice(0, maxPreviewItems);
    const hasMore = queue.length > maxPreviewItems;

    return (
      <View style={styles.queueContainer}>
        <TouchableOpacity
          style={styles.header}
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={`${title} queue, ${queue.length} items, ${expanded ? 'expanded' : 'collapsed'}`}
        >
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{title}</Text>
            {queue.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{queue.length}</Text>
              </View>
            )}
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={Colors[colorScheme ?? 'light'].tabIconDefault}
          />
        </TouchableOpacity>

        {expanded && (
          <>
            {queue.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {type === 'renewal' ? 'No at-risk renewals' : 'No inactive clients'}
                </Text>
              </View>
            ) : (
              <>
                {itemsToShow.map((client, index) => (
                  <QueueRow
                    key={client.id}
                    client={client}
                    type={type}
                    onPress={onClientPress}
                  />
                ))}
                {hasMore && !expanded && (
                  <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={() => onViewAll(type)}
                    accessibilityRole="button"
                    accessibilityLabel={`View all ${queue.length} ${type} items`}
                  >
                    <Text style={styles.viewAllText}>
                      View all {queue.length}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderQueue(
        'Renewals',
        renewalQueue,
        'renewal',
        expandedRenewals,
        () => setExpandedRenewals(!expandedRenewals)
      )}
      {renderQueue(
        'Inactive',
        inactiveQueue,
        'inactive',
        expandedInactive,
        () => setExpandedInactive(!expandedInactive)
      )}
    </View>
  );
}