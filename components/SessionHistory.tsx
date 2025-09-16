import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SectionList,
} from 'react-native';
import { Client, SessionHistoryEntry } from '../types/client';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

interface SessionHistoryProps {
  client: Client;
  onCompleteSession?: () => void;
}

interface GroupedSession {
  title: string;
  data: EnhancedSessionEntry[];
}

interface EnhancedSessionEntry extends SessionHistoryEntry {
  date: Date;
  relativeTime: string;
  absoluteTime: string;
  dayOfWeek: string;
  timeSincePrevious: string | null;
  sessionsRemainingAfter: number;
  isFirstOfDay: boolean;
  isLastOfDay: boolean;
  sessionNumber: number;
}

interface SessionPattern {
  averageFrequency: string;
  mostCommonDay: string;
  longestGap: string;
  consistency: 'Regular' | 'Sporadic' | 'Declining' | 'Improving';
  streakInfo: string;
}

export default function SessionHistory({ client, onCompleteSession }: SessionHistoryProps) {
  const colorScheme = useColorScheme();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Today', 'This week']));
  const [showAllSessions, setShowAllSessions] = useState(false);

  const enhanceSessionData = (sessions: SessionHistoryEntry[]): EnhancedSessionEntry[] => {
    const sortedSessions = [...sessions].sort((a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

    return sortedSessions.map((session, index) => {
      const date = new Date(session.completedAt);
      const prevSession = sortedSessions[index + 1];
      const sessionsRemainingAfter = client.package.totalSessions - (sortedSessions.length - index);

      const timeSincePrevious = prevSession
        ? formatTimeDifference(date, new Date(prevSession.completedAt))
        : null;

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const isFirstOfDay = !sortedSessions.some((s, i) =>
        i > index &&
        new Date(s.completedAt) >= dayStart &&
        new Date(s.completedAt) <= dayEnd
      );

      const isLastOfDay = !sortedSessions.some((s, i) =>
        i < index &&
        new Date(s.completedAt) >= dayStart &&
        new Date(s.completedAt) <= dayEnd
      );

      return {
        ...session,
        date,
        relativeTime: formatRelativeTime(date),
        absoluteTime: formatAbsoluteTime(date),
        dayOfWeek: formatDayOfWeek(date),
        timeSincePrevious,
        sessionsRemainingAfter,
        isFirstOfDay,
        isLastOfDay,
        sessionNumber: sortedSessions.length - index,
      };
    });
  };

  const formatTimeDifference = (current: Date, previous: Date): string => {
    const diffMs = current.getTime() - previous.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Same day';
    if (diffDays === 1) return '1 day later';
    if (diffDays < 7) return `${diffDays} days later`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} later`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} later`;
  };

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  const formatAbsoluteTime = (date: Date): string => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDayOfWeek = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const groupSessionsByPeriod = (sessions: EnhancedSessionEntry[]): GroupedSession[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - today.getDay() * 86400000);
    const lastWeek = new Date(thisWeek.getTime() - 7 * 86400000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const groups: { [key: string]: EnhancedSessionEntry[] } = {
      'Today': [],
      'This week': [],
      'Last week': [],
      'This month': [],
      'Last month': [],
    };

    const olderGroups: { [key: string]: EnhancedSessionEntry[] } = {};

    sessions.forEach(session => {
      if (session.date >= today) {
        groups['Today'].push(session);
      } else if (session.date >= thisWeek) {
        groups['This week'].push(session);
      } else if (session.date >= lastWeek) {
        groups['Last week'].push(session);
      } else if (session.date >= thisMonth) {
        groups['This month'].push(session);
      } else if (session.date >= lastMonth) {
        groups['Last month'].push(session);
      } else {
        const monthKey = session.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (!olderGroups[monthKey]) {
          olderGroups[monthKey] = [];
        }
        olderGroups[monthKey].push(session);
      }
    });

    const result: GroupedSession[] = [];

    Object.entries(groups).forEach(([title, data]) => {
      if (data.length > 0) {
        result.push({ title, data });
      }
    });

    Object.entries(olderGroups)
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .forEach(([title, data]) => {
        result.push({ title, data });
      });

    return result;
  };

  const analyzePatterns = (sessions: EnhancedSessionEntry[]): SessionPattern | null => {
    if (sessions.length < 2) return null;

    const dayFrequencies: { [key: string]: number } = {};
    const gaps: number[] = [];
    let currentStreak = 0;
    let longestStreak = 0;
    let lastDate: Date | null = null;

    sessions.forEach((session, index) => {
      const dayName = session.dayOfWeek;
      dayFrequencies[dayName] = (dayFrequencies[dayName] || 0) + 1;

      if (lastDate) {
        const gap = Math.floor((lastDate.getTime() - session.date.getTime()) / 86400000);
        gaps.push(gap);

        if (gap <= 7) {
          currentStreak++;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }
      lastDate = session.date;
    });

    const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
    const mostCommonDay = Object.entries(dayFrequencies)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const longestGap = gaps.length > 0 ? Math.max(...gaps) : 0;

    let consistency: SessionPattern['consistency'] = 'Regular';
    if (avgGap > 14) consistency = 'Sporadic';
    else if (gaps.length > 3 && gaps.slice(0, 3).every((g, i) => i === 0 || g > gaps[i - 1])) {
      consistency = 'Declining';
    } else if (gaps.length > 3 && gaps.slice(0, 3).every((g, i) => i === 0 || g < gaps[i - 1])) {
      consistency = 'Improving';
    }

    return {
      averageFrequency: avgGap < 1 ? 'Daily' : avgGap <= 7 ? `${Math.round(avgGap)} days` : `${Math.round(avgGap / 7)} weeks`,
      mostCommonDay,
      longestGap: longestGap === 0 ? 'N/A' : `${longestGap} days`,
      consistency,
      streakInfo: longestStreak > 1 ? `Best streak: ${longestStreak} sessions` : 'No significant streaks',
    };
  };

  const enhancedSessions = useMemo(() =>
    enhanceSessionData(client.sessionHistory || []),
    [client.sessionHistory]
  );

  const groupedSessions = useMemo(() =>
    groupSessionsByPeriod(enhancedSessions),
    [enhancedSessions]
  );

  const patterns = useMemo(() =>
    analyzePatterns(enhancedSessions),
    [enhancedSessions]
  );

  const toggleSection = (title: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const renderSessionItem = (session: EnhancedSessionEntry) => {
    const isRecent = new Date().getTime() - session.date.getTime() < 3600000;

    return (
      <View key={session.id} style={styles.sessionItem}>
        <View style={styles.sessionMainInfo}>
          <View style={styles.sessionTiming}>
            <Text style={styles.sessionTime}>{session.absoluteTime}</Text>
            <Text style={styles.sessionRelative}>({session.relativeTime})</Text>
          </View>
          <View style={styles.sessionBadges}>
            <View style={[styles.badge, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }]}>
              <Text style={[styles.badgeText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                #{session.sessionNumber}
              </Text>
            </View>
            {isRecent && (
              <View style={[styles.badge, styles.recentBadge]}>
                <Text style={styles.recentBadgeText}>Recent</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.sessionMetadata}>
          <Text style={styles.metadataText}>
            {session.dayOfWeek} • {session.sessionsRemainingAfter} left after
          </Text>
          {session.timeSincePrevious && (
            <Text style={styles.gapText}>
              <Ionicons name="time-outline" size={12} /> {session.timeSincePrevious}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({ section }: { section: GroupedSession }) => {
    const isExpanded = expandedSections.has(section.title);
    const sessionCount = section.data.length;

    return (
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => toggleSection(section.title)}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeaderContent}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionHeaderRight}>
            <Text style={styles.sessionCount}>{sessionCount}</Text>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={Colors[colorScheme ?? 'light'].tabIconDefault}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const visibleSessions = showAllSessions
    ? groupedSessions
    : groupedSessions.slice(0, 3);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
    },
    header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme ?? 'light'].tabIconDefault + '20',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
    },
    patternsCard: {
      margin: 16,
      padding: 16,
      backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#f9f9f9',
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    patternsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 12,
    },
    patternRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    patternLabel: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
    },
    patternValue: {
      fontSize: 14,
      fontWeight: '500',
      color: Colors[colorScheme ?? 'light'].text,
    },
    consistencyBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      alignSelf: 'flex-start',
    },
    consistencyText: {
      fontSize: 12,
      fontWeight: '600',
    },
    sectionHeader: {
      backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f2f2f7',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    sectionHeaderContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
    },
    sectionHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sessionCount: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      backgroundColor: Colors[colorScheme ?? 'light'].tint + '20',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    sessionItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme ?? 'light'].tabIconDefault + '10',
    },
    sessionMainInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    sessionTiming: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sessionTime: {
      fontSize: 15,
      fontWeight: '500',
      color: Colors[colorScheme ?? 'light'].text,
    },
    sessionRelative: {
      fontSize: 13,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
    },
    sessionBadges: {
      flexDirection: 'row',
      gap: 8,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    recentBadge: {
      backgroundColor: '#34c759',
    },
    recentBadgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    sessionMetadata: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    metadataText: {
      fontSize: 13,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
    },
    gapText: {
      fontSize: 13,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      fontStyle: 'italic',
    },
    showMoreButton: {
      margin: 16,
      padding: 12,
      backgroundColor: Colors[colorScheme ?? 'light'].tint,
      borderRadius: 8,
      alignItems: 'center',
    },
    showMoreText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    emptyState: {
      padding: 32,
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      marginBottom: 16,
    },
    completeFirstButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      backgroundColor: Colors[colorScheme ?? 'light'].tint,
      borderRadius: 8,
    },
    completeFirstText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  if (!client.sessionHistory || client.sessionHistory.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No sessions completed yet</Text>
        {onCompleteSession && (
          <TouchableOpacity style={styles.completeFirstButton} onPress={onCompleteSession}>
            <Text style={styles.completeFirstText}>Complete First Session</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Session History</Text>
        <Text style={styles.headerSubtitle}>
          {client.sessionHistory.length} total sessions • {client.package.sessionsRemaining} remaining
        </Text>
      </View>

      {patterns && (
        <View style={styles.patternsCard}>
          <Text style={styles.patternsTitle}>
            <Ionicons name="analytics-outline" size={16} /> Attendance Patterns
          </Text>
          <View style={styles.patternRow}>
            <Text style={styles.patternLabel}>Average frequency:</Text>
            <Text style={styles.patternValue}>{patterns.averageFrequency}</Text>
          </View>
          <View style={styles.patternRow}>
            <Text style={styles.patternLabel}>Preferred day:</Text>
            <Text style={styles.patternValue}>{patterns.mostCommonDay}</Text>
          </View>
          <View style={styles.patternRow}>
            <Text style={styles.patternLabel}>Longest gap:</Text>
            <Text style={styles.patternValue}>{patterns.longestGap}</Text>
          </View>
          <View style={styles.patternRow}>
            <Text style={styles.patternLabel}>Consistency:</Text>
            <View style={[
              styles.consistencyBadge,
              {
                backgroundColor: patterns.consistency === 'Regular' ? '#34c759' :
                               patterns.consistency === 'Improving' ? '#5ac8fa' :
                               patterns.consistency === 'Declining' ? '#ff9500' : '#ff3b30'
              }
            ]}>
              <Text style={[styles.consistencyText, { color: '#fff' }]}>
                {patterns.consistency}
              </Text>
            </View>
          </View>
          <View style={styles.patternRow}>
            <Text style={styles.patternLabel}>{patterns.streakInfo}</Text>
          </View>
        </View>
      )}

      <SectionList
        sections={visibleSessions.map(section => ({
          ...section,
          data: expandedSections.has(section.title) ? section.data : []
        }))}
        renderItem={({ item }) => renderSessionItem(item)}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={item => item.id}
        stickySectionHeadersEnabled={false}
      />

      {!showAllSessions && groupedSessions.length > 3 && (
        <TouchableOpacity
          style={styles.showMoreButton}
          onPress={() => setShowAllSessions(true)}
        >
          <Text style={styles.showMoreText}>
            Show All Sessions ({client.sessionHistory.length})
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}