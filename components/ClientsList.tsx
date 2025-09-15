import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Client, SortField, SortDirection } from '../types/client';
import { clientStorage } from '../storage/clientStorage';
import { formatPhone } from '../utils/validation';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import ClientForm from './ClientForm';
import { Ionicons } from '@expo/vector-icons';
import CompleteSession from './CompleteSession';

export default function ClientsList() {
  const colorScheme = useColorScheme();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  const loadClients = useCallback(async () => {
    try {
      const result = await clientStorage.listClients({
        search: searchQuery,
        sortBy,
        sortDir,
      });
      setClients(result);
    } catch (error) {
      Alert.alert('Error', 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, sortBy, sortDir]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (searchTimer) clearTimeout(searchTimer);
    const timer = setTimeout(() => {
      loadClients();
    }, 250);
    setSearchTimer(timer);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const handleAddClient = () => {
    setEditingClient(null);
    setShowForm(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleSaveClient = async (input: any) => {
    try {
      if (editingClient) {
        await clientStorage.updateClient(editingClient.id, input);
      } else {
        await clientStorage.createClient(input);
      }
      setShowForm(false);
      loadClients();
      Alert.alert('Success', 'Client saved successfully');
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteClient = (client: Client) => {
    setClientToDelete(client);
    setDeleteModalVisible(true);
  };

  const handleSessionComplete = (updatedClient: Client) => {
    setClients(prevClients =>
      prevClients.map(c => c.id === updatedClient.id ? updatedClient : c)
    );
  };

  const toggleClientExpanded = (clientId: string) => {
    setExpandedClient(prev => prev === clientId ? null : clientId);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;

    try {
      await clientStorage.deleteClient(clientToDelete.id);
      setDeleteModalVisible(false);
      setClientToDelete(null);
      loadClients();
      Alert.alert('Success', 'Client deleted successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete client');
    }
  };

  const getFullName = (client: Client): string => {
    if (client.displayName) return client.displayName;
    const name = `${client.firstName || ''} ${client.lastName || ''}`.trim();
    return name || 'Unnamed Client';
  };

  const getRenewalStatus = (client: Client): { text: string; color: string } => {
    const remaining = client.package.sessionsRemaining;
    if (remaining === 0) return { text: 'Renew now', color: '#ff3b30' };
    if (remaining <= 3) return { text: `Low: ${remaining} left`, color: '#ff9500' };
    return { text: `${remaining} sessions`, color: Colors[colorScheme ?? 'light'].text };
  };

  const renderClientItem = ({ item }: { item: Client }) => {
    const status = getRenewalStatus(item);
    const isExpanded = expandedClient === item.id;

    return (
      <View>
        <TouchableOpacity
          style={styles.clientCard}
          onPress={() => toggleClientExpanded(item.id)}
          activeOpacity={0.7}
        >
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{getFullName(item)}</Text>
          <View style={styles.clientDetails}>
            {item.email && (
              <Text style={styles.detailText}>
                <Ionicons name="mail-outline" size={12} color={Colors[colorScheme ?? 'light'].tabIconDefault} /> {item.email}
              </Text>
            )}
            {item.phone && (
              <Text style={styles.detailText}>
                <Ionicons name="call-outline" size={12} color={Colors[colorScheme ?? 'light'].tabIconDefault} /> {formatPhone(item.phone)}
              </Text>
            )}
          </View>
          <View style={styles.sessionInfo}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
            {item.package.packageName && (
              <Text style={styles.packageText}>{item.package.packageName}</Text>
            )}
          </View>
          {item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handleEditClient(item)} style={styles.actionButton}>
            <Ionicons name="create-outline" size={20} color={Colors[colorScheme ?? 'light'].tint} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteClient(item)} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={20} color="#ff3b30" />
          </TouchableOpacity>
        </View>
        </TouchableOpacity>
        {isExpanded && (
          <CompleteSession
            client={item}
            onSessionComplete={handleSessionComplete}
          />
        )}
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
    },
    header: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme ?? 'light'].tabIconDefault + '30',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f2f2f7',
      borderRadius: 10,
      paddingHorizontal: 10,
      marginBottom: 15,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 10,
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].text,
    },
    sortContainer: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 15,
    },
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 15,
      backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f2f2f7',
    },
    sortButtonActive: {
      backgroundColor: Colors[colorScheme ?? 'light'].tint,
    },
    sortButtonText: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].text,
      marginLeft: 4,
    },
    sortButtonTextActive: {
      color: '#fff',
    },
    addButton: {
      backgroundColor: Colors[colorScheme ?? 'light'].tint,
      padding: 15,
      borderRadius: 10,
      alignItems: 'center',
    },
    addButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    listContainer: {
      flex: 1,
      padding: 20,
    },
    clientCard: {
      flexDirection: 'row',
      backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff',
      borderRadius: 10,
      padding: 15,
      marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    clientInfo: {
      flex: 1,
    },
    clientName: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 5,
    },
    clientDetails: {
      marginBottom: 5,
    },
    detailText: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      marginBottom: 2,
    },
    sessionInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 5,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
    },
    packageText: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 5,
      marginTop: 8,
    },
    tag: {
      backgroundColor: Colors[colorScheme ?? 'light'].tint + '20',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    tagText: {
      fontSize: 10,
      color: Colors[colorScheme ?? 'light'].tint,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    actionButton: {
      padding: 5,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyText: {
      fontSize: 18,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      marginBottom: 20,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderRadius: 10,
      padding: 20,
      width: '80%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 10,
    },
    modalText: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 20,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 10,
    },
    modalButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault,
    },
    deleteButton: {
      backgroundColor: '#ff3b30',
    },
    modalButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  if (showForm) {
    return (
      <ClientForm
        client={editingClient}
        onSave={handleSaveClient}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors[colorScheme ?? 'light'].tabIconDefault} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, phone, or tags..."
            placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
            onPress={() => handleSort('name')}
          >
            <Ionicons
              name={sortBy === 'name' && sortDir === 'desc' ? 'arrow-down' : 'arrow-up'}
              size={12}
              color={sortBy === 'name' ? '#fff' : Colors[colorScheme ?? 'light'].text}
            />
            <Text style={[styles.sortButtonText, sortBy === 'name' && styles.sortButtonTextActive]}>
              Name
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'updatedAt' && styles.sortButtonActive]}
            onPress={() => handleSort('updatedAt')}
          >
            <Ionicons
              name={sortBy === 'updatedAt' && sortDir === 'desc' ? 'arrow-down' : 'arrow-up'}
              size={12}
              color={sortBy === 'updatedAt' ? '#fff' : Colors[colorScheme ?? 'light'].text}
            />
            <Text style={[styles.sortButtonText, sortBy === 'updatedAt' && styles.sortButtonTextActive]}>
              Updated
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'sessionsRemaining' && styles.sortButtonActive]}
            onPress={() => handleSort('sessionsRemaining')}
          >
            <Ionicons
              name={sortBy === 'sessionsRemaining' && sortDir === 'desc' ? 'arrow-down' : 'arrow-up'}
              size={12}
              color={sortBy === 'sessionsRemaining' ? '#fff' : Colors[colorScheme ?? 'light'].text}
            />
            <Text style={[styles.sortButtonText, sortBy === 'sessionsRemaining' && styles.sortButtonTextActive]}>
              Sessions
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddClient}>
          <Text style={styles.addButtonText}>Add Client</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        </View>
      ) : clients.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No clients found' : 'No clients yet'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity style={styles.addButton} onPress={handleAddClient}>
              <Text style={styles.addButtonText}>Add your first client</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          renderItem={renderClientItem}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Client?</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete {clientToDelete ? getFullName(clientToDelete) : 'this client'}? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.modalButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}