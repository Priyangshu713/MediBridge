
import { useState, useEffect } from 'react';
import { Doctor } from '@/types/doctor';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';

export function useDoctorDetails(doctorId: string | undefined) {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchDoctorDetails = async () => {
      if (!doctorId) {
        setIsLoading(false);
        setError(new Error('Doctor ID is required'));
        return;
      }

      setIsLoading(true);

      try {
        // Fetch all doctors and find the one with the matching ID
        const response = await fetch(`${API_URL}/auth/getAlldoctor`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch doctors');
        }

        const data = await response.json();
        const allDoctors: Doctor[] = data.allDoctor || [];
        const foundDoctor = allDoctors.find(d => d._id === doctorId);

        if (foundDoctor) {
          setDoctor(foundDoctor);
        } else {
          setError(new Error('Doctor not found'));
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching doctor details:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    };

    fetchDoctorDetails();
  }, [doctorId]);

  return {
    doctor,
    isLoading,
    error
  };
}
