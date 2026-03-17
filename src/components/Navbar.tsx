import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Heart, User, Apple, Bot, Menu, X, Info, LogIn, LogOut, History, UserRound, Settings, Sparkles } from 'lucide-react';
import { useHealthStore } from '@/store/healthStore';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { dispatchAuthEvent } from '@/App';
import DoctorMenuNavigation from './DoctorMenuNavigation';
import AccountSettings from '@/components/settings/AccountSettings';
import ChangelogDialog from '@/components/common/ChangelogDialog';
import { getUserProfile, logoutUser } from '@/api/auth';
import { getGravatarUrl } from '@/utils/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import MobileBottomSheet from './mobile/MobileBottomSheet';
import { supabase } from '@/lib/supabase';

const Navbar = () => {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { healthData, geminiTier, setAppointmentCredits, appointmentCredits } = useHealthStore();
  const isMobile = useIsMobile();

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem('userEmail') || '';
  });

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showChangelogDialog, setShowChangelogDialog] = useState(false);
  const [userProfileImage, setUserProfileImage] = useState<string | null>(() => {
    // Immediately load from localStorage so Google profile photo shows on first render
    return localStorage.getItem('userProfileImage') || null;
  });
  const [loadingProfile, setLoadingProfile] = useState(false);

  const isHomePage = location.pathname === '/';
  const showNavbar = true; // Always show navbar
  const isProUser = geminiTier === 'pro';

  const [isDoctorUser, setIsDoctorUser] = useState(() => {
    return localStorage.getItem('isDoctorAuthenticated') === 'true';
  });

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY > 10) {
            setIsScrolled(true);
          } else {
            setIsScrolled(false);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setActiveItem(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = localStorage.getItem('isAuthenticated') === 'true';
      setIsAuthenticated(isAuth);

      if (isAuth) {
        const email = localStorage.getItem('userEmail') || '';
        setUserEmail(email);
        // Load profile image from localStorage (set on Google login or profile update)
        const savedImage = localStorage.getItem('userProfileImage');
        if (savedImage) setUserProfileImage(savedImage);
      } else {
        setUserEmail('');
        setUserProfileImage(null);
      }

      const isDoctorAuth = localStorage.getItem('isDoctorAuthenticated') === 'true';
      setIsDoctorUser(isDoctorAuth);
    };

    checkAuth();

    const handleAuthStateChanged = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { isAuthenticated, email } = customEvent.detail;
      setIsAuthenticated(isAuthenticated);
      setUserEmail(email || '');
    };

    const handleDoctorAuthChanged = () => {
      const isDoctorAuth = localStorage.getItem('isDoctorAuthenticated') === 'true';
      setIsDoctorUser(isDoctorAuth);
    };

    window.addEventListener('storage', checkAuth);
    window.addEventListener('authStateChanged', handleAuthStateChanged as EventListener);
    window.addEventListener('doctorAuthChanged', handleDoctorAuthChanged);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('authStateChanged', handleAuthStateChanged as EventListener);
      window.removeEventListener('doctorAuthChanged', handleDoctorAuthChanged);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!isMenuOpen) return;

      const target = e.target as HTMLElement;
      const menuContent = document.querySelector('[data-mobile-menu="content"]');

      // Close if clicking outside the menu content
      if (menuContent && !menuContent.contains(target)) {
        setIsMenuOpen(false);
      }
    };

    // Use normal bubbling phase - onClick will run first and stop propagation
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(prev => !prev);
  };

  const handleMobileNavigation = (path: string) => {
    setIsMenuOpen(false);
    setTimeout(() => {
      navigate(path);
    }, 10);
  };

  const handleItemClick = (path: string, e: React.MouseEvent) => {
    e.preventDefault();

    setActiveItem(path);

    setTimeout(() => {
      navigate(path);
      setIsMenuOpen(false);
    }, 150);
  };

  const handleSignOut = async () => {
    // Use logoutUser() from auth.ts as single source of truth for clear keys
    // (clears billingCycle, proTrialUsed, trialEndDate, etc. in addition to auth keys)
    logoutUser();
    localStorage.removeItem('userProfileImage');

    // Sign out from doctor portal if active
    if (isDoctorUser || localStorage.getItem('isDoctorAuthenticated') === 'true') {
      localStorage.removeItem('isDoctorAuthenticated');
      localStorage.removeItem('doctorProfile');
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error signing out doctor from Supabase:', err);
      }
      window.dispatchEvent(new Event('doctorAuthChanged'));
    }

    dispatchAuthEvent(false);

    setIsAuthenticated(false);
    setUserEmail('');
    setUserProfileImage(null);
    setIsDoctorUser(false);

    toast({
      title: "Signed out",
      description: "You have been signed out successfully",
    });

    navigate('/');
  };

  const getUserInitials = () => {
    // Get the stored userName from localStorage
    const storedName = localStorage.getItem('userName');

    if (storedName) {
      // Split the name by spaces and get initials from each part
      const nameParts = storedName.split(' ');
      if (nameParts.length > 1) {
        // If there are multiple parts (first and last name), use first letter of first and last name
        return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
      }
      // If there's only one part, use the first letter
      return storedName.charAt(0).toUpperCase();
    }

    // Fallback to email-based initial if userName is not available
    if (!userEmail) return 'U';

    const namePart = userEmail.split('@')[0];
    const cleanName = namePart.replace(/[0-9]/g, '');
    return cleanName.charAt(0).toUpperCase();
  };

  const getUserName = () => {
    // Get the stored userName from localStorage, which comes from the registration process
    const storedName = localStorage.getItem('userName');

    // If the stored name exists, use it
    if (storedName) {
      return storedName;
    }

    // Fallback to email-based name extraction if userName is not available
    if (!userEmail) return 'User';

    const namePart = userEmail.split('@')[0];
    const cleanName = namePart.replace(/[0-9]/g, '');
    return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  };

  const navItems = [
    { path: '/', label: 'Home', icon: <Heart className="mr-2 h-4 w-4" /> },
    { path: '/profile', label: 'Profile', icon: <User className="mr-2 h-4 w-4" /> },
    { path: '/health-report', label: 'Reports', icon: <Heart className="mr-2 h-4 w-4" /> },
    { path: '/nutrition', label: 'Diet', icon: <Apple className="mr-2 h-4 w-4" /> },
    { path: '/wellness', label: 'Wellness', icon: <Sparkles className="mr-2 h-4 w-4" /> },
    ...(isDoctorUser ? [] : [{ path: '/doctor-finder', label: 'Doctors', icon: <UserRound className="mr-2 h-4 w-4" /> }]),
    { path: '/ai-bot', label: 'AI', icon: <Bot className="mr-2 h-4 w-4" /> },
    { path: '/about', label: 'About', icon: <Info className="mr-2 h-4 w-4" /> },
    //  Temporarily disabled Doctor Portal
    ...(isDoctorUser ? [{ path: '/doctor-portal', label: 'Portal', icon: <UserRound className="mr-2 h-4 w-4" /> }] : []),

  ];

  // Load user profile data including profile image
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!isAuthenticated) return;

      setLoadingProfile(true);
      try {
        const data = await getUserProfile();
        if (data.profileImage) {
          setUserProfileImage(data.profileImage);
        }
        if (data.appointmentCredits !== undefined) {
          setAppointmentCredits(data.appointmentCredits);
        }
      } catch (error) {
        console.error('Error fetching user profile image:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfileData();
  }, [isAuthenticated]);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      const fetchProfileImage = async () => {
        if (!isAuthenticated) return;

        try {
          const data = await getUserProfile();
          if (data.profileImage) {
            setUserProfileImage(data.profileImage);
          } else {
            setUserProfileImage(null);
          }
          if (data.appointmentCredits !== undefined) {
            setAppointmentCredits(data.appointmentCredits);
          }
        } catch (error) {
          console.error('Error fetching user profile image on update:', error);
        }
      };

      fetchProfileImage();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [isAuthenticated]);

  // Listen for payment errors dispatched from auth.ts (replaces alert())
  useEffect(() => {
    const handlePaymentError = (event: Event) => {
      const customEvent = event as CustomEvent;
      toast({
        title: "Payment Error",
        description: customEvent.detail?.message || 'Payment verification failed. Please contact support.',
        variant: 'destructive',
      });
    };
    window.addEventListener('paymentError', handlePaymentError);
    return () => window.removeEventListener('paymentError', handlePaymentError);
  }, [toast]);



  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out',
        isScrolled
          ? 'py-2 bg-slate-900 shadow-md text-white'
          : (isHomePage
            ? 'py-3 sm:py-4 bg-transparent border-0 shadow-none'
            : 'py-3 sm:py-4 bg-white shadow-sm text-foreground border-b')
      )}
      style={{
        opacity: showNavbar ? 1 : 0,
        pointerEvents: showNavbar ? 'auto' : 'none',
        transform: `translateY(${showNavbar ? '0' : '-100%'})`,
      }}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link
          to="/"
          className="flex items-center gap-2 shrink-0"
        >
          <img
            src="/medibridge-logo.png"
            alt="MediBridge Logo"
            className={cn(
              "h-8 sm:h-10 w-auto object-contain animate-fade-in",
              (isScrolled || (isHomePage && !isScrolled)) && "brightness-0 invert"
            )}
          />
          <div className="flex flex-col leading-tight animate-fade-in">
            <span
              style={{ fontFamily: "'Lato', sans-serif", fontWeight: 700 }}
              className={cn(
                "text-lg sm:text-xl tracking-tight transition-colors duration-300",
                (isScrolled || (isHomePage && !isScrolled)) ? "text-white" : "text-[#1a7a6d]"
              )}
            >
              Medi<span style={{ fontWeight: 700 }}>Bridge</span>
            </span>
            <span
              style={{ fontFamily: "'Lato', sans-serif", fontWeight: 400 }}
              className={cn(
                "text-[7px] sm:text-[8px] tracking-[0.12em] uppercase transition-colors duration-300",
                (isScrolled || (isHomePage && !isScrolled)) ? "text-white/80" : "text-[#3a9d8f]"
              )}
            >
              Bridging Care, Connecting Health
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center space-x-1">
          {navItems.map((item, index) => {

            if (item.path === '/health-report' && !healthData.completedProfile) {
              return null;
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'px-2 lg:px-3 py-1.5 rounded-full transition-all duration-300 ease-in-out flex items-center text-xs lg:text-sm font-medium whitespace-nowrap',
                  location.pathname === item.path
                    ? 'text-primary bg-primary/10 backdrop-blur-sm'
                    : (isHomePage && !isScrolled ? 'text-white/90 hover:text-white hover:bg-white/10' : 'hover:text-primary hover:bg-black/10')
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}

          <DoctorMenuNavigation />

          {!isAuthenticated && !isDoctorUser ? (
            <Button
              variant={isHomePage && !isScrolled ? "default" : "outline"}
              size="sm"
              className={cn(
                "ml-2 transition-all duration-300",
                (isHomePage && !isScrolled) 
                  ? "bg-white text-[#1a7a6d] hover:bg-white/90 border-0 shadow-lg" 
                  : "border-primary text-primary hover:bg-primary/10 hover:text-primary"
              )}
              onClick={() => navigate('/profile')}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          ) : (
            <div className="ml-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-primary/10 transition-all duration-200"
                    aria-label="User menu"
                  >
                    <Avatar className="h-8 w-8 bg-primary text-white shadow-sm ring-2 ring-white/20">
                      <AvatarImage
                        src={userProfileImage || getGravatarUrl(userEmail, 64)}
                        alt="Profile"
                        className="avatar-image"
                      />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-1">
                    <div className="flex flex-col px-4 py-3">
                      <p className="text-sm font-medium">{getUserName()}</p>
                      <p className="text-xs text-muted-foreground mt-1">{userEmail}</p>
                      {isDoctorUser && (
                        <span className="mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full w-fit">
                          Doctor Account
                        </span>
                      )}
                    </div>
                    {/* Low appointment credits warning */}
                    {!isDoctorUser && appointmentCredits === 1 && (
                      <div className="mx-2 mb-1 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-xs text-amber-800 font-medium">⚠️ 1 appointment credit left</p>
                        <p className="text-xs text-amber-700 mt-0.5">Buy credits to keep seeing doctors.</p>
                      </div>
                    )}
                    <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => isDoctorUser ? navigate('/doctor-portal') : setShowAccountSettings(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{isDoctorUser ? 'Doctor Portal' : 'Account Settings'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/history')}>
                    <History className="mr-2 h-4 w-4" />
                    <span>History</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setShowChangelogDialog(true)}>
                    <Sparkles className="mr-2 h-4 w-4 text-primary" />
                    <span>What's New</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <button
          type="button"
          className={cn(
            "md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-full transition-colors duration-300 focus:outline-none relative overflow-hidden",
            (isHomePage && !isScrolled) ? "text-white hover:bg-white/10" : "text-foreground hover:bg-black/10"
          )}
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          data-mobile-menu="trigger"
        >
          <div 
            className={cn(
              "relative w-6 h-6 flex items-center justify-center transition-transform duration-300 ease-in-out",
              isMenuOpen ? "rotate-90 scale-110" : "rotate-0 scale-100"
            )}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </div>
        </button>
      </div>


      <>
        {/* Backdrop overlay */}
        <div
          className={cn(
            "md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-all duration-300 ease-in-out",
            isMenuOpen
              ? "opacity-100 visible"
              : "opacity-0 invisible"
          )}
          onClick={() => setIsMenuOpen(false)}
          style={{
            top: `calc(56px + env(safe-area-inset-top, 0px))`
          }}
        />

        {/* Mobile menu */}
        <div
          className={cn(
            "md:hidden fixed inset-x-0 top-[var(--nav-height,56px)] bg-white shadow-lg z-40 transition-all duration-500 ease-in-out border-t border-gray-100",
            isMenuOpen
              ? "translate-y-0 opacity-100 visible"
              : "translate-y-[-20px] opacity-0 invisible"
          )}
          style={{
            "--nav-height": `calc(56px + env(safe-area-inset-top, 0px))`,
            top: `calc(56px + env(safe-area-inset-top, 0px))`,
            maxHeight: isMenuOpen ? "80vh" : "0",
            overflow: "hidden",
          } as React.CSSProperties}
          data-mobile-menu="content"
        >
          <div className={cn(
            "container mx-auto px-4 flex flex-col space-y-2 transition-all duration-500 ease-in-out",
            isMenuOpen ? "py-4 opacity-100" : "py-0 opacity-0"
          )}
            style={{
              maxHeight: isMenuOpen ? "calc(90vh - 56px)" : "0",
              overflow: "auto"
            }}>
            {(isAuthenticated || isDoctorUser) && (
              <>
                <div
                  onClick={() => setShowAccountSettings(true)}
                  className="flex items-center space-x-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl mb-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Avatar className="h-10 w-10 bg-primary text-white">
                      {userProfileImage ? (
                      <AvatarImage
                        src={userProfileImage}
                        alt="Profile"
                        className="avatar-image"
                        key="avatar-image"
                      />
                    ) : (
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-foreground">{getUserName()}</p>
                    <p className="text-xs text-muted-foreground">{userEmail}</p>
                    {isDoctorUser && (
                      <span className="mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full w-fit">
                        Doctor Account
                      </span>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator className="my-1" />
              </>
            )}

            {navItems.map((item) => {

              if (item.path === '/health-report' && !healthData.completedProfile) {
                return null;
              }

              const isActive = location.pathname === item.path;
              const isAnimating = activeItem === item.path;

              return (
                <div
                  key={item.path}
                  onClick={() => handleMobileNavigation(item.path)}
                  className={cn(
                    'px-4 py-3 rounded-xl transition-all duration-300 ease-in-out flex items-center mobile-touch-target cursor-pointer',
                    isActive
                      ? 'text-primary bg-primary/10 font-medium'
                      : 'text-foreground hover:text-primary hover:bg-black/5',
                    isAnimating && 'animate-tap-effect'
                  )}
                >
                  <span className={cn(
                    'flex items-center',
                    isAnimating && 'animate-scale-in'
                  )}>
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </span>
                </div>
              );
            })}

            {(isAuthenticated || isDoctorUser) && (
              <div
                onClick={() => handleMobileNavigation('/history')}
                className="px-4 py-3 rounded-xl transition-all duration-300 ease-in-out flex items-center mobile-touch-target cursor-pointer text-foreground hover:text-primary hover:bg-black/5"
              >
                <History className="mr-2 h-4 w-4" />
                <span>History</span>
              </div>
            )}

            {!isAuthenticated && !isDoctorUser ? (
              <div
                onClick={() => handleMobileNavigation('/profile')}
                className="mt-2 px-4 py-3 rounded-xl bg-primary/10 text-primary font-medium flex items-center mobile-touch-target cursor-pointer"
              >
                <LogIn className="mr-2 h-4 w-4" />
                <span>Sign In</span>
              </div>
            ) : (
              <Button
                variant="ghost"
                className="mt-2 px-4 py-3 rounded-xl bg-destructive/10 text-destructive font-medium flex items-center justify-start w-full mobile-touch-target"
                onClick={() => {
                  setIsMenuOpen(false);
                  handleSignOut();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            )}

            {(isAuthenticated || isDoctorUser) && (
              <div
                onClick={() => {
                  setIsMenuOpen(false);
                  setShowChangelogDialog(true);
                }}
                className="px-4 py-3 rounded-xl flex items-center space-x-3 hover:bg-accent mobile-touch-target cursor-pointer text-foreground hover:text-primary hover:bg-black/5"
              >
                <Sparkles className="h-5 w-5 text-primary" />
                <span>What's New</span>
              </div>
            )}


          </div>
        </div>
      </>

      {showAccountSettings && (
        <AccountSettings
          isOpen={showAccountSettings}
          onClose={() => setShowAccountSettings(false)}
        />
      )}

      {showChangelogDialog && (
        <ChangelogDialog
          isOpen={showChangelogDialog}
          onClose={() => setShowChangelogDialog(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;
