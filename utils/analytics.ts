import { Client, SessionHistoryEntry } from '../types/client';

export interface ClientAnalytics {
  daysSinceLast: number | null;
  avgPerWeek: number;
  daysToZero: number | null;
  atRiskRenewal: boolean;
  inactive14: boolean;
  projectable: boolean;
}

export interface DashboardKPIs {
  activeClients: number;
  sessionsCompleted: number;
  avgPerWeekMean: number;
  avgPerWeekMedian: number;
  percentInactive: number;
  atRiskCount: number;
  medianDaysToZero: number | null;
}

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

export interface DashboardFilters {
  dateRange: DateRange;
  tags: string[];
  status: 'all' | 'active' | 'paused' | 'archived';
  riskLevel: 'all' | 'at-risk' | 'inactive' | 'unprojectable';
}

const ANALYSIS_WINDOW_DAYS = 56; // 8 weeks

export const getLocalMidnight = (date: Date): Date => {
  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);
  return midnight;
};

export const getDateRanges = (): { [key: string]: DateRange } => {
  const now = new Date();
  const today = getLocalMidnight(now);

  return {
    '7d': {
      start: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
      end: today,
      label: '7 days'
    },
    '30d': {
      start: new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000),
      end: today,
      label: '30 days'
    },
    '8w': {
      start: new Date(today.getTime() - 55 * 24 * 60 * 60 * 1000),
      end: today,
      label: '8 weeks'
    }
  };
};

export const analyzeClient = (client: Client): ClientAnalytics => {
  const now = new Date();
  const windowStart = new Date(now.getTime() - ANALYSIS_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  // Get sessions in analysis window
  const sessionsInWindow = (client.sessionHistory || []).filter(session => {
    const sessionDate = new Date(session.completedAt);
    return sessionDate >= windowStart && sessionDate <= now;
  });

  // Calculate avgPerWeek
  const avgPerWeek = sessionsInWindow.length / 8; // 8 weeks
  const projectable = avgPerWeek > 0;

  // Calculate days since last session
  let daysSinceLast: number | null = null;
  if (client.sessionHistory && client.sessionHistory.length > 0) {
    const lastSession = client.sessionHistory[client.sessionHistory.length - 1];
    const lastDate = new Date(lastSession.completedAt);
    daysSinceLast = Math.floor((now.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000));
  }

  // Calculate days to zero
  let daysToZero: number | null = null;
  if (projectable && client.package.sessionsRemaining > 0) {
    daysToZero = Math.ceil((client.package.sessionsRemaining / avgPerWeek) * 7);
  }

  // Determine flags
  const inactive14 = daysSinceLast !== null && daysSinceLast >= 14;
  const atRiskRenewal = client.package.sessionsRemaining <= 3 && client.package.sessionsRemaining > 0;

  return {
    daysSinceLast,
    avgPerWeek: Math.round(avgPerWeek * 10) / 10, // 1 decimal place
    daysToZero,
    atRiskRenewal,
    inactive14,
    projectable
  };
};

export const calculateDashboardKPIs = (
  clients: Client[],
  filters: DashboardFilters
): DashboardKPIs => {
  // Filter clients based on current filters
  const filteredClients = clients.filter(client => {
    // Tag filter
    if (filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag =>
        client.tags.includes(tag)
      );
      if (!hasMatchingTag) return false;
    }

    // Risk level filter
    if (filters.riskLevel !== 'all') {
      const analytics = analyzeClient(client);
      switch (filters.riskLevel) {
        case 'at-risk':
          if (!analytics.atRiskRenewal) return false;
          break;
        case 'inactive':
          if (!analytics.inactive14) return false;
          break;
        case 'unprojectable':
          if (analytics.projectable) return false;
          break;
      }
    }

    return true;
  });

  // Calculate sessions completed in date range
  const sessionsCompleted = filteredClients.reduce((total, client) => {
    const sessionsInRange = (client.sessionHistory || []).filter(session => {
      const sessionDate = new Date(session.completedAt);
      return sessionDate >= filters.dateRange.start && sessionDate <= filters.dateRange.end;
    });
    return total + sessionsInRange.length;
  }, 0);

  // Analyze all clients
  const analytics = filteredClients.map(analyzeClient);

  // Calculate aggregates
  const activeClients = filteredClients.length;
  const inactiveCount = analytics.filter(a => a.inactive14).length;
  const atRiskCount = analytics.filter(a => a.atRiskRenewal).length;

  // Calculate avg per week stats
  const avgPerWeekValues = analytics.map(a => a.avgPerWeek);
  const avgPerWeekMean = avgPerWeekValues.length > 0
    ? Math.round((avgPerWeekValues.reduce((sum, val) => sum + val, 0) / avgPerWeekValues.length) * 10) / 10
    : 0;

  const sortedAvg = [...avgPerWeekValues].sort((a, b) => a - b);
  const avgPerWeekMedian = sortedAvg.length > 0
    ? sortedAvg.length % 2 === 0
      ? Math.round(((sortedAvg[sortedAvg.length / 2 - 1] + sortedAvg[sortedAvg.length / 2]) / 2) * 10) / 10
      : Math.round(sortedAvg[Math.floor(sortedAvg.length / 2)] * 10) / 10
    : 0;

  const percentInactive = activeClients > 0
    ? Math.round((inactiveCount / activeClients) * 100)
    : 0;

  // Calculate median days to zero for projectable clients
  const projectableDaysToZero = analytics
    .filter(a => a.projectable && a.daysToZero !== null)
    .map(a => a.daysToZero!)
    .sort((a, b) => a - b);

  const medianDaysToZero = projectableDaysToZero.length > 0
    ? projectableDaysToZero.length % 2 === 0
      ? Math.round((projectableDaysToZero[projectableDaysToZero.length / 2 - 1] +
                   projectableDaysToZero[projectableDaysToZero.length / 2]) / 2)
      : projectableDaysToZero[Math.floor(projectableDaysToZero.length / 2)]
    : null;

  return {
    activeClients,
    sessionsCompleted,
    avgPerWeekMean,
    avgPerWeekMedian,
    percentInactive,
    atRiskCount,
    medianDaysToZero
  };
};

export const getWeeklySessionCounts = (
  clients: Client[],
  filters: DashboardFilters
): number[] => {
  const now = new Date();
  const weeks: number[] = [];

  // Get last 8 weeks
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - (i * 7 + 6) * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    weekStart.setHours(0, 0, 0, 0);
    weekEnd.setHours(23, 59, 59, 999);

    const weekSessions = clients.reduce((total, client) => {
      const sessionsInWeek = (client.sessionHistory || []).filter(session => {
        const sessionDate = new Date(session.completedAt);
        return sessionDate >= weekStart && sessionDate <= weekEnd;
      });
      return total + sessionsInWeek.length;
    }, 0);

    weeks.push(weekSessions);
  }

  return weeks;
};

export const getRenewalQueue = (clients: Client[]): Client[] => {
  return clients
    .filter(client => {
      const analytics = analyzeClient(client);
      return analytics.atRiskRenewal;
    })
    .sort((a, b) => {
      // Sort by sessions remaining (lowest first), then by days to zero
      if (a.package.sessionsRemaining !== b.package.sessionsRemaining) {
        return a.package.sessionsRemaining - b.package.sessionsRemaining;
      }
      const aAnalytics = analyzeClient(a);
      const bAnalytics = analyzeClient(b);
      if (aAnalytics.daysToZero && bAnalytics.daysToZero) {
        return aAnalytics.daysToZero - bAnalytics.daysToZero;
      }
      return 0;
    });
};

export const getInactiveQueue = (clients: Client[]): Client[] => {
  return clients
    .filter(client => {
      const analytics = analyzeClient(client);
      return analytics.inactive14;
    })
    .sort((a, b) => {
      // Sort by days since last (highest first)
      const aAnalytics = analyzeClient(a);
      const bAnalytics = analyzeClient(b);
      if (aAnalytics.daysSinceLast && bAnalytics.daysSinceLast) {
        return bAnalytics.daysSinceLast - aAnalytics.daysSinceLast;
      }
      return 0;
    });
};