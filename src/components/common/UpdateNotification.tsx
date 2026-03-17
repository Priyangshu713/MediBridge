import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ChangelogDialog from './ChangelogDialog';

// Current app version - this would be dynamically determined in a real app
const CURRENT_VERSION = '6.3.0';
const CHANGELOG_FLAG = 'healthconnect_show_changelog_on_load';
const VERSION_KEY = 'healthconnect_last_seen_version';

interface UpdateNotificationProps {
    forceShow?: boolean;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ forceShow = false }) => {
    const [showNotification, setShowNotification] = useState(forceShow);
    const [showDialog, setShowDialog] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        // Check if we just refreshed to apply an update
        const shouldShowChangelog = localStorage.getItem(CHANGELOG_FLAG);
        
        if (shouldShowChangelog === 'true') {
            // We just updated! Clear the flag and show the changelog
            localStorage.removeItem(CHANGELOG_FLAG);
            
            // Mark this version as seen
            if (!forceShow) {
                localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
            }
            
            // Wait a brief moment for the app to settle before showing dialog
            setTimeout(() => {
                setShowDialog(true);
            }, 500);
            return;
        }

        // If forceShow is true, always show the notification
        if (forceShow) {
            setShowNotification(true);
            return;
        }

        // Otherwise, check if user has seen the latest version
        const checkVersion = () => {
            const lastSeenVersion = localStorage.getItem(VERSION_KEY);

            // If no version is stored, or the stored version is different from current
            // Show the notification
            if (!lastSeenVersion || lastSeenVersion !== CURRENT_VERSION) {
                // Wait a bit before showing the notification to not disrupt initial user experience
                setTimeout(() => {
                    setShowNotification(true);
                }, 5000);
            }
        };

        checkVersion();
    }, [forceShow]);

    // Handle clicking the refresh button
    const handleRefreshUpdate = () => {
        setIsRefreshing(true);
        
        // Set flag so we know to show changelog after reload
        localStorage.setItem(CHANGELOG_FLAG, 'true');
        
        // Force reload from server (not cache)
        window.location.reload();
    };

    // Handle opening the changelog dialog manually (without refresh)
    const handleOpenChangelog = () => {
        setShowDialog(true);
        setShowNotification(false);

        // Mark this version as seen
        if (!forceShow) {
            localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
        }
    };

    // Dismiss notification without opening changelog
    const handleDismiss = () => {
        setShowNotification(false);

        // Mark this version as seen
        if (!forceShow) {
            localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
        }
    };

    return (
        <>
            <AnimatePresence>
                {showNotification && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 25
                        }}
                        className="fixed bottom-4 right-4 z-50 md:bottom-8 md:right-8"
                    >
                        <div className="bg-white dark:bg-gray-900 shadow-xl rounded-xl p-5 border border-primary/20 max-w-sm md:max-w-md relative overflow-hidden">
                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                            
                            <div className="flex items-start gap-4 relative z-10">
                                <div className="bg-primary/10 rounded-full p-2.5 shrink-0">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-base text-foreground">New update available!</h3>
                                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                                        We've just released a new version of MediBridge. Please refresh to apply the latest features and improvements.
                                    </p>

                                    <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleOpenChangelog}
                                            className="text-xs sm:text-sm"
                                        >
                                            View Changelog
                                        </Button>
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={handleRefreshUpdate}
                                            disabled={isRefreshing}
                                            className="text-xs sm:text-sm bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
                                        >
                                            {isRefreshing ? (
                                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                            )}
                                            {isRefreshing ? 'Refreshing...' : 'Refresh to Update'}
                                        </Button>
                                    </div>
                                    <button 
                                        onClick={handleDismiss}
                                        className="absolute -top-1 -right-1 p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/50 transition-colors"
                                        aria-label="Dismiss"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Changelog dialog */}
            <ChangelogDialog
                isOpen={showDialog}
                onClose={() => setShowDialog(false)}
            />
        </>
    );
};

export default UpdateNotification;