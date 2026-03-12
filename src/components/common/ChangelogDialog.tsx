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
import { Clock, Sparkles, ZapIcon, CheckCircle, Info, ChevronDown, Flame, TrendingUp, ExternalLink, History, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';

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

interface LegacyVersion {
    version: string;
    date: string;
    description: string;
    imageUrl?: string;
    link: string;
    era: string;
    growth: number; // 0-100 scale for graph
}

const legacyData: LegacyVersion[] = [
    {
        version: "v1.0",
        date: "March 2025",
        description: "The beginning of MediBridge. Basic health tracking and initial AI models.",
        link: "https://health-connect-bice.vercel.app/",
        era: "The Foundation",
        growth: 15
    },
    {
        version: "v2.0",
        date: "March 2025",
        description: "Introduction of subscription tiers and comprehensive UI improvements.",
        link: "https://health-connect-bice.vercel.app/",
        era: "Expansion",
        growth: 20
    },
    {
        version: "v3.0",
        date: "April 2025",
        description: "Telemedicine integration and optimized mobile performance.",
        link: "https://health-connect-legacy.vercel.app/",
        era: "Connectivity",
        growth: 45
    },
    {
        version: "v4.0",
        date: "June 2025",
        description: "Major backend re-architecture and faster AI models.",
        link: "https://health-connect-legacy.vercel.app/",
        era: "Performance",
        growth: 55
    },
    {
        version: "v5.0",
        date: "July 2025",
        description: "ScanBar feature and modern UI refresh.",
        link: "https://health-connect-legacy.vercel.app/",
        era: "Innovation",
        growth: 65
    },
    {
        version: "v6.0",
        date: "November 2025",
        description: "Symptom Checker, Mental Wellness Journal, and Smart Insights.",
        link: "https://healthconnectofficial.vercel.app/",
        era: "Intelligence",
        growth: 90
    }
];

const reversedLegacyData = [...legacyData].reverse();

// Sample changelog data - this would come from your backend in a real app
const changelogData: ChangelogItem[] = [
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
    // State to track which sections are expanded (by default, all are expanded)
    const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>(() => {
        // Initialize with first section expanded, others collapsed
        const initialState: Record<number, boolean> = {};
        changelogData.forEach((_, index) => {
            initialState[index] = index === 0; // Only first section is expanded by default
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

    // Function to get the appropriate icon for each type of update
    const getItemIcon = (type?: string) => {
        switch (type) {
            case 'feature':
                return <Sparkles className="h-4 w-4 text-primary" />;
            case 'improvement':
                return <ZapIcon className="h-4 w-4 text-indigo-500" />;
            case 'bugfix':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'announcement':
                return <Info className="h-4 w-4 text-amber-500" />;
            default:
                return <Sparkles className="h-4 w-4 text-primary" />;
        }
    };

    // Function to get the badge text for update type
    const getBadgeText = (type?: string) => {
        switch (type) {
            case 'feature':
                return <Badge variant="default" className="bg-primary hover:bg-primary">New Feature</Badge>;
            case 'improvement':
                return <Badge variant="outline" className="text-indigo-500 border-indigo-500">Improvement</Badge>;
            case 'bugfix':
                return <Badge variant="outline" className="text-green-500 border-green-500">Bug Fix</Badge>;
            case 'announcement':
                return <Badge variant="outline" className="text-amber-500 border-amber-500">Announcement</Badge>;
            default:
                return <Badge variant="secondary">Update</Badge>;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <DialogTitle className="text-xl">What's New in MediBridge</DialogTitle>
                    </div>
                    <DialogDescription>
                        See the latest updates, improvements, and features we've added to make your health journey better.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="updates" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="updates">Updates</TabsTrigger>
                        <TabsTrigger value="legacy">Legacy Archives</TabsTrigger>
                    </TabsList>

                    <TabsContent value="updates" className="space-y-6 py-2">
                        {changelogData.map((release, idx) => (
                            <div key={idx} className="overflow-hidden">
                                <div
                                    className="flex items-center gap-2 cursor-pointer"
                                    onClick={() => toggleSection(idx)}
                                >
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <h3 className="text-lg font-medium">{release.date}</h3>
                                    <Badge variant="secondary" className="ml-2">v{release.version}</Badge>
                                    {idx === 0 && (
                                        <Badge variant="default" className="ml-2 flex items-center gap-1 bg-green-500 hover:bg-green-600">
                                            <TrendingUp className="h-3 w-3" /> LATEST
                                        </Badge>
                                    )}
                                    {release.isMajor && idx !== 0 && (
                                        <Badge variant="destructive" className="ml-2 flex items-center gap-1">
                                            <Flame className="h-3 w-3 fill-current" /> HOT
                                        </Badge>
                                    )}
                                    <div className="ml-auto">
                                        <motion.div
                                            animate={{ rotate: expandedSections[idx] ? 180 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        </motion.div>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {expandedSections[idx] && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="space-y-3 ml-6 mt-4 mb-2">
                                                {release.items.map((item, itemIdx) => (
                                                    <div key={itemIdx} className="flex items-start gap-3">
                                                        {getItemIcon(item.type)}
                                                        <div className="space-y-1">
                                                            <span className="text-sm">{item.text}</span>
                                                            <div className="flex mt-1">
                                                                {getBadgeText(item.type)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {idx < changelogData.length - 1 && (
                                    <Separator className="my-4" />
                                )}
                            </div>
                        ))}
                    </TabsContent>

                    <TabsContent value="legacy" className="py-2">
                        <div className="mb-6 bg-primary/5 p-4 rounded-xl border border-primary/10">
                            <h3 className="font-semibold flex items-center gap-2 mb-4">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                Our Growth Journey
                            </h3>

                            {/* Growth Graph */}
                            <div className="h-[160px] w-full mb-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={legacyData}>
                                        <defs>
                                            <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                                        <XAxis
                                            dataKey="version"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                            interval="preserveStartEnd"
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--background))',
                                                borderColor: 'hsl(var(--border))',
                                                borderRadius: '8px',
                                                fontSize: '12px'
                                            }}
                                            itemStyle={{ color: 'hsl(var(--primary))' }}
                                            cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="growth"
                                            stroke="hsl(var(--primary))"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorGrowth)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                From a simple health tracker to a comprehensive AI-powered wellness platform. Explore our evolution over time.
                            </p>
                        </div>

                        <div className="relative pl-4 border-l-2 border-muted space-y-8 ml-2">
                            {reversedLegacyData.map((version, idx) => (
                                <div key={idx} className="relative">
                                    {/* Timeline dot */}
                                    <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-background ring-2 ring-primary/20"></div>

                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="font-mono">{version.version}</Badge>
                                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {version.date}
                                            </span>
                                        </div>

                                        <h4 className="font-semibold text-base">{version.era}</h4>
                                        <p className="text-sm text-muted-foreground">{version.description}</p>

                                        <Button variant="outline" size="sm" className="w-fit mt-1 h-8" asChild>
                                            <a href={version.link} target="_blank" rel="noopener noreferrer">
                                                <History className="mr-2 h-3 w-3" />
                                                Visit Archive
                                                <ExternalLink className="ml-2 h-3 w-3 opacity-50" />
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="pt-2">
                    <Button onClick={onClose} className="w-full sm:w-auto">Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ChangelogDialog; 
