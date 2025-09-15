import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  AccessibilityInfo,
} from 'react-native';
import { Client } from '../types/client';
import { clientStorage } from '../storage/clientStorage';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

interface CompleteSessionProps {
  client: Client;
  onSessionComplete: (updatedClient: Client) => void;
}

export default function CompleteSession({ client, onSessionComplete }: CompleteSessionProps) {
  const colorScheme = useColorScheme();
  const [saving, setSaving] = useState(false);
  const [undoInfo, setUndoInfo] = useState<{ historyEntryId: string; timeoutId: NodeJS.Timeout } | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  const getFullName = (): string => {
    if (client.displayName) return client.displayName;
    const name = `${client.firstName || ''} ${client.lastName || ''}`.trim();
    return name || 'Client';
  };

  const getLastSessionTime = (): string | null => {
    if (!client.sessionHistory || client.sessionHistory.length === 0) return null;

    const lastSession = client.sessionHistory[client.sessionHistory.length - 1];
    const date = new Date(lastSession.completedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const showToast = (message: string, isError: boolean = false) => {
    Alert.alert(
      isError ? 'Error' : 'Success',
      message,
      undoInfo && !isError ? [
        { text: 'Undo', onPress: handleUndo },
        { text: 'OK', style: 'cancel' }
      ] : [{ text: 'OK' }]
    );

    AccessibilityInfo.announceForAccessibility(message);
  };

  const handleCompleteSession = async () => {
    if (saving) return;

    if (client.package.sessionsRemaining <= 0) {
      showToast('No sessions left.', true);
      return;
    }

    setSaving(true);

    try {
      const nowISO = new Date().toISOString();
      const { updatedClient, historyEntryId } = await clientStorage.completeSession(client.id, nowISO);

      onSessionComplete(updatedClient);

      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }

      const timeoutId = setTimeout(() => {
        setUndoInfo(null);
      }, 5000);

      undoTimeoutRef.current = timeoutId;
      setUndoInfo({ historyEntryId, timeoutId });

      showToast('Session logged. 1 deducted.');
    } catch (error) {
      console.error('Error completing session:', error);
      showToast(error instanceof Error && error.message === 'No sessions left'
        ? 'No sessions left.'
        : "Couldn't save. Try again.", true);
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = async () => {
    if (!undoInfo) return;

    try {
      const { updatedClient } = await clientStorage.undoCompleteSession(client.id, undoInfo.historyEntryId);

      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }

      setUndoInfo(null);
      onSessionComplete(updatedClient);

      Alert.alert('Success', 'Restored.');
      AccessibilityInfo.announceForAccessibility('Restored.');
    } catch (error) {
      console.error('Error undoing session:', error);
      Alert.alert('Error', "Couldn't undo. Try again.");
    }
  };

  const lastSessionTime = getLastSessionTime();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#f9f9f9',
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    sessionsLeft: {
      fontSize: 18,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
    },
    sessionsCount: {
      fontSize: 24,
      fontWeight: 'bold',
      color: client.package.sessionsRemaining <= 3
        ? (client.package.sessionsRemaining === 0 ? '#ff3b30' : '#ff9500')
        : Colors[colorScheme ?? 'light'].tint,
    },
    lastSession: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      marginBottom: 12,
    },
    button: {
      backgroundColor: Colors[colorScheme ?? 'light'].tint,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
      opacity: saving || client.package.sessionsRemaining === 0 ? 0.5 : 1,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    undoButton: {
      backgroundColor: '#ff9500',
      marginTop: 8,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.sessionsLeft}>Sessions Left:</Text>
        <Text style={styles.sessionsCount}>{client.package.sessionsRemaining}</Text>
      </View>

      {lastSessionTime && (
        <Text style={styles.lastSession}>Last session: {lastSessionTime}</Text>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={handleCompleteSession}
        disabled={saving || client.package.sessionsRemaining === 0}
        accessibilityLabel={`Complete Session for ${getFullName()}`}
        accessibilityHint={`Will deduct 1 session. ${client.package.sessionsRemaining} sessions remaining.`}
      >
        <Text style={styles.buttonText}>
          {saving ? 'Saving...' : 'Complete Session'}
        </Text>
      </TouchableOpacity>

      {undoInfo && (
        <TouchableOpacity
          style={[styles.button, styles.undoButton]}
          onPress={handleUndo}
          accessibilityLabel="Undo last session completion"
        >
          <Text style={styles.buttonText}>Undo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}