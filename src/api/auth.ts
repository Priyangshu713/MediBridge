/**
 * Authentication API service
 * Provides methods for user authentication and profile management
 */

// import { error } from "console";

const API_URL: string = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';

/**
 * Helper function to remove an email from the deleted accounts list in localStorage
 */
const _removeFromDeletedAccounts = (email: string) => {
    if (!email) return;

    try {
        const deletedAccounts = JSON.parse(localStorage.getItem('healthconnect_deleted_accounts') || '[]');
        const updatedAccounts = deletedAccounts.filter((account: string) => account !== email);
        localStorage.setItem('healthconnect_deleted_accounts', JSON.stringify(updatedAccounts));

    } catch (error) {
        console.error('Error removing account from deleted accounts list:', error);
    }
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.name - User's name
 * @param {string} userData.email - User's email
 * @param {string} userData.password - User's password
 * @returns {Promise<Object>} User data with token
 */
export const registerUser = async (userData: { name: string; email: string; password: string }) => {
    // First, check if this email is in the deleted accounts list and remove it
    _removeFromDeletedAccounts(userData.email);

    const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
    }

    return data;
};

/**
 * Login user
 * @param {Object} credentials - User login credentials
 * @param {string} credentials.email - User's email
 * @param {string} credentials.password - User's password
 * @returns {Promise<Object>} User data with token
 */
export const loginUser = async (credentials: { email: string; password: string }) => {
    // First check if this account has been marked as deleted locally
    try {
        const deletedAccounts = JSON.parse(localStorage.getItem('healthconnect_deleted_accounts') || '[]');
        if (deletedAccounts.includes(credentials.email)) {

            throw new Error('This account has been deleted. Please create a new account to continue.');
        }
    } catch (error) {
        if ((error as Error).message.includes('deleted')) {
            throw error;
        }
        // If there's an error reading localStorage, just continue with login attempt
        console.error('Error checking deleted accounts:', error);
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        return data;
    } catch (error) {
        // If login fails with "Invalid email or password", the account exists in the database
        // but might be incorrectly marked as deleted in localStorage.
        // In this case, let's remove it from the deleted accounts to allow reactivation.
        if ((error as Error).message.includes('Invalid email or password')) {
            try {
                _removeFromDeletedAccounts(credentials.email);

            } catch (e) {
                console.error('Error cleaning up deleted accounts list:', e);
            }
        }
        throw error;
    }
};

/**
 * Get user profile
 * @returns {Promise<Object>} User profile data
 */
export const getUserProfile = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user profile');
    }

    return data;
};

/**
 * Update user profile
 * @param {Object} profileData - User profile data to update
 * @returns {Promise<Object>} Updated user profile data
 */
export const updateUserProfile = async (profileData: { name?: string; email?: string; password?: string; profileImage?: string | null }) => {
    const token = localStorage.getItem('token');

    if (!token) {
        throw new Error('No authentication token found');
    }



    try {
        // Ensure profileImage is properly set to null if we're removing it
        const dataToSend = { ...profileData };

        // Remove profileImage property if it's undefined to avoid issues
        if (profileData.profileImage === undefined) {
            delete dataToSend.profileImage;
        }

        // Standard approach for all updates including image removal
        const response = await fetch(`${API_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend),
        });

        // If we get a server error, it might be due to payload size
        if (response.status >= 500) {
            throw new Error('Server error - possibly due to payload size');
        }

        const responseData = await response.json();

        if (!response.ok) {
            console.error('API error response:', responseData);
            throw new Error(responseData.message || 'Failed to update user profile');
        }



        // If we're removing an image, force a clean update of profile in local storage
        if (profileData.profileImage === null) {
            // Try to update any cached profile data
            try {
                const existingProfile = localStorage.getItem('userProfile');
                if (existingProfile) {
                    const profileObj = JSON.parse(existingProfile);
                    profileObj.profileImage = null;
                    localStorage.setItem('userProfile', JSON.stringify(profileObj));
                }
            } catch (e) {
                console.error('Error updating cached profile:', e);
                // Non-critical error, continue
            }
        }

        return responseData;
    } catch (error) {
        console.error('Error in updateUserProfile:', error);
        throw error;
    }
};

/**
 * Request password reset
 * @param {string} email - User's email
 * @returns {Promise<Object>} Response message
 */
export const requestPasswordReset = async (email: string) => {
    const response = await fetch(`${API_URL}/password/forgot`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to request password reset');
    }

    return data;
};

/**
 * Validate reset token
 * @param {string} token - Reset token
 * @returns {Promise<Object>} Validation result
 */
export const validateResetToken = async (token: string) => {
    const response = await fetch(`${API_URL}/password/reset/${token}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Invalid or expired token');
    }

    return data;
};

/**
 * Reset password with token
 * @param {string} token - Reset token
 * @param {string} password - New password
 * @returns {Promise<Object>} Response message
 */
export const resetPassword = async (token: string, password: string) => {
    const response = await fetch(`${API_URL}/password/reset/${token}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
    }

    return data;
};

/**
 * Update user tier
 * @param {string} tier - The tier to update to (free, lite, or pro)
 * @returns {Promise<Object>} Updated user data
 */
export const updateUserTier = async (tier: 'free' | 'lite' | 'pro') => {
    const token = localStorage.getItem('token');

    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await fetch(`${API_URL}/auth/tier`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tier }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Error updating tier:', data);
            throw new Error(data.message || 'Failed to update user tier');
        }


        return data;
    } catch (error) {
        console.error('Error in updateUserTier API call:', error);
        throw error;
    }
};

/**
 * Debug function: Update user tier using debug endpoint
 * @param {string} tier - The tier to update to (free, lite, or pro)
 * @returns {Promise<Object>} Updated user data
 */
// debugUpdateUserTier has been removed for security reasons.
// Tier upgrades must go through the Razorpay payment verification flow.

/**
 * Logout user - clears local storage
 */
export const logoutUser = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('geminiTier');
    // Clear ALL subscription-related keys to prevent stale state on next login
    localStorage.removeItem('billingCycle');
    localStorage.removeItem('proTrialUsed');
    localStorage.removeItem('trialEndDate');
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export const isAuthenticated = () => {
    const isAuthInStorage = localStorage.getItem('isAuthenticated') === 'true';
    const hasToken = !!localStorage.getItem('token');

    // Also check if the account has been deleted
    try {
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail) {
            const deletedAccounts = JSON.parse(localStorage.getItem('healthconnect_deleted_accounts') || '[]');
            if (deletedAccounts.includes(userEmail)) {
                console.warn('Account marked as deleted, considering not authenticated:', userEmail);
                return false;
            }
        }
    } catch (error) {
        console.error('Error checking deleted accounts in isAuthenticated:', error);
    }

    return isAuthInStorage && hasToken;
};

/**
 * Synchronize user tier with backend
 * This ensures the database and local storage have the same tier value
 * @returns {Promise<Object>} Updated user data
 */
/**
 * Synchronize user tier — READS FROM BACKEND and writes to localStorage.
 * The backend is ALWAYS the source of truth for subscription state.
 * This also auto-expires stale subscriptions server-side.
 */
export const synchronizeTier = async (): Promise<string> => {
    const token = localStorage.getItem('token');
    if (!token) return 'free';

    try {
        const response = await fetch(`${API_URL}/payment/subscription-status`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.warn('Could not fetch subscription status from server, keeping existing tier.');
            return localStorage.getItem('geminiTier') || 'free';
        }

        const data = await response.json();
        const serverTier: string = data.tier || 'free';

        // Write the server's answer into localStorage (not the other way around!)
        localStorage.setItem('geminiTier', serverTier);
        if (data.subscription?.billingCycle) {
            localStorage.setItem('billingCycle', data.subscription.billingCycle);
        } else {
            localStorage.removeItem('billingCycle');
        }

        window.dispatchEvent(new CustomEvent('geminiTierChanged', { detail: { tier: serverTier } }));
        return serverTier;
    } catch (error) {
        console.error('Error in synchronizeTier:', error);
        return localStorage.getItem('geminiTier') || 'free';
    }
};

/**
 * Update profile image only - separate from other profile updates
 * @param {string} imageDataUrl - The image data URL to upload
 * @returns {Promise<Object>} Updated user data
 */
export const updateProfileImage = async (imageDataUrl: string) => {
    const token = localStorage.getItem('token');

    if (!token) {
        throw new Error('No authentication token found');
    }



    // Only compress further if absolutely necessary
    if (imageDataUrl.length > 80 * 1024) {

        try {
            // Create a better quality but smaller image
            const img = new Image();
            img.src = imageDataUrl;

            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('Failed to load image for final compression'));
            });

            const canvas = document.createElement('canvas');
            // Still reasonable size - 250px
            canvas.width = 250;
            canvas.height = 250 * (img.height / img.width);

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Could not get canvas context');
            }

            // High quality rendering
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Better quality (20%)
            imageDataUrl = canvas.toDataURL('image/jpeg', 0.2);

        } catch (e) {
            console.error('Error performing final optimization:', e);
            // Continue with the original image since this is just a safety step
        }
    }

    try {
        // Try to prevent any unnecessary data in the request
        const response = await fetch(`${API_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                profileImage: imageDataUrl
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API error response:', errorData);
            throw new Error(errorData.message || 'Failed to update profile image');
        }

        const data = await response.json();

        return data;
    } catch (error) {
        console.error('Error in updateProfileImage:', error);
        throw error;
    }
};

/**
 * Delete user account
 * @param {string} password - User's current password for verification
 * @returns {Promise<Object>} Response message
 */
export const deleteUserAccount = async (password: string) => {
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail');

    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await fetch(`${API_URL}/auth/account`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to delete account');
        }

        // Set deletion markers
        _markAccountAsDeleted(userEmail);

        // Clear all local storage items
        logoutUser();
        return data;
    } catch (error) {
        console.error('Error deleting account:', error);
        throw error;
    }
};

/**
 * Helper function to mark an account as deleted in localStorage
 * This prevents re-login even though the account still exists on the backend
 */
const _markAccountAsDeleted = (email: string | null) => {
    if (!email) return;

    try {
        // Get existing deleted accounts list
        const deletedAccounts = JSON.parse(localStorage.getItem('healthconnect_deleted_accounts') || '[]');

        // Add this email to the list if not already there
        if (!deletedAccounts.includes(email)) {
            deletedAccounts.push(email);
        }

        // Save back to localStorage
        localStorage.setItem('healthconnect_deleted_accounts', JSON.stringify(deletedAccounts));


    } catch (error) {
        console.error('Error marking account as deleted:', error);
    }
};

/**
 * Get the list of deleted accounts from localStorage
 * @returns {string[]} Array of deleted account emails
 */
export const getDeletedAccounts = (): string[] => {
    try {
        return JSON.parse(localStorage.getItem('healthconnect_deleted_accounts') || '[]');
    } catch (error) {
        console.error('Error reading deleted accounts:', error);
        return [];
    }
};

/**
 * Reset the deleted accounts list in localStorage
 * This is a utility function that can be used to help users who are having issues with account recovery
 */
export const resetDeletedAccountsList = (): void => {
    try {
        localStorage.setItem('healthconnect_deleted_accounts', '[]');
        console.log('Deleted accounts list has been reset');
    } catch (error) {
        console.error('Error resetting deleted accounts list:', error);
    }
};





// Razorpay global declaration for TypeScript
declare global {
    interface Window {
        Razorpay: any;
    }
}

// Load Razorpay script
const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};



// payment gateway integration
export const initiatePayment = async (amount: number, duration: string, plan: string, billingCycle: string = 'monthly') => {

    // Ensure Razorpay script is loaded
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
        throw new Error('Failed to load Razorpay script');
    }

    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }
    let isDuration: number = 0;
    if (!duration) {
        isDuration = 1; // Default to 1 month if duration is not provided
    } else if (duration === 'yearly') {
        isDuration = 365; // Set to 12 months for yearly subscription
    } else if (duration === 'monthly') {
        isDuration = 30; // Set to 1 month for monthly subscription
    } else if (duration === 'weekly') {
        isDuration = 7; // Set to 1 week for weekly subscription    
    } else if (duration === '3months') {
        isDuration = 90; // Set to 3 months for 3 months subscription
    } else if (duration === '6months' || duration === 'sixMonths') {
        isDuration = 180; // Set to 6 months for 6 months subscription
    }

    try {
        const OrderItem = {
            amount: amount,
            duration: isDuration,
            plan: plan,
            billingCycle: billingCycle
        }
        const response = await fetch(`${API_URL}/payment/create-order`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(OrderItem),
        });

        // check if the response is ok
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error creating order:', errorData);
            throw new Error(errorData.message || 'Failed to create payment order');
        }
        const orderData = await response.json();
        // console.log("order responce is : -",response);
        // console.log('Order created successfully:', orderData);
        // console.log('Order details:', orderData.order);

        const { order, paymentId, subscriptionId, isSubscription } = orderData;

        // Initialize Razorpay payment
        // Do NOT put amount/currency here globally; Subscriptions reject it.
        const options: any = {
            key: import.meta.env.VITE_RAZORPAY_KEY, // Your Razorpay key
            name: 'MediBridge',
            handler: async (response: any) => {
                // Fetch the absolute newest token right before verifying to avoid closure staleness
                const currentToken = localStorage.getItem('token');

                // Handle successful payment
                try {
                    const paymentResponse = await fetch(`${API_URL}/payment/verify-payment`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${currentToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            razorpay_subscription_id: response.razorpay_subscription_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            paymentId: paymentId,
                            subscriptionId: subscriptionId
                        }),
                    });

                    if (!paymentResponse.ok) {
                        const errorData = await paymentResponse.json();
                        console.error('Error verifying payment:', errorData);
                        throw new Error(errorData.message || 'Failed to verify payment');
                    }

                    const paymentData = await paymentResponse.json();
                    console.log('Payment verification response:', paymentData.success);

                    // check if the payment is successful
                    if (paymentData.success) {
                        // Update user tier in local storage
                        const tier = paymentData.tier;
                        localStorage.setItem('geminiTier', tier);
                        localStorage.setItem('billingCycle', billingCycle);

                        // Fire event so UI updates immediately
                        window.dispatchEvent(new CustomEvent('geminiTierChanged', {
                            detail: { tier }
                        }));
                        // Reload to reflect changes
                        window.location.reload();

                    }

                } catch (error) {
                    console.error('Error in payment handler:', error);
                    alert('Payment verification failed. Please try again.');
                }
            },
        };

        if (isSubscription) {
            options.subscription_id = order.id;
            options.description = 'Subscription Auto-Pay';
        } else {
            options.order_id = order.id;
            options.amount = order.amount;
            options.currency = order.currency;
            options.description = 'Plan Upgrade';
            options.notes = {
                duration: isDuration,
                plan: plan,
            };
            options.prefill = {
                name: 'MediBridge User',
                email: localStorage.getItem('userEmail') || '',
                contact: localStorage.getItem('userPhone') || '',
            };
        }
        console.log('--- RAZORPAY CHECKOUT OPTIONS DUMP ---', JSON.parse(JSON.stringify(options)));

        const razorpay = new window.Razorpay(options);

        // Razorpay's Sandbox servers are currently throwing 500 Internal Errors for /v1/standard_checkout
        // We add a try-catch, and if it fails to open (or throws synchronously), we warn the user.
        try {
            razorpay.open();
        } catch (e) {
            console.error("Razorpay widget failed to open:", e);
        }

    } catch (error) {
        console.error('Error initiating payment:', error);
    }
};
/**
 * Cancel a subscription
 * @param {string} password - User's current password for verification
 * @param {string[]} reasons - Reasons selected by the user for cancellation
 * @returns {Promise<Object>} Response message
 */
export const cancelSubscription = async (password: string, reasons: string[]) => {
    const token = localStorage.getItem('token');

    if (!token) {

        throw new Error('No authentication token found');
    }

    try {
        const response = await fetch(`${API_URL}/payment/cancel-subscription`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password: password, reasons: reasons }),
        });

        // Attempt to parse JSON only if the server indicates JSON in Content-Type
        const contentType = response.headers.get('content-type') || '';
        let parsedBody: any = null;
        if (contentType.includes('application/json')) {
            try {
                parsedBody = await response.json();
            } catch (parseErr) {
                console.error('Failed to parse JSON response when cancelling subscription:', parseErr);
            }
        } else {
            // For non-JSON payloads (e.g. HTML error pages), read as text for debugging
            parsedBody = await response.text();
        }

        if (!response.ok) {
            console.error('Error cancelling subscription:', parsedBody);
            let errorMessage: string;
            if (response.status === 404) {
                errorMessage = 'Subscription cancellation is currently unavailable. Please contact support.';
            } else {
                errorMessage = parsedBody?.message || (typeof parsedBody === 'string' ? parsedBody : null) || 'Failed to cancel subscription';
            }
            throw new Error(errorMessage);
        }
        localStorage.setItem('geminiTier', 'free');
        localStorage.removeItem('billingCycle');
        localStorage.removeItem('trialEndDate');

        window.dispatchEvent(new CustomEvent('geminiTierChanged', {
            detail: { tier: 'free' }
        }));

        return parsedBody;
    } catch (error) {
        console.error('Error in cancelSubscription API call:', error);
        throw error;
    }
};

/**
 * Get the current active subscription status from the backend
 * @returns {Promise<Object>} Subscription status data
 */
export const getSubscriptionStatus = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
        return { success: true, tier: 'free', subscription: null };
    }

    try {
        const response = await fetch(`${API_URL}/payment/subscription-status`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Failed to fetch subscription status');
            return { success: true, tier: 'free', subscription: null };
        }

        const data = await response.json();

        // Sync local storage with backend truth
        if (data.success && data.tier) {
            const currentTier = localStorage.getItem('geminiTier');
            if (currentTier !== data.tier && data.tier !== undefined) {
                localStorage.setItem('geminiTier', data.tier);
                window.dispatchEvent(new CustomEvent('geminiTierChanged', {
                    detail: { tier: data.tier }
                }));
            }

            if (data.subscription?.billingCycle) {
                localStorage.setItem('billingCycle', data.subscription.billingCycle);
            }
        }

        return data;
    } catch (error) {
        console.error('Error fetching subscription status:', error);
        return { success: true, tier: 'free', subscription: null };
    }
};

/**
 * Get subscription details
 * @returns {Promise<Object>} Subscription details
 */
export const getSubscriptionDetails = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/auth/subscription`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch subscription details');
    }

    return data;
};

/**
 * Login or Register user via Google OAuth
 * @param {string} credential - Google JWT Token
 * @returns {Promise<Object>} User data with token
 */
export const loginWithGoogle = async (credential: string) => {
    const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Google Login failed');
    }

    return data;
};

/**
 * Start a 3-day free Pro trial — enforced on the server (one trial per user lifetime).
 * @returns {Promise<Object>} Subscription data including tier and endDate
 */
export const startTrialOnServer = async (): Promise<{
    success: boolean;
    tier: string;
    trialAlreadyUsed?: boolean;
    message?: string;
    subscription?: { plan: string; billingCycle: string; endDate: string; daysLeft: number };
}> => {
    const token = localStorage.getItem('token');

    if (!token) {
        throw new Error('No authentication token found. Please log in first.');
    }

    const response = await fetch(`${API_URL}/payment/start-trial`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        // Return structured error so UI can handle it gracefully
        return {
            success: false,
            tier: localStorage.getItem('geminiTier') || 'free',
            trialAlreadyUsed: data.trialAlreadyUsed || false,
            message: data.message || 'Failed to start trial',
        };
    }

    // Server confirmed trial started — sync localStorage
    localStorage.setItem('geminiTier', data.tier || 'pro');
    localStorage.setItem('billingCycle', 'trial');
    localStorage.setItem('proTrialUsed', 'true');
    if (data.subscription?.endDate) {
        localStorage.setItem('trialEndDate', data.subscription.endDate);
    }

    window.dispatchEvent(new CustomEvent('geminiTierChanged', { detail: { tier: data.tier } }));

    return data;
};

/**
 * Create a ₹300 Razorpay appointment order (Lite users) or confirm directly (Pro users).
 */
export const createAppointmentOrder = async (doctorId: string, appointmentDate: Date, doctorName: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Please log in first');

    const response = await fetch(`${API_URL}/payment/create-appointment-order`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ doctorId, appointmentDate: appointmentDate.toISOString(), doctorName }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create appointment order');
    return data;
};

/**
 * Verify the Razorpay payment signature and confirm the appointment in the database.
 */
export const verifyAppointmentPayment = async (
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    appointmentId: string,
) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Please log in first');

    const response = await fetch(`${API_URL}/payment/verify-appointment-payment`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ razorpayOrderId, razorpayPaymentId, razorpaySignature, appointmentId }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Payment verification failed');
    return data;
};
