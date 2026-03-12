
import { useState, useEffect } from 'react';
import { Doctor } from '@/types/doctor';
import { dispatchAuthEvent } from '@/App';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';

export function useDoctorAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return localStorage.getItem('isDoctorAuthenticated') === 'true';
    });

    const [currentDoctor, setCurrentDoctor] = useState<Doctor | null>(() => {
        const doctorId = localStorage.getItem('doctorId');
        const storedProfile = localStorage.getItem('doctorProfile');
        if (doctorId && storedProfile) {
            try {
                const doctorProfile = JSON.parse(storedProfile);
                if (doctorId === doctorProfile?._id) {
                    return doctorProfile;
                }
            } catch {
                return null;
            }
        }
        return null;
    });

    useEffect(() => {
        const checkAuth = () => {
            const isAuth = localStorage.getItem('isDoctorAuthenticated') === 'true';
            setIsAuthenticated(isAuth);

            if (isAuth) {
                const storedProfile = localStorage.getItem('doctorProfile');
                if (storedProfile) {
                    try {
                        setCurrentDoctor(JSON.parse(storedProfile));
                    } catch {
                        setCurrentDoctor(null);
                    }
                }
            } else {
                setCurrentDoctor(null);
            }
        };

        checkAuth();

        window.addEventListener('storage', checkAuth);
        window.addEventListener('doctorAuthChanged', checkAuth);

        return () => {
            window.removeEventListener('storage', checkAuth);
            window.removeEventListener('doctorAuthChanged', checkAuth);
        };
    }, []);

    const loginDoctor = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await fetch(`${API_URL}/auth/loginDoctor`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                return { success: false, message: errorData.message || 'Login failed' };
            }

            const data = await response.json();
            const doctor = data.doctor;

            localStorage.setItem('isDoctorAuthenticated', 'true');
            localStorage.setItem('doctorId', doctor._id);
            localStorage.setItem('doctorProfile', JSON.stringify(doctor));
            localStorage.setItem('doctorToken', data.token);

            setIsAuthenticated(true);
            setCurrentDoctor(doctor);

            const event = new CustomEvent('doctorAuthChanged', { detail: { isAuthenticated: true, doctor } });
            window.dispatchEvent(event);

            return { success: true, message: 'Login successful!' };
        } catch (error) {
            console.error('Error during doctor login:', error);
            return { success: false, message: 'An error occurred during login. Please check your connection.' };
        }
    };

    const logoutDoctor = (): void => {
        localStorage.removeItem('isDoctorAuthenticated');
        localStorage.removeItem('doctorId');
        localStorage.removeItem('doctorProfile');
        localStorage.removeItem('doctorToken');

        setIsAuthenticated(false);
        setCurrentDoctor(null);

        const event = new CustomEvent('doctorAuthChanged', { detail: { isAuthenticated: false, doctor: null } });
        window.dispatchEvent(event);
    };

    const updateDoctorProfile = async (updatedDoctor: Partial<Doctor>): Promise<{ success: boolean; message: string }> => {
        if (!currentDoctor) {
            return { success: false, message: 'Not authenticated as a doctor.' };
        }

        try {
            const response = await fetch(`${API_URL}/auth/updateDoctorProfile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    doctorId: currentDoctor._id,
                    ...updatedDoctor,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                return { success: false, message: errorData.message || 'Failed to update profile.' };
            }

            const data = await response.json();
            const updated = data.doctor;

            // Persist the updated profile to localStorage
            localStorage.setItem('doctorProfile', JSON.stringify(updated));
            setCurrentDoctor(updated);

            return { success: true, message: 'Profile updated successfully!' };
        } catch (error) {
            console.error('Error updating doctor profile:', error);
            return { success: false, message: 'An error occurred while updating profile.' };
        }
    };

    return {
        isAuthenticated,
        currentDoctor,
        loginDoctor,
        logoutDoctor,
        updateDoctorProfile
    };
}
