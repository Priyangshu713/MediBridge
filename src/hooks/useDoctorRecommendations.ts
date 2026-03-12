
import { useEffect, useState, useRef } from 'react';
import { Doctor, mapSupabaseDoctorRow } from '../types/doctor';
import { useHealthStore } from '../store/healthStore';
import { supabase } from '@/lib/supabase';

interface DoctorFilters {
  specialty: string;
  location: string;
  experience: number;
}

export function useDoctorRecommendations(filters: DoctorFilters) {
  const { healthData } = useHealthStore();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [recommendedDoctors, setRecommendedDoctors] = useState<Doctor[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Keep a ref to all fetched doctors for recommendations fallback
  const allDoctorsRef = useRef<Doctor[]>([]);

  // Get all doctors with filters from Supabase
  useEffect(() => {
    const fetchDoctors = async () => {
      setIsLoadingDoctors(true);
      try {
        let query = supabase.from('doctors').select('*').eq('is_approved', true);

        // Apply filters at the query level for better performance
        if (filters.specialty) {
          query = query.ilike('specialty', `%${filters.specialty}%`);
        }

        if (filters.location) {
          query = query.or(
            `location.ilike.%${filters.location}%,hospital.ilike.%${filters.location}%`
          );
        }

        if (filters.experience > 0) {
          query = query.gte('experience', filters.experience);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }

        const mappedDoctors = (data || []).map(mapSupabaseDoctorRow);

        // If no filters applied, store all doctors for recommendations
        if (!filters.specialty && !filters.location && filters.experience === 0) {
          allDoctorsRef.current = mappedDoctors;
        } else if (allDoctorsRef.current.length === 0) {
          // Also fetch all doctors for recommendations if we haven't yet
          const { data: allData } = await supabase.from('doctors').select('*').eq('is_approved', true);
          allDoctorsRef.current = (allData || []).map(mapSupabaseDoctorRow);
        }

        // Store all doctors in localStorage for legacy DoctorDetails page compat
        localStorage.setItem('allDoctor', JSON.stringify(mappedDoctors));

        setDoctors(mappedDoctors);
        setIsLoadingDoctors(false);
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setError(err as Error);
        setIsLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, [filters]);

  // Get personalized recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!healthData.completedProfile) {
        setRecommendedDoctors([]);
        setIsLoadingRecommendations(false);
        return;
      }

      setIsLoadingRecommendations(true);
      try {
        // If we don't have all doctors yet, fetch them
        if (allDoctorsRef.current.length === 0) {
          const { data } = await supabase.from('doctors').select('*');
          allDoctorsRef.current = (data || []).map(mapSupabaseDoctorRow);
        }

        const recommendations = getSimpleRecommendations(healthData, allDoctorsRef.current);
        setRecommendedDoctors(recommendations);
        setIsLoadingRecommendations(false);
      } catch (err) {
        console.error('Error getting recommendations:', err);
        setError(err as Error);
        setRecommendedDoctors([]);
        setIsLoadingRecommendations(false);
      }
    };

    fetchRecommendations();
  }, [healthData]);

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
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3 - recommended.length);

    recommended = [...recommended, ...topRated];
  }

  return recommended;
}
