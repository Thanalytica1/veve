import React, { useCallback, useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import CalendarComponent, { Session } from '../../components/Calendar';
import { Client } from '../../types/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toUTCISO, toLocal, dateKey } from '../../lib/date';
import { clientStorage } from '../../storage/clientStorage';

const SESSIONS_KEY = 'calendar_sessions';

export default function CalendarScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Load sessions from storage
  const loadSessions = useCallback(
    async ({
      startISO,
      endISO,
      filters,
    }: {
      startISO: string;
      endISO: string;
      filters?: any;
    }): Promise<Session[]> => {
      try {
        const stored = await AsyncStorage.getItem(SESSIONS_KEY);
        const allSessions: Session[] = stored ? JSON.parse(stored) : [];

        // Filter by date range
        const startDate = new Date(startISO);
        const endDate = new Date(endISO);

        const filtered = allSessions.filter((session) => {
          const sessionStart = new Date(session.startISO);
          return sessionStart >= startDate && sessionStart <= endDate;
        });

        // Apply additional filters
        if (filters?.status?.length > 0) {
          return filtered.filter((s) => filters.status.includes(s.status));
        }

        if (filters?.clientId) {
          return filtered.filter((s) => s.clientId === filters.clientId);
        }

        return filtered;
      } catch (error) {
        console.error('Failed to load sessions:', error);
        return [];
      }
    },
    []
  );

  // Load clients from storage
  const loadClients = useCallback(async (): Promise<Client[]> => {
    try {
      return await clientStorage.listClients();
    } catch (error) {
      console.error('Failed to load clients:', error);
      return [];
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadClients().then(setClients);
    // Load all sessions for caching
    AsyncStorage.getItem(SESSIONS_KEY).then((stored) => {
      if (stored) setSessions(JSON.parse(stored));
    });
  }, [loadClients]);

  // Handle session press
  const handleSessionPress = useCallback(
    (session: Session) => {
      // Navigate to session detail or edit screen
      console.log('Session pressed:', session);
      // You can implement navigation to a session detail screen here
    },
    []
  );

  // Create new session(s)
  const handleCreateSession = useCallback(
    async (sessionData: Omit<Session, 'id'> | Omit<Session, 'id'>[]) => {
      try {
        const sessionsToCreate = Array.isArray(sessionData) ? sessionData : [sessionData];
        const newSessions = sessionsToCreate.map((data) => ({
          ...data,
          id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        }));

        const updatedSessions = [...sessions, ...newSessions];
        setSessions(updatedSessions);
        await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updatedSessions));
      } catch (error) {
        console.error('Failed to create session:', error);
        throw error;
      }
    },
    [sessions]
  );

  // Edit session
  const handleEditSession = useCallback(
    async (updatedSession: Session) => {
      try {
        const updatedSessions = sessions.map((s) =>
          s.id === updatedSession.id ? updatedSession : s
        );
        setSessions(updatedSessions);
        await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updatedSessions));
      } catch (error) {
        console.error('Failed to edit session:', error);
        throw error;
      }
    },
    [sessions]
  );

  // Reschedule session
  const handleRescheduleSession = useCallback(
    async (session: Session) => {
      // Implement rescheduling logic
      // This could open a modal or navigate to a rescheduling screen
      console.log('Reschedule session:', session);
    },
    []
  );

  // Delete session
  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      try {
        const updatedSessions = sessions.filter((s) => s.id !== sessionId);
        setSessions(updatedSessions);
        await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updatedSessions));
      } catch (error) {
        console.error('Failed to delete session:', error);
        throw error;
      }
    },
    [sessions]
  );

  return (
    <View style={styles.container}>
      <CalendarComponent
        initialDate={params.date}
        loadSessions={loadSessions}
        loadClients={loadClients}
        onSessionPress={handleSessionPress}
        onCreateSession={handleCreateSession}
        onEditSession={handleEditSession}
        onRescheduleSession={handleRescheduleSession}
        onDeleteSession={handleDeleteSession}
        featureFlags={{
          showRenewalBadges: true,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});