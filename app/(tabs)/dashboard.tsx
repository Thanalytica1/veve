import React from 'react';
import Dashboard from '../../components/Dashboard';
import { Client } from '../../types/client';

export default function DashboardScreen() {
  const handleClientPress = (client: Client) => {
    // TODO: Navigate to client detail or open client actions
    console.log('Client pressed:', client.id);
  };

  const handleNavigateToClients = (filters?: any) => {
    // TODO: Navigate to clients tab with filters applied
    console.log('Navigate to clients with filters:', filters);
  };

  return (
    <Dashboard
      onClientPress={handleClientPress}
      onNavigateToClients={handleNavigateToClients}
    />
  );
}