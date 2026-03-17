import axios from 'axios';
import { HealthData } from '@/store/healthStore';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

export interface ServerHealthProfile {
  userId: string;
  healthData: HealthData;
  geminiTier: 'free' | 'lite' | 'pro';
  appointmentCredits: number;
  updatedAt: string;
}

/**
 * Save the user's health profile to the server for cross-device sync.
 */
export const saveHealthProfile = async (
  userId: string,
  healthData: HealthData,
  geminiTier: string,
  appointmentCredits: number
): Promise<boolean> => {
  try {
    const response = await axios.post(`${BACKEND_URL}/health-profile/save`, {
      userId,
      healthData,
      geminiTier,
      appointmentCredits
    });
    return response.data?.success ?? false;
  } catch (error) {
    console.error('Error saving health profile to server:', error);
    return false;
  }
};

/**
 * Load the user's health profile from the server.
 * Returns null if no profile exists yet.
 */
export const loadHealthProfile = async (
  userId: string
): Promise<ServerHealthProfile | null> => {
  try {
    const response = await axios.get(`${BACKEND_URL}/health-profile/${encodeURIComponent(userId)}`);
    if (response.data?.success && response.data.data) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error('Error loading health profile from server:', error);
    return null;
  }
};
