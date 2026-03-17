import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

export interface WellnessEntryData {
  _id?: string;
  userId: string;
  entry: string;
  analysis: string;
  moodScore: number;
  emotions: string[];
  stressLevel: number;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Save a new wellness journal entry to the server.
 */
export const saveWellnessEntryToServer = async (
  userId: string,
  entry: string,
  analysis: string,
  moodScore: number,
  emotions: string[],
  stressLevel: number,
  date?: string
): Promise<WellnessEntryData | null> => {
  try {
    const response = await axios.post(`${BACKEND_URL}/wellness/save`, {
      userId,
      entry,
      analysis,
      moodScore,
      emotions,
      stressLevel,
      date: date || new Date().toISOString()
    });
    if (response.data?.success) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error('Error saving wellness entry:', error);
    return null;
  }
};

/**
 * Load all wellness entries for a user from the server.
 */
export const loadWellnessEntries = async (
  userId: string
): Promise<WellnessEntryData[]> => {
  try {
    const response = await axios.get(`${BACKEND_URL}/wellness/${encodeURIComponent(userId)}`);
    if (response.data?.success) {
      return response.data.data || [];
    }
    return [];
  } catch (error) {
    console.error('Error loading wellness entries:', error);
    return [];
  }
};

/**
 * Delete a wellness entry by its ID.
 */
export const deleteWellnessEntryFromServer = async (id: string): Promise<boolean> => {
  try {
    const response = await axios.delete(`${BACKEND_URL}/wellness/${id}`);
    return response.data?.success ?? false;
  } catch (error) {
    console.error('Error deleting wellness entry:', error);
    return false;
  }
};
