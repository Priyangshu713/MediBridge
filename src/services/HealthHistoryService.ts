import axios from 'axios';
import { HealthData, AnalysisSection } from '@/store/healthStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface HistoryEntry {
  _id?: string;
  id?: string; // For backward compatibility with local storage
  userId: string;
  date: string;
  healthData: HealthData;
  analysis?: AnalysisSection[];
  timeOfDay?: string;
  dayOfWeek?: string;
}

export const saveHealthHistory = async (
  userId: string,
  healthData: HealthData,
  analysis?: AnalysisSection[]
): Promise<HistoryEntry | null> => {
  try {
    const now = new Date();
    const timeOfDay = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });

    const response = await axios.post(`${API_BASE_URL}/api/save-history`, {
      userId,
      healthData,
      analysis,
      timeOfDay,
      dayOfWeek
    });

    if (response.data && response.data.success) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error('Error saving health history:', error);
    return null;
  }
};

export const getHealthHistory = async (userId: string): Promise<HistoryEntry[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/get-history/${userId}`);
    if (response.data && response.data.success) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching health history:', error);
    return [];
  }
};
