
import { useState, useEffect } from 'react';
import { Doctor, mapSupabaseDoctorRow } from '@/types/doctor';
import { supabase } from '@/lib/supabase';

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
        const { data, error: fetchError } = await supabase
          .from('doctors')
          .select('*')
          .eq('id', doctorId)
          .eq('is_approved', true)
          .maybeSingle();

        if (fetchError) {
          throw fetchError;
        }

        if (data) {
          setDoctor(mapSupabaseDoctorRow(data));
        } else {
          setError(new Error('Doctor not found or not yet approved'));
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
