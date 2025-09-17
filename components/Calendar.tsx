import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Switch,
  StyleSheet,
} from 'react-native';
import { Calendar as RNCalendar, DateData } from 'react-native-calendars';
import {
  toUTCISO,
  toLocal,
  dateKey,
  nearestHalfHour,
  getMonthRange,
  dateRangesOverlap,
  formatTime,
  formatDateRange,
  addMinutes,
  isToday,
  isPast,
  getWeeklyRepeatDates,
} from '../lib/date';
import { Client } from '../types/client';

export interface Session {
  id: string;
  clientId: string;
  clientName?: string;
  date: string; // YYYY-MM-DD in local time
  startISO: string; // UTC ISO
  endISO: string; // UTC ISO
  status: 'booked' | 'completed' | 'cancelled' | 'no-show';
  location?: string;
  notes?: string;
  recurring?: boolean;
}


export interface CalendarProps {
  initialDate?: string;
  defaultFilters?: Partial<SessionFilters>;
  loadSessions: (params: {
    startISO: string;
    endISO: string;
    filters?: SessionFilters;
  }) => Promise<Session[]>;
  loadClients?: () => Promise<Client[]>;
  onSessionPress?: (session: Session) => void;
  onCreateSession?: (session: Omit<Session, 'id'> | Omit<Session, 'id'>[]) => Promise<void>;
  onEditSession?: (session: Session) => Promise<void>;
  onRescheduleSession?: (session: Session) => Promise<void>;
  onDeleteSession?: (sessionId: string) => Promise<void>;
  onMonthChange?: (month: DateData) => void;
  onDateChange?: (date: string) => void;
  readOnly?: boolean;
  featureFlags?: {
    showRenewalBadges?: boolean;
  };
}

interface SessionFilters {
  status?: Session['status'][];
  clientId?: string;
}

interface MarkedDate {
  selected?: boolean;
  marked?: boolean;
  selectedColor?: string;
  dotColor?: string;
  today?: boolean;
}

interface CreateSessionFormData {
  clientId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: Session['status'];
  location: string;
  notes: string;
  repeatWeekly: boolean;
  repeatWeeks: number;
}

const STATUS_COLORS = {
  booked: '#4CAF50',
  completed: '#2196F3',
  cancelled: '#FF5252',
  'no-show': '#FFA726',
};

export const CalendarComponent: React.FC<CalendarProps> = ({
  initialDate,
  defaultFilters = {},
  loadSessions,
  loadClients,
  onSessionPress,
  onCreateSession,
  onEditSession,
  onRescheduleSession,
  onDeleteSession,
  onMonthChange,
  onDateChange,
  readOnly = false,
  featureFlags = {},
}) => {
  const today = dateKey(new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => {
    if (initialDate) {
      const date = new Date(initialDate);
      return { year: date.getFullYear(), month: date.getMonth() + 1 };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  const [selectedDate, setSelectedDate] = useState(initialDate || today);
  const [sessionsByDate, setSessionsByDate] = useState<Record<string, Session[]>>({});
  const [filters, setFilters] = useState<SessionFilters>(defaultFilters);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateSessionFormData>({
    clientId: '',
    date: selectedDate,
    startTime: '',
    endTime: '',
    duration: 60,
    status: 'booked',
    location: '',
    notes: '',
    repeatWeekly: false,
    repeatWeeks: 1,
  });

  const cachedMonths = useRef<Set<string>>(new Set());

  // Load clients
  useEffect(() => {
    if (loadClients) {
      loadClients().then(setClients).catch(console.error);
    }
  }, [loadClients]);

  // Fetch sessions for a month
  const fetchMonth = useCallback(
    async (year: number, month: number, withPadding = true) => {
      const monthKey = `${year}-${month}`;
      if (cachedMonths.current.has(monthKey)) {
        return;
      }

      const range = getMonthRange(year, month, withPadding ? 2 : 0);
      try {
        const sessions = await loadSessions({
          startISO: range.startISO,
          endISO: range.endISO,
          filters,
        });

        const grouped = sessions.reduce((acc, session) => {
          const key = session.date;
          if (!acc[key]) acc[key] = [];
          acc[key].push(session);
          return acc;
        }, {} as Record<string, Session[]>);

        setSessionsByDate((prev) => ({ ...prev, ...grouped }));
        cachedMonths.current.add(monthKey);
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
        setError('Failed to load sessions');
      }
    },
    [loadSessions, filters]
  );

  // Initial load and month changes
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetchMonth(visibleMonth.year, visibleMonth.month),
      // Prefetch adjacent months
      fetchMonth(visibleMonth.year, visibleMonth.month - 1, false),
      fetchMonth(visibleMonth.year, visibleMonth.month + 1, false),
    ])
      .then(() => setIsLoading(false))
      .catch(() => setIsLoading(false));
  }, [visibleMonth, fetchMonth]);

  // Handle date selection
  const handleDayPress = useCallback(
    (day: DateData) => {
      setSelectedDate(day.dateString);
      onDateChange?.(day.dateString);
    },
    [onDateChange]
  );

  // Handle month change
  const handleMonthChange = useCallback(
    (month: DateData) => {
      setVisibleMonth({ year: month.year, month: month.month });
      onMonthChange?.(month);
    },
    [onMonthChange]
  );

  // Compute marked dates
  const markedDates = useMemo(() => {
    const marked: Record<string, MarkedDate> = {};

    // Mark today
    marked[today] = { today: true };

    // Mark selected date
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#2196F3',
      };
    }

    // Mark dates with sessions
    Object.keys(sessionsByDate).forEach((date) => {
      if (sessionsByDate[date].length > 0) {
        marked[date] = {
          ...marked[date],
          marked: true,
          dotColor: '#4CAF50',
        };
      }
    });

    return marked;
  }, [selectedDate, sessionsByDate, today]);

  // Get sessions for selected date
  const selectedSessions = useMemo(() => {
    if (!selectedDate) return [];
    const sessions = sessionsByDate[selectedDate] || [];
    return sessions.sort((a, b) => {
      const startA = new Date(a.startISO).getTime();
      const startB = new Date(b.startISO).getTime();
      return startA - startB;
    });
  }, [selectedDate, sessionsByDate]);

  // Check for conflicts
  const checkConflicts = useCallback(
    (startDate: Date, endDate: Date, excludeId?: string): Session[] => {
      const dateStr = dateKey(startDate);
      const sessions = sessionsByDate[dateStr] || [];

      return sessions.filter((session) => {
        if (session.id === excludeId) return false;
        const sessionStart = toLocal(session.startISO);
        const sessionEnd = toLocal(session.endISO);
        return dateRangesOverlap(startDate, endDate, sessionStart, sessionEnd);
      });
    },
    [sessionsByDate]
  );

  // Handle create session
  const handleCreateSession = useCallback(async () => {
    if (!onCreateSession) return;

    const date = new Date(createForm.date);
    const [startHour, startMin] = createForm.startTime.split(':').map(Number);
    const [endHour, endMin] = createForm.endTime.split(':').map(Number);

    const startDate = new Date(date);
    startDate.setHours(startHour, startMin, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(endHour, endMin, 0, 0);

    // Validation
    if (!createForm.clientId) {
      Alert.alert('Error', 'Please select a client or add clients first');
      return;
    }

    if (startDate >= endDate) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    if (isPast(startDate) && !readOnly) {
      Alert.alert('Warning', 'This session is in the past. Continue?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => proceedWithCreate() },
      ]);
      return;
    }

    proceedWithCreate();

    async function proceedWithCreate() {
      // Check for conflicts
      const conflicts = checkConflicts(startDate, endDate);
      if (conflicts.length > 0) {
        Alert.alert(
          'Schedule Conflict',
          `This time conflicts with ${conflicts.length} existing session(s)`,
          [
            { text: 'View Conflict', onPress: () => onSessionPress?.(conflicts[0]) },
            { text: 'Pick Different Time', style: 'cancel' },
            { text: 'Override', onPress: () => createSessions() },
          ]
        );
        return;
      }

      createSessions();
    }

    async function createSessions() {
      try {
        const client = clients.find((c) => c.id === createForm.clientId);
        const baseSession = {
          clientId: createForm.clientId,
          clientName: client?.displayName || `${client?.firstName || ''} ${client?.lastName || ''}`.trim(),
          date: createForm.date,
          startISO: toUTCISO(startDate),
          endISO: toUTCISO(endDate),
          status: createForm.status,
          location: createForm.location || undefined,
          notes: createForm.notes || undefined,
        };

        if (createForm.repeatWeekly && createForm.repeatWeeks > 0) {
          const repeatDates = getWeeklyRepeatDates(startDate, createForm.repeatWeeks);
          const sessions = repeatDates.map((date) => ({
            ...baseSession,
            date: dateKey(date),
            startISO: toUTCISO(new Date(date.setHours(startHour, startMin, 0, 0))),
            endISO: toUTCISO(new Date(date.setHours(endHour, endMin, 0, 0))),
            recurring: true,
          }));
          if (onCreateSession) await onCreateSession(sessions);
        } else {
          if (onCreateSession) await onCreateSession(baseSession);
        }

        // Refresh the current month
        cachedMonths.current.delete(`${visibleMonth.year}-${visibleMonth.month}`);
        await fetchMonth(visibleMonth.year, visibleMonth.month);

        setShowCreateModal(false);
        resetCreateForm();
      } catch (err) {
        Alert.alert('Error', 'Failed to create session');
      }
    }
  }, [createForm, clients, onCreateSession, checkConflicts, readOnly, visibleMonth, fetchMonth]);

  // Reset create form
  const resetCreateForm = useCallback(() => {
    const nextHalfHour = nearestHalfHour();
    setCreateForm({
      clientId: '',
      date: selectedDate,
      startTime: `${nextHalfHour.getHours().toString().padStart(2, '0')}:${nextHalfHour
        .getMinutes()
        .toString()
        .padStart(2, '0')}`,
      endTime: `${addMinutes(nextHalfHour, 60)
        .getHours()
        .toString()
        .padStart(2, '0')}:${addMinutes(nextHalfHour, 60)
        .getMinutes()
        .toString()
        .padStart(2, '0')}`,
      duration: 60,
      status: 'booked',
      location: '',
      notes: '',
      repeatWeekly: false,
      repeatWeeks: 1,
    });
  }, [selectedDate]);

  // Handle add session button
  const handleAddSession = useCallback(() => {
    resetCreateForm();
    setShowCreateModal(true);
  }, [resetCreateForm]);

  return (
    <View style={styles.container}>
      {/* Calendar Grid */}
      <RNCalendar
        current={`${visibleMonth.year}-${String(visibleMonth.month).padStart(2, '0')}-01`}
        markedDates={markedDates}
        onDayPress={handleDayPress}
        onMonthChange={handleMonthChange}
        theme={{
          todayTextColor: '#2196F3',
          selectedDayBackgroundColor: '#2196F3',
          selectedDayTextColor: '#ffffff',
          dotColor: '#4CAF50',
        }}
      />

      {/* Day Agenda */}
      <ScrollView style={styles.agenda}>
        <View style={styles.agendaHeader}>
          <Text style={styles.agendaTitle}>
            {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          {!readOnly && (
            <TouchableOpacity style={styles.addButton} onPress={handleAddSession}>
              <Text style={styles.addButtonText}>+ Add Session</Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <ActivityIndicator style={styles.loader} />
        ) : selectedSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No sessions scheduled</Text>
          </View>
        ) : (
          selectedSessions.map((session) => (
            <TouchableOpacity
              key={session.id}
              style={styles.sessionCard}
              onPress={() => onSessionPress?.(session)}
            >
              <View style={styles.sessionTime}>
                <Text style={styles.sessionTimeText}>
                  {formatDateRange(toLocal(session.startISO), toLocal(session.endISO))}
                </Text>
              </View>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionClient}>{session.clientName}</Text>
                {session.location && (
                  <Text style={styles.sessionLocation}>{session.location}</Text>
                )}
              </View>
              <View
                style={[styles.statusPill, { backgroundColor: STATUS_COLORS[session.status] }]}
              >
                <Text style={styles.statusPillText}>{session.status}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Create Session Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Session</Text>

            {/* Client Selection */}
            <Text style={styles.label}>Client *</Text>
            <View style={styles.pickerContainer}>
              {clients.length === 0 ? (
                <Text style={styles.noClientsText}>No clients available. Please add clients first in the Clients tab.</Text>
              ) : (
                clients.map((client) => (
                  <TouchableOpacity
                    key={client.id}
                    style={[
                      styles.pickerOption,
                      createForm.clientId === client.id && styles.pickerOptionSelected,
                    ]}
                    onPress={() => setCreateForm({ ...createForm, clientId: client.id })}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        createForm.clientId === client.id && styles.pickerOptionTextSelected,
                      ]}
                    >
                      {client.displayName || `${client.firstName || ''} ${client.lastName || ''}`.trim()}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* Date */}
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              value={createForm.date}
              editable={false}
            />

            {/* Time */}
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Text style={styles.label}>Start Time *</Text>
                <TextInput
                  style={styles.input}
                  value={createForm.startTime}
                  onChangeText={(text) => setCreateForm({ ...createForm, startTime: text })}
                  placeholder="HH:MM"
                />
              </View>
              <View style={styles.timeField}>
                <Text style={styles.label}>End Time *</Text>
                <TextInput
                  style={styles.input}
                  value={createForm.endTime}
                  onChangeText={(text) => setCreateForm({ ...createForm, endTime: text })}
                  placeholder="HH:MM"
                />
              </View>
            </View>

            {/* Location */}
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={createForm.location}
              onChangeText={(text) => setCreateForm({ ...createForm, location: text })}
              placeholder="Optional"
            />

            {/* Notes */}
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={createForm.notes}
              onChangeText={(text) => setCreateForm({ ...createForm, notes: text })}
              placeholder="Optional"
              multiline
              numberOfLines={3}
            />

            {/* Repeat Weekly */}
            <View style={styles.switchRow}>
              <Text style={styles.label}>Repeat Weekly</Text>
              <Switch
                value={createForm.repeatWeekly}
                onValueChange={(value) => setCreateForm({ ...createForm, repeatWeekly: value })}
              />
            </View>

            {createForm.repeatWeekly && (
              <View>
                <Text style={styles.label}>Number of Weeks</Text>
                <TextInput
                  style={styles.input}
                  value={String(createForm.repeatWeeks)}
                  onChangeText={(text) =>
                    setCreateForm({ ...createForm, repeatWeeks: parseInt(text) || 1 })
                  }
                  keyboardType="numeric"
                />
              </View>
            )}

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleCreateSession}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  agenda: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 16,
  },
  agendaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  agendaTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  loader: {
    marginTop: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  emptyStateCTA: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyStateCTAText: {
    color: 'white',
    fontWeight: '600',
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sessionTime: {
    width: 100,
  },
  sessionTimeText: {
    fontSize: 14,
    color: '#666',
  },
  sessionInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  sessionClient: {
    fontSize: 16,
    fontWeight: '500',
  },
  sessionLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  noClientsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    padding: 16,
    textAlign: 'center',
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
  },
  pickerOptionSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  pickerOptionText: {
    color: '#333',
  },
  pickerOptionTextSelected: {
    color: 'white',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  timeField: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});

export default CalendarComponent;