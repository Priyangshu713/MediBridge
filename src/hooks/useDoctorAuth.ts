
import { useState, useEffect, useCallback } from 'react';
import { Doctor, mapSupabaseDoctorRow } from '@/types/doctor';
import { supabase } from '@/lib/supabase';

export function useDoctorAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentDoctor, setCurrentDoctor] = useState<Doctor | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch the doctor profile from the doctors table for a given auth user
    const fetchDoctorProfile = useCallback(async (authUserId: string): Promise<Doctor | null> => {
        const { data, error } = await supabase
            .from('doctors')
            .select('*')
            .eq('auth_user_id', authUserId)
            .maybeSingle();

        if (error) {
            console.error('Error fetching doctor profile:', error);
            return null;
        }
        
        if (!data) {
            return null; // Not a doctor
        }

        return mapSupabaseDoctorRow(data);
    }, []);

    // Listen for auth state changes
    useEffect(() => {
        // Check current session on mount
        const initAuth = async () => {
            setIsLoading(true);
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                const doctor = await fetchDoctorProfile(session.user.id);
                if (doctor) {
                    setIsAuthenticated(true);
                    setCurrentDoctor(doctor);
                    localStorage.setItem('isDoctorAuthenticated', 'true');
                    localStorage.setItem('doctorProfile', JSON.stringify(doctor));
                } else {
                    setIsAuthenticated(false);
                    setCurrentDoctor(null);
                }
            } else {
                setIsAuthenticated(false);
                setCurrentDoctor(null);
            }
            setIsLoading(false);
        };

        initAuth();

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                const doctor = await fetchDoctorProfile(session.user.id);
                if (doctor) {
                    setIsAuthenticated(true);
                    setCurrentDoctor(doctor);
                    localStorage.setItem('isDoctorAuthenticated', 'true');
                    localStorage.setItem('doctorProfile', JSON.stringify(doctor));
                }
            } else if (event === 'SIGNED_OUT') {
                setIsAuthenticated(false);
                setCurrentDoctor(null);
                localStorage.removeItem('isDoctorAuthenticated');
                localStorage.removeItem('doctorProfile');
            }

            // Dispatch custom event for other components that listen
            const customEvent = new CustomEvent('doctorAuthChanged', {
                detail: { isAuthenticated: event === 'SIGNED_IN', doctor: currentDoctor }
            });
            window.dispatchEvent(customEvent);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [fetchDoctorProfile]);

    const loginDoctor = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                // Handle the specific "Email not confirmed" error
                if (error.message.includes('Email not confirmed')) {
                     return {
                         success: false,
                         message: 'Email not confirmed. Please check your inbox for the confirmation link, or disable "Confirm email" in your Supabase Auth settings (Authentication -> Providers -> Email).'
                     };
                }
                return { success: false, message: error.message };
            }

            if (!data.user) {
                return { success: false, message: 'Invalid credentials' };
            }

            // Immediately check the doctor's table for the approval status
            const doctor = await fetchDoctorProfile(data.user.id);

            if (doctor && doctor.is_approved === false) {
                // Instantly sign them out from Supabase because they are not approved
                await supabase.auth.signOut();
                return { success: false, message: 'Your account is pending admin approval. You cannot log in yet.' };
            }

            if (doctor) {
                setIsAuthenticated(true);
                setCurrentDoctor(doctor);
                localStorage.setItem('isDoctorAuthenticated', 'true');
                localStorage.setItem('doctorProfile', JSON.stringify(doctor));
                return { success: true, message: 'Login successful' };
            } else {
                // User exists in auth but not in doctors table, or doctor profile not found
                await supabase.auth.signOut(); // Sign out the auth user as they don't have a valid doctor profile
                return { success: false, message: 'Doctor profile not found or not registered as a doctor.' };
            }
        } catch (error) {
            console.error('Error during doctor login:', error);
            return { success: false, message: 'An error occurred during login. Please check your connection.' };
        }
    };

    const logoutDoctor = async (): Promise<void> => {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        setCurrentDoctor(null);
        localStorage.removeItem('isDoctorAuthenticated');
        localStorage.removeItem('doctorProfile');
        localStorage.removeItem('doctorId');
        localStorage.removeItem('doctorToken');

        const event = new CustomEvent('doctorAuthChanged', { detail: { isAuthenticated: false, doctor: null } });
        window.dispatchEvent(event);
    };

    const updateDoctorProfile = async (updatedDoctor: Partial<Doctor>): Promise<{ success: boolean; message: string }> => {
        if (!currentDoctor) {
            return { success: false, message: 'Not authenticated as a doctor.' };
        }

        try {
            // Map frontend field names to Supabase column names
            const updateData: Record<string, any> = {};
            if (updatedDoctor.firstName !== undefined) updateData.first_name = updatedDoctor.firstName;
            if (updatedDoctor.lastName !== undefined) updateData.last_name = updatedDoctor.lastName;
            if (updatedDoctor.specialty !== undefined) updateData.specialty = updatedDoctor.specialty;
            if (updatedDoctor.hospital !== undefined) updateData.hospital = updatedDoctor.hospital;
            if (updatedDoctor.location !== undefined) updateData.location = updatedDoctor.location;
            if (updatedDoctor.experience !== undefined) updateData.experience = updatedDoctor.experience;
            if (updatedDoctor.bio !== undefined) updateData.bio = updatedDoctor.bio;
            if (updatedDoctor.subspecialties !== undefined) updateData.subspecialties = updatedDoctor.subspecialties;
            if (updatedDoctor.education !== undefined) updateData.education = updatedDoctor.education;
            if (updatedDoctor.certifications !== undefined) updateData.certifications = updatedDoctor.certifications;
            if (updatedDoctor.specializations !== undefined) updateData.specializations = updatedDoctor.specializations;

            // Handle nested contactInfo → flat columns
            if (updatedDoctor.contactInfo) {
                if (updatedDoctor.contactInfo.email !== undefined) updateData.contact_email = updatedDoctor.contactInfo.email;
                if (updatedDoctor.contactInfo.phone !== undefined) updateData.contact_phone = updatedDoctor.contactInfo.phone;
            }

            // Handle nested availability → flat columns
            if (updatedDoctor.availability) {
                if (updatedDoctor.availability.days !== undefined) updateData.availability_days = updatedDoctor.availability.days;
                if (updatedDoctor.availability.hours !== undefined) updateData.availability_hours = updatedDoctor.availability.hours;
            }

            updateData.updated_at = new Date().toISOString();

            const { data, error } = await supabase
                .from('doctors')
                .update(updateData)
                .eq('id', currentDoctor.id)
                .select()
                .single();

            if (error) {
                console.error('Error updating doctor profile:', error);
                return { success: false, message: error.message || 'Failed to update profile.' };
            }

            const updated = mapSupabaseDoctorRow(data);
            setCurrentDoctor(updated);
            localStorage.setItem('doctorProfile', JSON.stringify(updated));

            return { success: true, message: 'Profile updated successfully!' };
        } catch (error) {
            console.error('Error updating doctor profile:', error);
            return { success: false, message: 'An error occurred while updating profile.' };
        }
    };

    const registerDoctor = async (doctorData: any): Promise<{ success: boolean; message: string }> => {
        try {
            // 1. Create auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: doctorData.email,
                password: doctorData.password,
            });

            if (authError) {
                return { success: false, message: authError.message };
            }

            if (!authData.user) {
                return { success: false, message: 'Registration failed. Please try again.' };
            }

            // If identities array is empty, it means the user already exists and Supabase 
            // returned a fake success to prevent email enumeration.
            if (authData.user.identities && authData.user.identities.length === 0) {
                return { success: false, message: 'This email is already registered. Please go to the Login tab.' };
            }

            // 2. Insert doctor profile into doctors table
            const { error: insertError } = await supabase
                .from('doctors')
                .insert({
                    auth_user_id: authData.user.id,
                    first_name: doctorData.firstName,
                    last_name: doctorData.lastName,
                    email: doctorData.email,
                    specialty: doctorData.specialty || '',
                    hospital: doctorData.hospital || '',
                    location: doctorData.location || '',
                    experience: doctorData.experience || 0,
                    bio: doctorData.bio || '',
                    contact_email: doctorData.contactInfo?.email || doctorData.email,
                    contact_phone: doctorData.contactInfo?.phone || '',
                    availability_days: doctorData.availability?.days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                    availability_hours: doctorData.availability?.hours || '9:00 AM - 5:00 PM',
                    rating: 0,
                    review_count: 0,
                    patients: 0,
                    is_approved: false, // Explicitly set to false (though default is false anyway)
                    proof_document: doctorData.proofOfQualification || '',
                });

            if (insertError) {
                console.error('Error inserting doctor profile:', insertError);
                return { success: false, message: insertError.message || 'Failed to create doctor profile.' };
            }

            // Immediately log them out after signup because they need admin approval
            await supabase.auth.signOut();
            setIsAuthenticated(false);
            setCurrentDoctor(null);
            localStorage.removeItem('isDoctorAuthenticated');
            localStorage.removeItem('doctorProfile');

            return { success: true, message: 'Registration successful! Your account is pending admin approval.' };
        } catch (error) {
            console.error('Error during doctor registration:', error);
            return { success: false, message: 'An error occurred during registration. Please check your connection.' };
        }
    };

    return {
        isAuthenticated,
        currentDoctor,
        isLoading,
        loginDoctor,
        logoutDoctor,
        updateDoctorProfile,
        registerDoctor
    };
}
