import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, Sparkles, ZapIcon, CheckCircle, Info, ChevronDown, Flame, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';

// Define the structure of a changelog entry
interface ChangelogItem {
    date: string;
    version: string;
    isMajor?: boolean;
    items: {
        text: string;
        type?: 'feature' | 'improvement' | 'bugfix' | 'announcement';
        link?: {
            text: string;
            url: string;
        };
    }[];
}

// Sample changelog data - this would come from your backend in a real app
const changelogData: ChangelogItem[] = [
    {
        date: 'March 18, 2026',
        version: '6.3.0',
        items: [
            {
                text: 'Completely redesigned the Changelog Dialog into a modern, professional vertical timeline.',
                type: 'feature'
            },
            {
                text: 'Introduced smart "Refresh to Update" notifications to ensure you always have the latest improvements.',
                type: 'feature'
            },
            {
                text: 'Enhanced Data Security: Migrated to secure HttpOnly Cookie-based authentication to protect your sessions.',
                type: 'feature'
            },
            {
                text: 'Cloud Sync & Persistence: Your Health Analysis (Basic/Advanced) and Wellness Journal are now securely stored on our servers for cross-device access.',
                type: 'feature'
            },
            {
                text: 'Fixed Navigation Bar layout issues on desktop and improved readability on mobile devices.',
                type: 'bugfix'
            },
            {
                text: 'Resolved the "ghosting" animation glitch with the mobile hamburger menu icon.',
                type: 'bugfix'
            }
        ]
    },
    {
        date: 'March 11, 2026',
        version: '6.2.0',
        isMajor: true,
        items: [
            {
                text: 'Major Model Upgradation: Integrated the latest bleeding-edge AI models across the entire platform for blazingly fast and accurate health inferences.',
                type: 'feature'
            },
            {
                text: 'Introduced Google OAuth Integration: Users can now easily sign up and log in using their Google accounts in a single click.',
                type: 'feature'
            },
            {
                text: 'Launched Comprehensive Subscription Management: Users can now manage their billing, view active plans, and process seamless upgrades/downgrades with Razorpay integration.',
                type: 'feature'
            },
            {
                text: 'Completely overhauled the Backend AI Chat processing to whitelist and support the newest scalable AI SDK.',
                type: 'improvement'
            },
            {
                text: 'Engineered a highly sophisticated Cancellation Funnel utilizing psychological friction to maximize user retention.',
                type: 'improvement'
            },
            {
                text: 'Fixed an infinite 404/502 loop where users were trapped on expired chat sessions or crashed session creation. The system now flawlessly self-heals by seamlessly generating a fresh chat.',
                type: 'bugfix'
            }
        ]
    },
    {
        date: 'November 22, 2025',
        version: '6.1.0',
        items: [
            {
                text: 'Implemented Health History Database Persistence - Your health analysis now saves across all devices!',
                type: 'feature'
            },
            {
                text: 'Added "Invisible AI" features for Pro users: Smart Daily Insights on Profile and Contextual Food Verdicts.',
                type: 'feature'
            },
            {
                text: 'Fixed History page tab labels to display proper category names (Sleep, Stress, etc.) instead of adjectives.',
                type: 'bugfix'
            },
            {
                text: 'Improved Chat Bot formatting for free users - upgrade messages now render properly.',
                type: 'bugfix'
            },
            {
                text: 'Added automatic page refresh after successful subscription purchase for instant tier activation.',
                type: 'improvement'
            },
            {
                text: 'Enhanced backend API with new health history endpoints and improved error handling.',
                type: 'improvement'
            }
        ]
    },
    {
        date: 'November 13, 2025',
        version: '6.0.0',
        items: [
            {
                text: 'Introduced "Symptom Checker" mode in AI Chat for specialized medical triage.',
                type: 'feature'
            },
            {
                text: 'Launched "Mood & Mental Wellness Journal" with AI-powered emotional analysis.',
                type: 'feature'
            },
            {
                text: 'Enhanced AI Chat with "Thinking Process" display (Advanced models only) and true streaming responses.',
                type: 'improvement'
            },
            {
                text: 'Implemented smart session management: Chat history now persists and auto-clears when switching models.',
                type: 'improvement'
            },
            {
                text: 'Fixed critical backend issues: Resolved API key exposure, CORS errors, and server stability.',
                type: 'bugfix'
            },
            {
                text: 'Improved Profile Analysis: Added "Save & Analyze" with forced refresh and better error handling.',
                type: 'improvement'
            },
            {
                text: 'Upgraded UI with rounder aesthetics, better markdown rendering, and educational tooltips.',
                type: 'improvement'
            }
        ]
    },
    {
        date: 'September 12, 2025',
        version: '5.0.1',
        items: [
            {
                text: 'Updated all project dependencies to their latest versions for improved performance and security.',
                type: 'improvement'
            },
            {
                text: 'Fixed an issue with the Tailwind CSS integration after a major version update.',
                type: 'bugfix'
            },
            {
                text: 'Resolved issues related to invalid API keys and outdated AI model names.',
                type: 'bugfix'
            },
            {
                text: 'Updated the AI model names in the UI to be more user-friendly.',
                type: 'improvement'
            }
        ]
    },
    {
        date: 'July 21, 2025',
        version: '5.0.0',
        items: [
            {
                text: 'Added "ScanBar" Feature for to get nutritional value of a food item by scanning it\'s barcode. Available to all Pro users on nutrition page.',
                type: 'feature'
            },
            {
                text: 'Updated previous AI models to new AI models. ',
                type: 'improvement'
            },
            {
                text: 'Slight changes to the UI for a more modern look.',
                type: 'improvement'
            },
            {
                text: 'Fixed minor UI bugs and improved overall user experience.',
                type: 'bugfix'
            }
        ]
    },
    {
        date: 'July 2, 2025',
        version: '4.5.0',
        items: [
            {
                text: 'Added real payment portal for subscription management.',
                type: 'feature'
            },
            {
                text: 'Improved AI model latency and performance.',
                type: 'improvement'
            },
            {
                text: 'Changed backend architecture for improved scalability and performance.',
                type: 'improvement'
            },

        ]
    },
    {
        date: 'June 11, 2025',
        version: '4.0.0',
        items: [
            {
                text: 'Fixed well known bugs for a smoother user experience.',
                type: 'bugfix'
            },
            {
                text: 'Models now use less resource for predictions, for faster user experience.',
                type: 'improvement'
            },
        ]
    },
    {
        date: 'May 5, 2025',
        version: '3.5.5',
        items: [
            {
                text: 'Added AI health insights dashboard with personalized recommendations',
                type: 'feature'
            },
            {
                text: 'Improved search functionality with smart filters and spring animations',
                type: 'improvement'
            },
            {
                text: 'Fixed synchronization issues with wearable device data',
                type: 'bugfix'
            }
        ]
    },
    {
        date: 'April 28, 2025',
        version: '3.5.0',
        items: [
            {
                text: 'Added What\'s New changelog feature to keep users updated on platform changes',
                type: 'feature'
            },
            {
                text: 'Enhanced accessibility features throughout the platform',
                type: 'improvement'
            },
            {
                text: 'Fixed loading issues in the appointment scheduler',
                type: 'bugfix'
            }
        ]
    },
    {
        date: 'April 10, 2025',
        version: '3.0.0',
        items: [
            {
                text: 'Introduced telemedicine integration for virtual doctor consultations',
                type: 'feature'
            },
            {
                text: 'Redesigned dashboard for better health metric visualization',
                type: 'improvement'
            },
            {
                text: 'Optimized app performance on mobile devices',
                type: 'improvement'
            }
        ]
    },
    {
        date: 'March 28, 2025',
        version: '2.5.0',
        items: [
            {
                text: 'Added meal generator on nutrition page with customizable options',
                type: 'feature'
            },
            {
                text: 'Integrated new AI models (2.5pro) to Pro and Lite tier subscriptions',
                type: 'feature'
            },
            {
                text: 'Fixed various UI inconsistencies and performance issues',
                type: 'bugfix'
            }
        ]
    },
    {
        date: 'March 25, 2025',
        version: '2.0.0',
        items: [
            {
                text: 'Introduced subscription tiers: Free, Lite, and Pro with differentiated features',
                type: 'feature'
            },
            {
                text: 'Fixed critical bug on profile page not registering gender selection',
                type: 'bugfix'
            },
            {
                text: 'Comprehensive UI improvements across all platform sections',
                type: 'improvement'
            }
        ]
    },
    {
        date: 'March 1, 2025',
        version: '1.0.0',
        items: [
            {
                text: 'Official launch of MediBridge platform',
                type: 'announcement'
            },
            {
                text: 'Integrated health tracking with comprehensive metrics dashboard',
                type: 'feature'
            },
            {
                text: 'Released initial AI models for personalized health insights',
                type: 'feature'
            }
        ]
    }
];

interface ChangelogDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChangelogDialog: React.FC<ChangelogDialogProps> = ({ isOpen, onClose }) => {
    // State to track which sections are expanded (by default, first two are expanded)
    const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>(() => {
        const initialState: Record<number, boolean> = {};
        changelogData.forEach((_, index) => {
            initialState[index] = index < 2; // First two sections expanded by default
        });
        return initialState;
    });

    // Toggle section expanded state
    const toggleSection = (index: number) => {
        setExpandedSections(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    // Function to get the appropriate icon and colors for each type of update
    const getTypeConfig = (type?: string) => {
        switch (type) {
            case 'feature':
                return {
                    icon: <Sparkles className="h-3.5 w-3.5" />,
                    colorClass: "bg-primary/10 text-primary border-primary/20",
                    badgeText: "Feature"
                };
            case 'improvement':
                return {
                    icon: <ZapIcon className="h-3.5 w-3.5" />,
                    colorClass: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
                    badgeText: "Improvement"
                };
            case 'bugfix':
                return {
                    icon: <CheckCircle className="h-3.5 w-3.5" />,
                    colorClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                    badgeText: "Fix"
                };
            case 'announcement':
                return {
                    icon: <Info className="h-3.5 w-3.5" />,
                    colorClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
                    badgeText: "Notice"
                };
            default:
                return {
                    icon: <Sparkles className="h-3.5 w-3.5" />,
                    colorClass: "bg-primary/10 text-primary border-primary/20",
                    badgeText: "Update"
                };
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl bg-white dark:bg-slate-950 flex flex-col">
                
                {/* Modern Header */}
                <div className="relative pt-8 pb-6 px-6 sm:px-8 border-b border-border/50 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Sparkles className="h-6 w-6 text-primary" />
                            </div>
                            <DialogTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
                                Platform Changelogs
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-base text-muted-foreground w-11/12">
                            Discover the latest features, improvements, and fixes we've pushed to elevate your health journey.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Vertical Timeline Body */}
                <div className="overflow-y-auto px-6 sm:px-8 py-6 flex-1 bg-gradient-to-b from-transparent to-slate-50/30 dark:to-slate-900/10">
                    <div className="relative">
                        {/* Timeline Track */}
                        <div className="absolute top-4 left-[15px] sm:left-[23px] bottom-4 w-px bg-gradient-to-b from-primary/30 via-border to-transparent" />

                        <div className="space-y-8 pb-6">
                            {changelogData.map((release, idx) => (
                                <div key={idx} className="relative pl-10 sm:pl-14">
                                    {/* Timeline Node */}
                                    <div className={`absolute left-0 sm:left-2 top-2 h-8 w-8 rounded-full border-4 border-white dark:border-slate-950 flex items-center justify-center z-10 
                                        ${idx === 0 ? 'bg-primary text-white shadow-md shadow-primary/20 scale-110' : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground'}
                                    `}>
                                        {idx === 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                                    </div>

                                    {/* Release Header */}
                                    <div 
                                        className="group cursor-pointer select-none"
                                        onClick={() => toggleSection(idx)}
                                    >
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                                            <h3 className={`text-xl sm:text-2xl font-bold tracking-tight transition-colors ${idx === 0 ? 'text-primary' : 'text-foreground group-hover:text-primary/80'}`}>
                                                v{release.version}
                                            </h3>
                                            
                                            {/* Badges Container */}
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant="secondary" className="font-mono text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800">
                                                    {release.date}
                                                </Badge>
                                                
                                                {idx === 0 && (
                                                    <span className="inline-flex animate-pulse items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                                        Latest
                                                    </span>
                                                )}
                                                
                                                {release.isMajor && idx !== 0 && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                                                        <Flame className="h-3 w-3" /> HOT
                                                    </span>
                                                )}
                                            </div>

                                            <div className="ml-auto">
                                                <motion.div
                                                    animate={{ rotate: expandedSections[idx] ? 180 : 0 }}
                                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                                    className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                                                >
                                                    <ChevronDown className="h-4 w-4" />
                                                </motion.div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expandable Content */}
                                    <AnimatePresence initial={false}>
                                        {expandedSections[idx] && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                                            >
                                                <div className="pt-4 pb-2 space-y-3">
                                                    {release.items.map((item, itemIdx) => {
                                                        const config = getTypeConfig(item.type);
                                                        return (
                                                            <div 
                                                                key={itemIdx} 
                                                                className="group/item flex items-start gap-3 p-3 sm:p-4 rounded-xl border border-transparent hover:border-border/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all duration-200"
                                                            >
                                                                <div className={`mt-0.5 flex items-center justify-center p-1.5 rounded-md border ${config.colorClass} shrink-0`}>
                                                                    {config.icon}
                                                                </div>
                                                                <div className="space-y-1.5 flex-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm ${config.colorClass}`}>
                                                                            {config.badgeText}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm sm:text-base text-foreground/90 leading-relaxed font-medium">
                                                                        {item.text}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 px-6 border-t border-border/50 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm flex justify-end">
                    <Button 
                        onClick={onClose} 
                        className="rounded-full px-6 transition-transform hover:scale-105"
                    >
                        Got it, thanks!
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ChangelogDialog; 
