import { create } from 'zustand';
import { HealthData, AnalysisSection } from '@/store/healthStore';
import { saveHealthHistory, getHealthHistory, HistoryEntry } from '@/services/HealthHistoryService';
export type { HistoryEntry };

interface HistoryStore {
  historyEntries: HistoryEntry[];
  loading: boolean;
  addHistoryEntry: (healthData: HealthData, analysis?: AnalysisSection[]) => Promise<void>;
  fetchHistory: () => Promise<void>;
  getEntryById: (id: string) => HistoryEntry | undefined;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  historyEntries: [],
  loading: false,

  addHistoryEntry: async (healthData, analysis) => {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) return;

    set({ loading: true });
    try {
      const newEntry = await saveHealthHistory(userEmail, healthData, analysis);

      if (newEntry) {
        set((state) => ({
          historyEntries: [newEntry, ...state.historyEntries],
          loading: false
        }));
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('Failed to save history entry:', error);
      set({ loading: false });
    }
  },

  fetchHistory: async () => {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
      set({ historyEntries: [], loading: false });
      return;
    }

    set({ loading: true });
    try {
      const entries = await getHealthHistory(userEmail);
      set({ historyEntries: entries, loading: false });
    } catch (error) {
      console.error('Failed to fetch history:', error);
      set({ loading: false });
    }
  },

  getEntryById: (id) => {
    return get().historyEntries.find(entry => (entry._id === id || entry.id === id));
  },

  clearHistory: () => {
    set({ historyEntries: [] });
  }
}));
