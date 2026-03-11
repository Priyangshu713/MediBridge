import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { User, Upload, X, Camera, Zap, AlertTriangle, CheckCircle, ShieldCheck, Crown, CreditCard, Info } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { getUserProfile, updateUserProfile, synchronizeTier, updateProfileImage, deleteUserAccount, cancelSubscription, getSubscriptionStatus } from '@/api/auth';
import { useHealthStore, GeminiTier } from '@/store/healthStore';
import SubscriptionPlansDialog from '@/components/common/SubscriptionPlansDialog';

// Form schema
const profileSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters long' }),
});

interface AccountSettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

type ProfileData = {
    name: string;
    email: string;
    tier: 'free' | 'lite' | 'pro';
    profileImage?: string;
    createdAt: string;
};

const AccountSettings: React.FC<AccountSettingsProps> = ({ isOpen, onClose }) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSynchronizing, setIsSynchronizing] = useState(false);
    const { geminiTier } = useHealthStore();

    // States for deletion flow
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDeleteWarning, setShowDeleteWarning] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const [showPaymentDetails, setShowPaymentDetails] = useState(false);

    // States for payment management flow
    const [paymentStep, setPaymentStep] = useState<'details' | 'cancel-warning' | 'cancel-offer' | 'cancel'>('details');
    const [cancelReasons, setCancelReasons] = useState<string[]>([]);
    const [cancelPassword, setCancelPassword] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelError, setCancelError] = useState('');
    const [showPlansDialog, setShowPlansDialog] = useState(false);
    const [subscriptionDetails, setSubscriptionDetails] = useState<{ amount: number; currency: string; endDate: string; daysLeft: number } | null>(null);

    // ----- Options for subscription management -----
    const reasonOptions = [
        'Too expensive',
        'Not using the service enough',
        'Found a better alternative',
        'Temporary financial reasons',
        'Other',
    ] as const;

    // Form setup
    const form = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: '',
        },
    });

    // Fetch user profile data
    useEffect(() => {
        if (isOpen) {
            fetchProfileData();
        }
    }, [isOpen]);

    // Reset payment flow states whenever the payment dialog is opened or profile data changes
    useEffect(() => {
        if (showPaymentDetails) {
            setPaymentStep('details');
            // Fetch latest subscription details
            (async () => {
                try {
                    const response = await getSubscriptionStatus();
                    if (response.success && response.subscription) {
                        setSubscriptionDetails(response.subscription);
                    } else {
                        setSubscriptionDetails(null);
                    }

                    // If backend downgraded to free, update local tier
                    if (response.tier && response.tier !== profileData?.tier) {
                        setProfileData(prev => prev ? { ...prev, tier: response.tier } : prev);
                        localStorage.setItem('geminiTier', response.tier);
                    }
                } catch {
                    setSubscriptionDetails(null);
                }
            })();
            setCancelReasons([]);
            setCancelPassword('');
            setCancelError('');
        }
    }, [showPaymentDetails, profileData]);

    const fetchProfileData = async () => {
        setIsLoading(true);
        try {
            // First, try to synchronize the tier
            await synchronizeTierWithBackend();

            const data = await getUserProfile();
            setProfileData({
                name: data.name,
                email: data.email,
                tier: data.tier as 'free' | 'lite' | 'pro',
                profileImage: data.profileImage,
                createdAt: data.createdAt
            });
            form.setValue('name', data.name);
            setProfileImage(data.profileImage || null);
        } catch (error) {
            console.error('Error fetching profile data:', error);
            toast({
                title: 'Error',
                description: 'Failed to load account settings',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const synchronizeTierWithBackend = async () => {
        setIsSynchronizing(true);
        try {
            const localTier = localStorage.getItem('geminiTier');
            if (localTier) {
                await synchronizeTier();
                toast({
                    title: 'Tier Synchronized',
                    description: `Your ${localTier.charAt(0).toUpperCase() + localTier.slice(1)} tier has been synchronized with the server.`,
                });
            }
        } catch {
            // Don't show error toast here to not interrupt the user experience
        } finally {
            setIsSynchronizing(false);
        }
    };

    const createTinyAvatar = (letter: string, color: string = '#4f46e5') => {
        // Create a tiny canvas for simple text avatar
        const canvas = document.createElement('canvas');
        canvas.width = 60;
        canvas.height = 60;
        const ctx = canvas.getContext('2d');

        if (!ctx) return null;

        // Draw background
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 60, 60);

        // Draw text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(letter.toUpperCase(), 30, 30);

        // Convert to very small JPEG
        return canvas.toDataURL('image/jpeg', 0.01);
    };

    const onSubmit = async (values: z.infer<typeof profileSchema>) => {
        setIsLoading(true);
        let successMessages = [];
        let retryWithFallback = false;

        try {
            // Handle profile updates in two separate steps for reliability:
            // 1. First update name if changed
            if (values.name !== profileData?.name) {
                console.log('Updating name to:', values.name);

                try {
                    await updateUserProfile({ name: values.name });

                    // Update local storage with new name
                    const currentName = localStorage.getItem('userName');
                    if (currentName && values.name !== currentName) {
                        localStorage.setItem('userName', values.name);
                    }

                    successMessages.push('Name updated successfully');
                } catch (nameError: any) {
                    console.error('Error updating name:', nameError);
                    toast({
                        title: 'Name update failed',
                        description: nameError.message || 'Failed to update your name',
                        variant: 'destructive',
                    });
                }
            }

            // 2. Then update profile image if changed
            // First check if the image was removed (current is null but original had an image)
            const wasImageRemoved = profileImage === null && profileData?.profileImage !== null;

            // Then check if we're adding/changing an image
            const isImageChanged = profileImage !== null && profileImage !== profileData?.profileImage;

            if (isImageChanged) {
                console.log('Updating profile image...');
                console.log(`Image size: ${Math.round((profileImage as string).length / 1024)}KB`);

                try {
                    // Use the dedicated profile image update function
                    await updateProfileImage(profileImage as string);

                    // Dispatch a profile updated event
                    window.dispatchEvent(new Event('profileUpdated'));

                    successMessages.push('Profile image updated successfully');
                } catch (imageError: any) {
                    console.error('Error updating profile image:', imageError);

                    // Check if it's the request entity too large error
                    const isTooLarge =
                        imageError.message?.includes('too large') ||
                        imageError.message?.includes('entity') ||
                        imageError.message?.includes('size');

                    if (isTooLarge) {
                        // Try our extreme fallback option - create a text-based avatar
                        retryWithFallback = true;

                        toast({
                            title: 'Trying alternative method',
                            description: 'Image is too large, using a simple letter avatar instead',
                        });
                    } else {
                        // Show regular error for other issues
                        toast({
                            title: 'Image update failed',
                            description: imageError.message || 'Failed to update profile image',
                            variant: 'destructive',
                        });
                    }
                }

                // If the standard method failed due to size limits, try fallback
                if (retryWithFallback) {
                    try {
                        console.log('Trying fallback letter avatar...');
                        // Create a tiny text avatar with first letter
                        const letter = values.name?.charAt(0) || 'U';
                        const tinyAvatar = createTinyAvatar(letter);

                        if (tinyAvatar) {
                            console.log(`Tiny letter avatar size: ${Math.round(tinyAvatar.length / 1024)}KB`);
                            await updateProfileImage(tinyAvatar);

                            // Update UI
                            window.dispatchEvent(new Event('profileUpdated'));
                            successMessages.push('Simple avatar created successfully');
                        }
                    } catch (fallbackError) {
                        console.error('Fallback avatar also failed:', fallbackError);
                        toast({
                            title: 'Image update failed',
                            description: 'Could not update profile image, even with fallback method',
                            variant: 'destructive',
                        });
                    }
                }
            } else if (wasImageRemoved) {
                // Image removal was handled separately by the removeProfileImage function
                // Just add a success message for the form submission feedback
                successMessages.push('Profile image removal confirmed');
            }

            // Show success message if any of the updates succeeded
            if (successMessages.length > 0) {
                toast({
                    title: 'Account updated',
                    description: successMessages.join('. '),
                });
                onClose();
            } else if (!isImageChanged && !wasImageRemoved && values.name === profileData?.name) {
                toast({
                    title: 'No changes',
                    description: 'No changes were detected to save',
                });
                onClose();
            }
        } catch (error: any) {
            console.error('Unexpected error in profile update:', error);
            toast({
                title: 'Update failed',
                description: 'An unexpected error occurred. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Then modify the handleImageUpload function to use compression for large images
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        // File size validation (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast({
                title: 'File too large',
                description: 'Please select an image smaller than 10MB',
                variant: 'destructive',
            });
            setIsUploading(false);
            return;
        }

        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                if (event.target?.result) {
                    const originalImage = event.target.result as string;

                    // For debugging
                    console.log(`Original image size: ${Math.round(originalImage.length / 1024)}KB`);

                    try {
                        // Apply better balanced compression
                        const img = new Image();
                        img.src = originalImage;

                        await new Promise<void>((resolve) => {
                            img.onload = () => resolve();
                        });

                        // Create a medium-sized canvas - 300px max width/height for better quality
                        const canvas = document.createElement('canvas');
                        const MAX_DIM = 300;
                        const scale = Math.min(MAX_DIM / img.width, MAX_DIM / img.height);
                        canvas.width = Math.floor(img.width * scale);
                        canvas.height = Math.floor(img.height * scale);

                        const ctx = canvas.getContext('2d');
                        if (!ctx) throw new Error('Could not get canvas context');

                        // Draw image with high quality smoothing
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                        // Start with better quality (40%)
                        let compressedImage = canvas.toDataURL('image/jpeg', 0.4);
                        let imageSize = Math.round(compressedImage.length / 1024);
                        console.log(`Medium quality image (300px, 0.4 quality): ${imageSize}KB`);

                        // Only reduce quality if the image is too large
                        if (imageSize > 60) {
                            // Try with slightly lower quality (25%)
                            compressedImage = canvas.toDataURL('image/jpeg', 0.25);
                            imageSize = Math.round(compressedImage.length / 1024);
                            console.log(`Lower quality image (300px, 0.25 quality): ${imageSize}KB`);

                            // If still too large, reduce dimensions and quality more
                            if (imageSize > 40) {
                                // Reduce dimensions to 200px
                                canvas.width = 200;
                                canvas.height = 200 * (canvas.height / canvas.width);
                                ctx.imageSmoothingQuality = 'high';
                                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                                compressedImage = canvas.toDataURL('image/jpeg', 0.2);
                                imageSize = Math.round(compressedImage.length / 1024);
                                console.log(`Small image (200px, 0.2 quality): ${imageSize}KB`);
                            }
                        }

                        // Set the image in state
                        setProfileImage(compressedImage);
                        toast({
                            title: 'Image processed',
                            description: 'Image prepared for upload with balanced quality.',
                        });
                    } catch (compressionError) {
                        console.error('Error compressing image:', compressionError);
                        toast({
                            title: 'Image processing error',
                            description: 'Failed to process the image. Please try a different one.',
                            variant: 'destructive',
                        });
                    }
                }
                setIsUploading(false);
            };
            reader.onerror = () => {
                toast({
                    title: 'Error',
                    description: 'Failed to read image file',
                    variant: 'destructive',
                });
                setIsUploading(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error processing image:', error);
            toast({
                title: 'Error',
                description: 'An unexpected error occurred while processing the image',
                variant: 'destructive',
            });
            setIsUploading(false);
        }
    };

    const removeProfileImage = async () => {
        try {
            setIsUploading(true);

            // Set local state to null to update UI immediately
            setProfileImage(null);

            console.log('Removing profile image...');

            // Force clear browser cache for any avatar images
            const clearImageCache = () => {
                // Add a random query parameter to force browser to reload image
                const timestamp = new Date().getTime();
                const avatarElements = document.querySelectorAll('.avatar-image');
                avatarElements.forEach(el => {
                    if (el instanceof HTMLImageElement) {
                        // Set src to empty then force reload with timestamp
                        el.setAttribute('src', '');
                        // Force browser to forget this image
                        el.style.display = 'none';
                        setTimeout(() => {
                            el.style.display = '';
                        }, 50);
                    }
                });
                console.log('Cleared browser cache for avatar images');
            };

            // Clear cache first
            clearImageCache();

            // Call API to update profile with null profile image
            const response = await updateUserProfile({ profileImage: null });
            console.log('Profile image removal response:', response);

            // Update the profileData state to reflect the change
            if (profileData) {
                setProfileData({
                    ...profileData,
                    profileImage: null
                });
            }

            // Force navbar and UI updates with cache-busting timestamp
            window.dispatchEvent(new CustomEvent('forceProfileReload', {
                detail: { timestamp: Date.now() }
            }));

            // Force close the dialog after successful removal
            onClose();

            // Notify user of success
            toast({
                title: 'Profile image removed',
                description: 'Your profile image has been removed successfully.',
            });
        } catch (error) {
            console.error('Failed to remove profile image:', error);

            // If server update fails, restore the previous image
            if (profileData?.profileImage) {
                setProfileImage(profileData.profileImage);
            }

            toast({
                title: 'Error',
                description: 'Failed to remove profile image. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
        }
    };

    const getTierBadgeClass = (tier: string) => {
        switch (tier) {
            case 'pro':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'lite':
                return 'bg-purple-50 text-purple-700 border-purple-200';
            default:
                return 'bg-blue-50 text-blue-700 border-blue-200';
        }
    };

    const getTierName = (tier: string) => {
        switch (tier) {
            case 'pro':
                return 'Pro';
            case 'lite':
                return 'Lite';
            default:
                return 'Free';
        }
    };

    // Format the createdAt date
    const formatJoinDate = (dateString: string) => {
        if (!dateString) return 'Unknown';
        try {
            const date = new Date(dateString);
            return format(date, 'MMMM d, yyyy');
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Unknown';
        }
    };

    // Get tier benefits based on user's tier
    const getTierBenefits = (tier: string) => {
        switch (tier) {
            case 'pro':
                return [
                    'Access to Meal tracking, Food search and Meal Generator',
                    'Advanced health reports with detailed analytics',
                    'Access to newer model and premium models',
                    'Access to Advanced Analysis',
                    'Access to Find Specialist feature'
                ];
            case 'lite':
                return [
                    'Access to Personalized diet plan with detailed nutrition breakdowns',
                    'Access to Health Connect AI Assistant',
                    'Priority email support',
                    'AI-powered recommendations for health improvements',
                    'Ad-free experience throughout the application'
                ];
            default: // free
                return [
                    'Access to Health Metrics',
                    'Access to Basic Profile Summary',
                    'Access to General Recommendations in Nutrition',
                    'Access to essential health tracking features'
                ];
        }
    };

    // Show the initial deletion warning
    const initiateDeleteAccount = () => {
        setShowDeleteWarning(true);
    };

    // Proceed to password confirmation
    const proceedToPasswordConfirm = () => {
        setShowDeleteWarning(false);
        setShowDeleteConfirm(true);
    };

    // Handle account deletion
    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            setDeleteError('Password is required to confirm deletion');
            return;
        }

        setIsDeleting(true);
        setDeleteError('');

        try {
            await deleteUserAccount(deletePassword);

            // Account successfully deleted, show toast and redirect to login
            toast({
                title: 'Account Deleted',
                description: 'Your account has been permanently deleted.',
            });

            // Close both dialogs
            setShowDeleteConfirm(false);
            onClose();

            // Redirect to home page after a short delay
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } catch (error: any) {
            console.error('Error deleting account:', error);
            // Check if it's a route not found error
            if (error.message?.includes('not found') || error.message?.includes('Failed to fetch')) {
                setDeleteError('Account deletion is currently unavailable. Please try again later.');
            } else {
                setDeleteError(error.message || 'Failed to delete account. Please check your password and try again.');
            }
        } finally {
            setIsDeleting(false);
        }
    };

    // ------- Tier Selection via SubscriptionPlansDialog -------
    const handleOpenPlans = () => {
        setShowPaymentDetails(false);
        setShowPlansDialog(true);
    };

    const handleTierSelected = (tier: GeminiTier) => {
        setProfileData(prev => prev ? { ...prev, tier } : prev);
        localStorage.setItem('geminiTier', tier);
    };

    const handleReasonToggle = (reason: string, checked: boolean | string) => {
        const isChecked = typeof checked === 'boolean' ? checked : Boolean(checked);
        setCancelReasons(prev =>
            isChecked ? [...prev, reason] : prev.filter(r => r !== reason)
        );
    };

    const handleCancelSubscription = async () => {
        if (!cancelReasons.length) {
            setCancelError('Please select at least one reason.');
            return;
        }
        if (cancelPassword !== 'CANCEL') {
            setCancelError('Please type CANCEL exactly as shown to confirm.');
            return;
        }
        setIsCancelling(true);
        setCancelError('');
        try {
            await cancelSubscription(cancelPassword, cancelReasons);
            toast({ title: 'Subscription Cancelled', description: 'Your subscription has been cancelled.' });
            setProfileData(prev => prev ? { ...prev, tier: 'free' } : prev);
            localStorage.setItem('geminiTier', 'free');
            setShowPaymentDetails(false);
        } catch (error: any) {
            console.error('Error cancelling subscription:', error);
            setCancelError(error.message || 'Failed to cancel subscription.');
        } finally {
            setIsCancelling(false);
        }
    };



    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[425px] rounded-xl md:rounded-lg overflow-hidden flex flex-col">
                    <DialogHeader className="pb-2 shrink-0">
                        <DialogTitle>Account Settings</DialogTitle>
                        <DialogDescription>
                            Update your account settings here
                        </DialogDescription>
                    </DialogHeader>

                    {isLoading && !profileData ? (
                        <div className="py-6 text-center">Loading account settings...</div>
                    ) : (
                        <div className="flex flex-col flex-1 overflow-hidden">
                            <div className="overflow-y-auto pr-1 flex-1 max-h-[460px]">
                                <form onSubmit={form.handleSubmit(onSubmit)}>
                                    <div className="space-y-4">
                                        {/* Profile Image */}
                                        <div className="flex flex-col items-center gap-3 py-2">
                                            <div className="relative">
                                                <Avatar className="h-32 w-32 border-2 border-primary/20 rounded-2xl">
                                                    {profileImage ? (
                                                        <AvatarImage src={profileImage} alt="Profile" className="rounded-2xl object-cover" />
                                                    ) : (
                                                        <AvatarFallback className="bg-primary/10 text-primary text-4xl rounded-2xl">
                                                            {profileData?.name?.charAt(0).toUpperCase() || <User className="h-12 w-12" />}
                                                        </AvatarFallback>
                                                    )}
                                                </Avatar>

                                                <div className="absolute -bottom-2 -right-2 flex gap-1">
                                                    <label
                                                        htmlFor="profile-image-upload"
                                                        className="bg-primary text-white p-1.5 rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                                                    >
                                                        <Camera className="h-4 w-4" />
                                                        <input
                                                            id="profile-image-upload"
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={handleImageUpload}
                                                            disabled={isUploading}
                                                        />
                                                    </label>

                                                    {profileImage && (
                                                        <button
                                                            type="button"
                                                            onClick={removeProfileImage}
                                                            className="bg-destructive text-white p-1.5 rounded-full hover:bg-destructive/90 transition-colors"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {isUploading && <div className="text-sm text-muted-foreground">Uploading image...</div>}
                                        </div>

                                        {/* Account Information */}
                                        <div className="space-y-3">
                                            <div>
                                                <Label htmlFor="name">Display Name</Label>
                                                <Input
                                                    id="name"
                                                    {...form.register('name')}
                                                    placeholder="Your name"
                                                    className="mt-1"
                                                />
                                                {form.formState.errors.name && (
                                                    <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>
                                                )}
                                            </div>

                                            <div>
                                                <Label>Email</Label>
                                                <Input
                                                    value={profileData?.email}
                                                    readOnly
                                                    disabled
                                                    className="mt-1 bg-muted/50"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <Label>Current Plan</Label>
                                                <div className="mt-1 p-3 rounded-lg border bg-muted/30 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium ${getTierBadgeClass(profileData?.tier || 'free')}`}>
                                                            {profileData?.tier === 'pro' && <Crown className="h-3.5 w-3.5" />}
                                                            {profileData?.tier === 'lite' && <Zap className="h-3.5 w-3.5" />}
                                                            {getTierName(profileData?.tier || 'free')} Tier
                                                        </div>
                                                        {isSynchronizing ? (
                                                            <Button type="button" variant="ghost" size="sm" disabled className="h-7 px-2 text-xs">
                                                                <Zap className="h-3 w-3 animate-pulse mr-1" />
                                                                Syncing...
                                                            </Button>
                                                        ) : (
                                                            <Button type="button" variant="ghost" size="sm" onClick={synchronizeTierWithBackend} className="h-7 px-2 text-xs">
                                                                <Zap className="h-3 w-3 mr-1" />
                                                                Refresh
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={handleOpenPlans}
                                                            className="flex-1 h-8"
                                                        >
                                                            {profileData?.tier === 'free' ? 'Upgrade Plan' : 'Change Plan'}
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setShowPaymentDetails(true)}
                                                            className="h-8 px-3"
                                                        >
                                                            <CreditCard className="h-3.5 w-3.5 mr-1" />
                                                            Billing
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-1">
                                                    <Label>Member Since</Label>
                                                    <div className="mt-1 text-muted-foreground text-sm">
                                                        {formatJoinDate(profileData?.createdAt || '')}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Visual end of content - natural stopping point for most users */}
                                        <div className="h-8"></div>

                                        {/* Danger Zone - positioned way below so it requires deliberate scrolling */}
                                        <div className="mt-28 pt-6 border-t border-destructive/20">
                                            <h3 className="text-destructive flex items-center font-semibold text-sm">
                                                <AlertTriangle className="h-4 w-4 mr-2" />
                                                Danger Zone
                                            </h3>
                                            <p className="text-sm text-muted-foreground mt-1 mb-4">
                                                Actions in this section cannot be undone
                                            </p>

                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                className="w-full sm:w-auto"
                                                onClick={() => setShowDeleteWarning(true)}
                                            >
                                                Delete Account
                                            </Button>
                                        </div>

                                        {/* Extra space after danger zone */}
                                        <div className="h-6"></div>
                                    </div>

                                    <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 mt-4 sticky bottom-0 bg-background pt-2 pb-1">
                                        <DialogClose asChild>
                                            <Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button>
                                        </DialogClose>
                                        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                                            {isLoading ? 'Saving...' : 'Save changes'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </div>
                        </div>
                    )}
                </DialogContent>

                {/* Payment Details Dialog */}
                <Dialog open={showPaymentDetails} onOpenChange={setShowPaymentDetails}>
                    <DialogContent className="sm:max-w-[500px] rounded-xl md:rounded-lg">
                        {paymentStep === 'details' && (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center">
                                        <CreditCard className="h-5 w-5 mr-2" />
                                        Subscription Details
                                    </DialogTitle>
                                </DialogHeader>

                                <div className="space-y-4 py-2 text-sm">
                                    {/* Current Plan Badge */}
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Current Plan</p>
                                            <p className="font-semibold text-base flex items-center gap-1.5">
                                                {profileData?.tier === 'pro' && <Crown className="h-4 w-4 text-amber-500" />}
                                                {profileData?.tier === 'lite' && <Zap className="h-4 w-4 text-purple-500" />}
                                                {getTierName(profileData?.tier || 'free')}
                                            </p>
                                        </div>
                                        {(() => {
                                            const storedCycle = localStorage.getItem('billingCycle');
                                            if (!storedCycle || profileData?.tier === 'free') return null;
                                            const cycleLabels: Record<string, string> = {
                                                trial: '3-Day Trial',
                                                weekly: 'Weekly',
                                                monthly: 'Monthly',
                                                sixMonths: '6 Months',
                                                yearly: 'Yearly',
                                            };
                                            return (
                                                <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                                                    {cycleLabels[storedCycle] || storedCycle}
                                                </span>
                                            );
                                        })()}
                                    </div>

                                    {/* Subscription Details — different for free, trial, and paid */}
                                    {profileData?.tier === 'free' ? (
                                        <div className="text-center py-4 space-y-2">
                                            <p className="text-muted-foreground">No active subscription</p>
                                            <p className="text-xs text-muted-foreground">Upgrade to Lite or Pro for AI-powered health features.</p>
                                        </div>
                                    ) : localStorage.getItem('billingCycle') === 'trial' ? (
                                        /* Trial-specific info */
                                        (() => {
                                            const trialEnd = localStorage.getItem('trialEndDate');
                                            const trialEndDate = trialEnd ? new Date(trialEnd) : null;
                                            const now = new Date();
                                            const hoursLeft = trialEndDate ? Math.max(0, Math.floor((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60))) : 0;
                                            const daysLeft = Math.floor(hoursLeft / 24);
                                            const remainingHours = hoursLeft % 24;
                                            const isExpired = trialEndDate ? now > trialEndDate : false;

                                            return (
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="p-2.5 rounded-md bg-green-50 border border-green-200">
                                                            <p className="text-xs text-green-700">Started</p>
                                                            <p className="font-medium text-green-900 text-sm">
                                                                {trialEndDate
                                                                    ? format(new Date(trialEndDate.getTime() - 3 * 24 * 60 * 60 * 1000), 'MMM d, yyyy')
                                                                    : '—'}
                                                            </p>
                                                        </div>
                                                        <div className="p-2.5 rounded-md bg-amber-50 border border-amber-200">
                                                            <p className="text-xs text-amber-700">Expires</p>
                                                            <p className="font-medium text-amber-900 text-sm">
                                                                {trialEndDate ? format(trialEndDate, 'MMM d, yyyy') : '—'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {!isExpired ? (
                                                        <div className="p-3 rounded-md bg-blue-50 border border-blue-200">
                                                            <p className="text-blue-800 font-medium">
                                                                ⏰ {daysLeft > 0 ? `${daysLeft}d ${remainingHours}h` : `${remainingHours}h`} remaining
                                                            </p>
                                                            <p className="text-xs text-blue-600 mt-1">
                                                                Your free trial will end automatically. After that, you'll be moved to the Free tier with basic features.
                                                                Upgrade to a paid plan anytime to keep Pro features.
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="p-3 rounded-md bg-red-50 border border-red-200">
                                                            <p className="text-red-800 font-medium">Trial has expired</p>
                                                            <p className="text-xs text-red-600 mt-1">
                                                                Your trial ended. Upgrade to keep using Pro features.
                                                            </p>
                                                        </div>
                                                    )}

                                                    <div className="p-3 rounded-md border bg-muted/30">
                                                        <p className="text-xs font-medium mb-1">What happens after the trial?</p>
                                                        <ul className="text-xs text-muted-foreground space-y-1">
                                                            <li>• Your account automatically moves to the <strong>Free tier</strong></li>
                                                            <li>• No charges — the trial is completely free</li>
                                                            <li>• You can upgrade to Lite (₹149/mo) or Pro (₹199/mo) anytime</li>
                                                            <li>• Your health data and profile are never deleted</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        /* Paid plan info */
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-2.5 rounded-md bg-muted/50 border">
                                                    <p className="text-xs text-muted-foreground">Amount Billed</p>
                                                    <p className="font-semibold text-sm">
                                                        {subscriptionDetails
                                                            ? `${subscriptionDetails.currency === 'INR' ? '₹' : subscriptionDetails.currency}${subscriptionDetails.amount.toFixed(0)}`
                                                            : '—'}
                                                    </p>
                                                </div>
                                                <div className="p-2.5 rounded-md bg-muted/50 border">
                                                    <p className="text-xs text-muted-foreground">Days Remaining</p>
                                                    <p className="font-semibold text-sm">
                                                        {subscriptionDetails ? `${subscriptionDetails.daysLeft} days` : '—'}
                                                    </p>
                                                </div>
                                            </div>

                                            {subscriptionDetails && (
                                                <div className="p-2.5 rounded-md bg-muted/50 border">
                                                    <p className="text-xs text-muted-foreground">Next Renewal Date</p>
                                                    <p className="font-semibold text-sm">
                                                        {format(new Date(subscriptionDetails.endDate), 'MMMM d, yyyy')}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="p-3 rounded-md border bg-muted/30">
                                                <p className="text-xs font-medium mb-1">How does billing work?</p>
                                                <ul className="text-xs text-muted-foreground space-y-1">
                                                    <li>• Your plan <strong>auto-renews</strong> at the end of each billing cycle</li>
                                                    <li>• You'll be charged automatically via Razorpay</li>
                                                    <li>
                                                        • You can cancel or change plans anytime from{' '}
                                                        <button
                                                            onClick={() => setPaymentStep('cancel-warning')}
                                                            className="text-muted-foreground/80 hover:text-foreground hover:underline transition-colors"
                                                        >
                                                            here
                                                        </button>
                                                    </li>
                                                    <li>• All your health data and profile are always preserved</li>
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                                    <Button variant="secondary" onClick={handleOpenPlans} className="w-full sm:w-auto">
                                        {profileData?.tier === 'free' ? 'Upgrade Plan' : 'Change Plan'}
                                    </Button>

                                    <Button variant="outline" onClick={() => setShowPaymentDetails(false)} className="w-full sm:w-auto">
                                        Close
                                    </Button>
                                </DialogFooter>
                            </>
                        )}


                        {paymentStep === 'cancel-warning' && (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="text-xl text-center">Are you sure you want to lose Pro?</DialogTitle>
                                    <DialogDescription className="text-center font-medium">
                                        If you cancel, you will immediately lose access to your most powerful tools:
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                    <div className="bg-destructive/5 rounded-lg border border-destructive/20 p-4">
                                        <h4 className="flex items-center font-medium text-destructive mb-3">
                                            <AlertTriangle className="h-5 w-5 mr-2" />
                                            What you'll lose access to:
                                        </h4>
                                        <ul className="space-y-2 ml-1 text-sm text-foreground/80">
                                            <li className="flex items-start">
                                                <X className="h-4 w-4 text-destructive mr-2 mt-0.5 flex-shrink-0" />
                                                <span><strong>Unlimited AI Insights:</strong> Stop receiving personalized Gemini health models</span>
                                            </li>
                                            <li className="flex items-start">
                                                <X className="h-4 w-4 text-destructive mr-2 mt-0.5 flex-shrink-0" />
                                                <span><strong>Specialist Network:</strong> Lose direct booking capability with our top 1% doctors</span>
                                            </li>
                                            <li className="flex items-start">
                                                <X className="h-4 w-4 text-destructive mr-2 mt-0.5 flex-shrink-0" />
                                                <span><strong>Advanced Analytics:</strong> Lose trend forecasting on your vital health data</span>
                                            </li>
                                            <li className="flex items-start">
                                                <X className="h-4 w-4 text-destructive mr-2 mt-0.5 flex-shrink-0" />
                                                <span><strong>Premium Diets:</strong> No more access to customized, daily meal plans</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <p className="text-center text-sm text-muted-foreground font-medium">
                                        Over 94% of our users stay on Pro because of the massive health improvements.
                                    </p>
                                </div>

                                <DialogFooter className="flex flex-col space-y-3 sm:space-y-0 relative pb-2">
                                    <Button 
                                        onClick={() => setPaymentStep('details')} 
                                        className="w-full text-md font-bold py-6 bg-gradient-to-r from-primary to-health-blue hover:opacity-90 transition-opacity shadow-[0_8px_20px_rgb(0,0,0,0.12)] text-white"
                                    >
                                        I want to keep my Pro Benefits
                                    </Button>
                                    <div className="flex justify-center pt-2">
                                        <button 
                                            onClick={() => setPaymentStep('cancel-offer')}
                                            className="text-xs text-muted-foreground underline hover:text-foreground transition-colors"
                                        >
                                            Continue to cancel
                                        </button>
                                    </div>
                                </DialogFooter>
                            </>
                        )}

                        {paymentStep === 'cancel-offer' && (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="text-xl text-center">Don't break your streak!</DialogTitle>
                                    <DialogDescription className="text-center">
                                        You're in the top tier of dedicated users. Your health is an investment, not an expense.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 py-6">
                                    <div className="flex flex-col items-center justify-center p-6 bg-amber-50 rounded-xl border border-amber-200">
                                        <Crown className="h-12 w-12 text-amber-500 mb-3" />
                                        <h3 className="text-lg font-bold text-amber-900 mb-2">You deserve the best care.</h3>
                                        <p className="text-center text-sm text-amber-800/80 max-w-sm">
                                            We built HealthConnect Pro to give you the absolute best medical and nutritional tools available. Don't compromise on your health journey now.
                                        </p>
                                    </div>
                                </div>

                                <DialogFooter className="flex flex-col space-y-3 sm:space-y-0 relative">
                                    <Button 
                                        onClick={() => setPaymentStep('details')} 
                                        className="w-full text-md font-bold h-12 bg-primary hover:bg-primary/90 text-white shadow-md"
                                    >
                                        Stay on Pro
                                    </Button>
                                    <div className="flex justify-center pt-2">
                                        <button 
                                            onClick={() => setPaymentStep('cancel')}
                                            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            No thanks, I still want to downgrade
                                        </button>
                                    </div>
                                </DialogFooter>
                            </>
                        )}


                        {paymentStep === 'cancel' && (
                            <>
                                <DialogHeader>
                                    <DialogTitle>Cancel Subscription</DialogTitle>
                                    <DialogDescription>Help us understand why you're leaving</DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        {reasonOptions.map(reason => (
                                            <div key={reason} className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`reason-${reason}`}
                                                    checked={cancelReasons.includes(reason)}
                                                    onCheckedChange={checked => handleReasonToggle(reason, checked)}
                                                />
                                                <label htmlFor={`reason-${reason}`}>{reason}</label>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="cancel-password">Please type <strong>CANCEL</strong> to confirm</Label>
                                        <Input
                                            id="cancel-password"
                                            type="text"
                                            value={cancelPassword}
                                            onChange={e => setCancelPassword(e.target.value)}
                                            placeholder="Type CANCEL here"
                                        />
                                    </div>

                                    {cancelError && <p className="text-sm text-destructive">{cancelError}</p>}
                                </div>

                                <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                                    <Button variant="outline" onClick={() => setPaymentStep('cancel-offer')} className="w-full sm:w-auto">
                                        Back
                                    </Button>
                                    <Button variant="destructive" disabled={isCancelling} onClick={handleCancelSubscription} className="w-full sm:w-auto font-bold bg-destructive hover:bg-red-700">
                                        {isCancelling ? 'Processing...' : 'Permanently Delete Pro Benefits'}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Account Deletion Warning Dialog */}
                <Dialog open={showDeleteWarning} onOpenChange={setShowDeleteWarning}>
                    <DialogContent className="sm:max-w-[500px] rounded-xl md:rounded-lg max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-center text-xl">
                                <span className="text-destructive block text-2xl font-bold">
                                    We're Sorry To See You Go! 😔
                                </span>
                            </DialogTitle>
                            <DialogDescription className="text-center pt-2">
                                Before you delete your account, remember the benefits of your {getTierName(profileData?.tier || 'free')} subscription:
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                                <h3 className="flex items-center text-lg font-medium mb-3">
                                    <Crown className={`h-5 w-5 mr-2 ${profileData?.tier === 'pro' ? 'text-amber-500' :
                                        profileData?.tier === 'lite' ? 'text-purple-500' :
                                            'text-blue-500'
                                        }`} />
                                    Your {getTierName(profileData?.tier || 'free')} Tier Benefits
                                </h3>
                                <ul className="space-y-2">
                                    {getTierBenefits(profileData?.tier || 'free').map((benefit, index) => (
                                        <li key={index} className="flex items-start">
                                            <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                                            <span>{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-amber-50 text-amber-800 p-4 rounded-lg border border-amber-200">
                                <h4 className="flex items-center font-medium mb-2">
                                    <ShieldCheck className="h-5 w-5 mr-2" />
                                    What you'll lose by deleting your account:
                                </h4>
                                <ul className="space-y-1 ml-7 list-disc text-sm">
                                    <li>All your health and nutrition tracking history</li>
                                    <li>Personalized recommendations based on your data</li>
                                    <li>Access to premium features you've unlocked</li>
                                    <li>Your subscription benefits (you won't get a refund)</li>
                                </ul>
                            </div>

                            <p className="text-sm text-gray-600 italic text-center">
                                Instead of deleting your account, you can take a break and come back anytime!
                            </p>
                        </div>

                        <DialogFooter className="flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowDeleteWarning(false)}
                                className="w-full sm:w-auto"
                            >
                                Keep My Account
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={proceedToPasswordConfirm}
                                className="w-full sm:w-auto"
                            >
                                I Still Want To Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Password Confirmation Dialog */}
                <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                    <DialogContent className="sm:max-w-[400px] rounded-xl md:rounded-lg">
                        <DialogHeader>
                            <DialogTitle className="text-destructive flex items-center">
                                <AlertTriangle className="h-5 w-5 mr-2" />
                                Delete Account
                            </DialogTitle>
                            <DialogDescription>
                                This action is permanent and cannot be undone. All your data will be permanently deleted.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <p className="text-sm font-medium text-destructive">
                                Please enter your password to confirm account deletion:
                            </p>

                            <div>
                                <Label htmlFor="delete-password">Password</Label>
                                <Input
                                    id="delete-password"
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="mt-1"
                                />
                                {deleteError && (
                                    <p className="text-sm text-destructive mt-1">{deleteError}</p>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeleting}
                                className="w-full sm:w-auto"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDeleteAccount}
                                disabled={isDeleting}
                                className="w-full sm:w-auto"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete My Account'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </Dialog>

            {/* Subscription Plans Dialog — routes all plan changes through Razorpay */}
            <SubscriptionPlansDialog
                isOpen={showPlansDialog}
                onClose={() => setShowPlansDialog(false)}
                onSelectTier={handleTierSelected}
                initialTab={profileData?.tier === 'free' ? 'lite' : profileData?.tier}
            />
        </>
    );
};

export default AccountSettings; 
