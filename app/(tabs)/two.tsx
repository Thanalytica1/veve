import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { Client } from '../../types/client';
import { clientStorage } from '../../storage/clientStorage';
import SessionHistory from '../../components/SessionHistory';
import CompleteSession from '../../components/CompleteSession';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function TabTwoScreen() {
  const colorScheme = useColorScheme();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'history'>('list');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const result = await clientStorage.listClients({
        sortBy: 'updatedAt',
        sortDir: 'desc',
      });
      setClients(result);
    } catch (error) {
      Alert.alert('Error', 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setView('history');
  };

  const handleSessionComplete = async (updatedClient: Client) => {
    setClients(prevClients =>
      prevClients.map(c => c.id === updatedClient.id ? updatedClient : c)
    );
    setSelectedClient(updatedClient);
    await loadClients();
  };

  const handleCompleteNewSession = async () => {
    if (!selectedClient) return;

    try {
      const nowISO = new Date().toISOString();
      const { updatedClient } = await clientStorage.completeSession(selectedClient.id, nowISO);
      handleSessionComplete(updatedClient);
      Alert.alert('Success', 'Session completed successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to complete session');
    }
  };

  const getFullName = (client: Client): string => {
    if (client.displayName) return client.displayName;
    const name = `${client.firstName || ''} ${client.lastName || ''}`.trim();
    return name || 'Unnamed Client';
  };

  const renderClientItem = ({ item }: { item: Client }) => {
    const lastSession = item.sessionHistory?.[0];
    const lastSessionDate = lastSession
      ? new Date(lastSession.completedAt).toLocaleDateString()
      : 'No sessions yet';

    return (
      <TouchableOpacity
        style={styles.clientCard}
        onPress={() => handleClientSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{getFullName(item)}</Text>
          <Text style={styles.clientStats}>
            {item.sessionHistory?.length || 0} sessions • {item.package.sessionsRemaining} remaining
          </Text>
          <Text style={styles.lastSessionText}>
            Last: {lastSessionDate}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={Colors[colorScheme ?? 'light'].tabIconDefault}
        />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
      </View>
    );
  }

  if (view === 'history' && selectedClient) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setView('list');
              setSelectedClient(null);
            }}
          >
            <Ionicons name="arrow-back" size={24} color={Colors[colorScheme ?? 'light'].tint} />
            <Text style={styles.backText}>Back to Clients</Text>
          </TouchableOpacity>
          <Text style={styles.clientHeader}>{getFullName(selectedClient)}</Text>
        </View>

        <ScrollView style={styles.scrollView}>
          <CompleteSession
            client={selectedClient}
            onSessionComplete={handleSessionComplete}
          />
          <SessionHistory
            client={selectedClient}
            onCompleteSession={handleCompleteNewSession}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.listHeader}>
        <Text style={styles.title}>Session Tracking</Text>
        <Text style={styles.subtitle}>Select a client to view their session history</Text>
      </View>

      <FlatList
        data={clients}
        renderItem={renderClientItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No clients found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backText: {
    fontSize: 16,
    marginLeft: 8,
  },
  clientHeader: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  listHeader: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  clientCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginVertical: 4,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  clientStats: {
    fontSize: 14,
    marginBottom: 2,
  },
  lastSessionText: {
    fontSize: 12,
    opacity: 0.6,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 4,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
  },
});
