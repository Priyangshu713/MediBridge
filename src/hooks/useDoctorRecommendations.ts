
import { useEffect, useState } from 'react';
import axios from 'axios';
import { HealthData } from '../types/health';
import { Doctor } from '../types/doctor';
import { sampleDoctors } from '../data/sampleDoctors';
import { useHealthStore } from '../store/healthStore';

interface DoctorFilters {
  specialty: string;
  location: string;
  experience: number;
}

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';

export function useDoctorRecommendations(filters: DoctorFilters) {
  const { healthData, geminiApiKey, geminiModel } = useHealthStore();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [recommendedDoctors, setRecommendedDoctors] = useState<Doctor[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get all doctors with filters
  useEffect(() => {
    const fetchDoctors = async () => {
      setIsLoadingDoctors(true);
      try {
        // Simulate API call delay
        const response = await fetch(`${API_URL}/auth/getAlldoctor`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        console.log(data.allDoctor);

        // Apply filters to sample doctors
        let getAllDoctors = JSON.stringify(data.allDoctor);

        localStorage.setItem('allDoctor', getAllDoctors);
        let filteredDoctors = JSON.parse(localStorage.getItem("allDoctor"));

        if (filters.specialty) {
          filteredDoctors = filteredDoctors.filter(doctor =>
            doctor.specialty.toLowerCase() === filters.specialty.toLowerCase() ||
            doctor.subspecialties?.some(sub =>
              sub.toLowerCase().includes(filters.specialty.toLowerCase())
            )
          );
        }

        if (filters.location) {
          filteredDoctors = filteredDoctors.filter(doctor =>
            doctor.location.toLowerCase().includes(filters.location.toLowerCase()) ||
            doctor.hospital.toLowerCase().includes(filters.location.toLowerCase())
          );
        }

        if (filters.experience > 0) {
          filteredDoctors = filteredDoctors.filter(doctor =>
            doctor.experience >= filters.experience
          );
        }

        setDoctors(filteredDoctors);
        setIsLoadingDoctors(false);
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setError(err as Error);
        setIsLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, [filters]);

  // Get personalized recommendations using Gemini
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!healthData.completedProfile) {
        setRecommendedDoctors([]);
        setIsLoadingRecommendations(false);
        return;
      }

      setIsLoadingRecommendations(true);
      try {
        // Use backend API for recommendations
        if (geminiApiKey) {
          try {
            const controller = new AbortController();
            const response = await axios.post(
              `${import.meta.env.VITE_BACKEND_URL_PROD}/doctor-recommendations`,
              {
                age: healthData.age || 0,
                gender: healthData.gender || "Not specified",
                bmi: healthData.bmi || 24,
                bmiCategory: healthData.bmiCategory || "Normal",
                bloodGlucose: healthData.bloodGlucose || 100,
                sleepScore: healthData.sleepScore || 0,
                exerciseScore: healthData.exerciseScore || 0,
                stressScore: healthData.stressScore || 0,
                hydrationScore: healthData.hydrationScore || 0,
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                },
                signal: controller.signal,
              }
            );
            controller.abort();

            // Parse doctor IDs from response and map to doctor objects
            const recommendedIds = response.data.data || [];
            if (Array.isArray(recommendedIds)) {
              const recommended = recommendedIds
                .map(id => sampleDoctors.find(doc => doc._id === id))
                .filter(Boolean) as Doctor[];
              setRecommendedDoctors(recommended.length > 0 ? recommended : getSimpleRecommendations(healthData, sampleDoctors));
            } else {
              setRecommendedDoctors(getSimpleRecommendations(healthData, sampleDoctors));
            }
          } catch (err) {
            console.error("Error fetching recommendations from backend:", err);
            // Fallback to simple recommendations
            const fallback = getSimpleRecommendations(healthData, sampleDoctors);
            setRecommendedDoctors(fallback);
          }
        } else {
          // No API key, use simple recommendations
          const simpleRecommendations = getSimpleRecommendations(healthData, sampleDoctors);
          setRecommendedDoctors(simpleRecommendations);
        }

        setIsLoadingRecommendations(false);
      } catch (err) {
        console.error('Error getting recommendations:', err);
        setError(err as Error);
        // Fallback to simple recommendations
        const fallback = getSimpleRecommendations(healthData, sampleDoctors);
        setRecommendedDoctors(fallback);
        setIsLoadingRecommendations(false);
      }
    };

    fetchRecommendations();
  }, [healthData, geminiApiKey, geminiModel]);

  return {
    doctors,
    recommendedDoctors,
    isLoadingDoctors,
    isLoadingRecommendations,
    error
  };
}

// Simple recommendation logic as fallback
function getSimpleRecommendations(healthData: any, doctors: Doctor[]): Doctor[] {
  let recommended: Doctor[] = [];

  // Based on BMI
  if (healthData.bmiCategory === 'Obese' || healthData.bmiCategory === 'Overweight') {
    const nutritionist = doctors.find(d =>
      d.specialty === 'Nutritionist' ||
      d.specialty === 'Endocrinologist'
    );
    if (nutritionist) recommended.push(nutritionist);
  }

  // Based on blood glucose
  if (healthData.bloodGlucose && healthData.bloodGlucose > 125) {
    const endocrinologist = doctors.find(d => d.specialty === 'Endocrinologist');
    if (endocrinologist && !recommended.includes(endocrinologist)) {
      recommended.push(endocrinologist);
    }
  }

  // Based on stress score
  if (healthData.stressScore && healthData.stressScore < 60) {
    const psychiatrist = doctors.find(d => d.specialty === 'Psychiatrist');
    if (psychiatrist) recommended.push(psychiatrist);
  }

  // If we don't have enough recommendations, add top-rated doctors
  if (recommended.length < 3) {
    const topRated = doctors
      .filter(d => !recommended.includes(d))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3 - recommended.length);

    recommended = [...recommended, ...topRated];
  }

  return recommended;
}
