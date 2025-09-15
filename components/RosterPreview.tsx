import React from 'react';
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

interface RosterPreviewProps {
  clients: Client[];
  onClientPress: (client: Client) => void;
  onViewAll: () => void;
}

interface ClientRowProps {
  client: Client;
  onPress: (client: Client) => void;
}

const ClientRow: React.FC<ClientRowProps> = ({ client, onPress }) => {
  const colorScheme = useColorScheme();
  const analytics = analyzeClient(client);

  const getFullName = (): string => {
    if (client.displayName) return client.displayName;
    const name = `${client.firstName || ''} ${client.lastName || ''}`.trim();
    return name || 'Unnamed Client';
  };

  const getLastSessionText = (): string => {
    if (!analytics.daysSinceLast) return 'No sessions';

    const days = analytics.daysSinceLast;
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  const styles = StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme ?? 'light'].tabIconDefault + '20',
      minHeight: 60,
    },
    content: {
      flex: 1,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    name: {
      fontSize: 16,
      fontWeight: '500',
      color: Colors[colorScheme ?? 'light'].text,
      flex: 1,
    },
    sessionsLeft: {
      fontSize: 14,
      fontWeight: '600',
      color: client.package.sessionsRemaining <= 3
        ? (client.package.sessionsRemaining === 0 ? '#ff3b30' : '#ff9500')
        : Colors[colorScheme ?? 'light'].tint,
    },
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    detailText: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
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
      accessibilityLabel={`${getFullName()}, ${client.package.sessionsRemaining} sessions left, last session ${getLastSessionText()}, ${analytics.avgPerWeek} per week average`}
    >
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {getFullName()}
          </Text>
          <Text style={styles.sessionsLeft}>
            {client.package.sessionsRemaining} left
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.detailText}>
            {getLastSessionText()}
          </Text>
          <Text style={styles.detailText}>•</Text>
          <Text style={styles.detailText}>
            {analytics.avgPerWeek}/wk avg
          </Text>
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

export default function RosterPreview({
  clients,
  onClientPress,
  onViewAll
}: RosterPreviewProps) {
  const colorScheme = useColorScheme();
  const maxPreviewItems = 5;
  const previewClients = clients.slice(0, maxPreviewItems);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff',
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      overflow: 'hidden',
      marginBottom: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme ?? 'light'].tabIconDefault + '20',
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
    },
    clientCount: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
    },
    emptyContainer: {
      padding: 20,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      fontStyle: 'italic',
      textAlign: 'center',
      marginBottom: 16,
    },
    addButton: {
      backgroundColor: Colors[colorScheme ?? 'light'].tint,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    addButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Roster Preview</Text>
        <Text style={styles.clientCount}>
          {clients.length} client{clients.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {clients.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No clients match your current filters.
          </Text>
        </View>
      ) : (
        <>
          {previewClients.map((client, index) => (
            <ClientRow
              key={client.id}
              client={client}
              onPress={onClientPress}
            />
          ))}

          {clients.length > maxPreviewItems && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={onViewAll}
              accessibilityRole="button"
              accessibilityLabel={`View all ${clients.length} clients`}
            >
              <Text style={styles.viewAllText}>
                View all {clients.length} clients
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}