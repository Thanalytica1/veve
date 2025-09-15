import AsyncStorage from '@react-native-async-storage/async-storage';
import { Client, ClientInput, ListClientsParams, SessionHistoryEntry } from '../types/client';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const CLIENTS_STORAGE_KEY = '@clients';

export interface ClientStorage {
  listClients(params?: ListClientsParams): Promise<Client[]>;
  getClient(id: string): Promise<Client | null>;
  createClient(input: ClientInput): Promise<Client>;
  updateClient(id: string, input: ClientInput): Promise<Client>;
  deleteClient(id: string): Promise<boolean>;
  completeSession(clientId: string, nowISO: string): Promise<{ updatedClient: Client; historyEntryId: string }>;
  undoCompleteSession(clientId: string, historyEntryId: string): Promise<{ updatedClient: Client }>;
}

class AsyncStorageAdapter implements ClientStorage {
  private async getAllClients(): Promise<Client[]> {
    try {
      const data = await AsyncStorage.getItem(CLIENTS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading clients:', error);
      return [];
    }
  }

  private async saveClients(clients: Client[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
    } catch (error) {
      console.error('Error saving clients:', error);
      throw error;
    }
  }

  private getFullName(client: Client): string {
    if (client.displayName) return client.displayName;
    const name = `${client.firstName || ''} ${client.lastName || ''}`.trim();
    return name || 'Unnamed Client';
  }

  async listClients(params: ListClientsParams = {}): Promise<Client[]> {
    const { search = '', sortBy = 'updatedAt', sortDir = 'desc', limit, offset = 0 } = params;

    let clients = await this.getAllClients();

    if (search) {
      const searchLower = search.toLowerCase();
      clients = clients.filter(client => {
        const fullName = this.getFullName(client).toLowerCase();
        const email = (client.email || '').toLowerCase();
        const phone = (client.phone || '').toLowerCase();
        const tags = client.tags.join(' ').toLowerCase();

        return fullName.includes(searchLower) ||
               email.includes(searchLower) ||
               phone.includes(searchLower) ||
               tags.includes(searchLower);
      });
    }

    clients.sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'name':
          compareValue = this.getFullName(a).localeCompare(this.getFullName(b));
          break;
        case 'updatedAt':
          compareValue = new Date(a.dates.updatedAt).getTime() - new Date(b.dates.updatedAt).getTime();
          break;
        case 'sessionsRemaining':
          compareValue = a.package.sessionsRemaining - b.package.sessionsRemaining;
          break;
      }

      return sortDir === 'asc' ? compareValue : -compareValue;
    });

    if (limit) {
      clients = clients.slice(offset, offset + limit);
    }

    return clients;
  }

  async getClient(id: string): Promise<Client | null> {
    const clients = await this.getAllClients();
    return clients.find(c => c.id === id) || null;
  }

  async createClient(input: ClientInput): Promise<Client> {
    const now = new Date().toISOString();
    const newClient: Client = {
      id: uuidv4(),
      displayName: input.displayName || null,
      firstName: input.firstName || null,
      lastName: input.lastName || null,
      email: input.email || null,
      phone: input.phone || null,
      tags: input.tags || [],
      notes: input.notes || null,
      package: {
        packageName: input.package?.packageName || null,
        totalSessions: input.package?.totalSessions || 0,
        sessionsRemaining: Math.min(
          input.package?.sessionsRemaining || 0,
          input.package?.totalSessions || 0
        ),
        pricePerSession: input.package?.pricePerSession || 0,
      },
      dates: {
        startDate: input.dates?.startDate || null,
        endDate: input.dates?.endDate || null,
        createdAt: now,
        updatedAt: now,
      },
      sessionHistory: [],
    };

    const clients = await this.getAllClients();
    clients.push(newClient);
    await this.saveClients(clients);

    return newClient;
  }

  async updateClient(id: string, input: ClientInput): Promise<Client> {
    const clients = await this.getAllClients();
    const index = clients.findIndex(c => c.id === id);

    if (index === -1) {
      throw new Error('Client not found');
    }

    const existing = clients[index];
    const updated: Client = {
      ...existing,
      displayName: input.displayName !== undefined ? input.displayName : existing.displayName,
      firstName: input.firstName !== undefined ? input.firstName : existing.firstName,
      lastName: input.lastName !== undefined ? input.lastName : existing.lastName,
      email: input.email !== undefined ? input.email : existing.email,
      phone: input.phone !== undefined ? input.phone : existing.phone,
      tags: input.tags !== undefined ? input.tags : existing.tags,
      notes: input.notes !== undefined ? input.notes : existing.notes,
      package: {
        ...existing.package,
        ...input.package,
        sessionsRemaining: input.package?.sessionsRemaining !== undefined
          ? Math.min(input.package.sessionsRemaining, input.package?.totalSessions || existing.package.totalSessions)
          : existing.package.sessionsRemaining,
      },
      dates: {
        ...existing.dates,
        startDate: input.dates?.startDate !== undefined ? input.dates.startDate : existing.dates.startDate,
        endDate: input.dates?.endDate !== undefined ? input.dates.endDate : existing.dates.endDate,
        updatedAt: new Date().toISOString(),
      },
    };

    clients[index] = updated;
    await this.saveClients(clients);

    return updated;
  }

  async deleteClient(id: string): Promise<boolean> {
    const clients = await this.getAllClients();
    const filtered = clients.filter(c => c.id !== id);

    if (filtered.length === clients.length) {
      return false;
    }

    await this.saveClients(filtered);
    return true;
  }

  async completeSession(clientId: string, nowISO: string): Promise<{ updatedClient: Client; historyEntryId: string }> {
    const clients = await this.getAllClients();
    const index = clients.findIndex(c => c.id === clientId);

    if (index === -1) {
      throw new Error('Client not found');
    }

    const client = clients[index];

    if (client.package.sessionsRemaining <= 0) {
      throw new Error('No sessions left');
    }

    const historyEntryId = uuidv4();
    const historyEntry: SessionHistoryEntry = {
      id: historyEntryId,
      completedAt: nowISO,
    };

    const updatedClient: Client = {
      ...client,
      package: {
        ...client.package,
        sessionsRemaining: client.package.sessionsRemaining - 1,
      },
      sessionHistory: [...(client.sessionHistory || []), historyEntry],
      dates: {
        ...client.dates,
        updatedAt: new Date().toISOString(),
      },
    };

    clients[index] = updatedClient;
    await this.saveClients(clients);

    return { updatedClient, historyEntryId };
  }

  async undoCompleteSession(clientId: string, historyEntryId: string): Promise<{ updatedClient: Client }> {
    const clients = await this.getAllClients();
    const index = clients.findIndex(c => c.id === clientId);

    if (index === -1) {
      throw new Error('Client not found');
    }

    const client = clients[index];
    const historyIndex = (client.sessionHistory || []).findIndex(h => h.id === historyEntryId);

    if (historyIndex === -1) {
      return { updatedClient: client };
    }

    const updatedHistory = [...(client.sessionHistory || [])];
    updatedHistory.splice(historyIndex, 1);

    const updatedClient: Client = {
      ...client,
      package: {
        ...client.package,
        sessionsRemaining: client.package.sessionsRemaining + 1,
      },
      sessionHistory: updatedHistory,
      dates: {
        ...client.dates,
        updatedAt: new Date().toISOString(),
      },
    };

    clients[index] = updatedClient;
    await this.saveClients(clients);

    return { updatedClient };
  }
}

export const clientStorage = new AsyncStorageAdapter();