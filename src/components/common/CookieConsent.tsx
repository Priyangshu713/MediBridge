import React, { useState, useEffect } from 'react';
import { Cookie, Shield, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const COOKIE_CONSENT_KEY = 'medibridge_cookie_consent';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
}

const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,   // Always on
    analytics: true,    // Default on
  });

  useEffect(() => {
    // Only show if user hasn't made a choice yet
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay so it doesn't flash on page load
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = (accepted: 'all' | 'selected' | 'necessary') => {
    const finalPrefs: CookiePreferences = {
      necessary: true,
      analytics: accepted === 'all' ? true : accepted === 'selected' ? preferences.analytics : false,
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      ...finalPrefs,
      consentDate: new Date().toISOString(),
    }));

    setClosing(true);
    setTimeout(() => setVisible(false), 400);
  };

  if (!visible) return null;

  return (
    <>
      {/* Subtle Backdrop */}
      <div
        className={`fixed inset-0 z-[9998] bg-black/5 backdrop-blur-[1px] transition-opacity duration-500 ${closing ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Banner Container */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[9999] px-4 pb-4 sm:px-6 sm:pb-6 transition-all duration-500 ease-out flex justify-center ${closing ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}
        style={{ animation: closing ? 'none' : 'cookieSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div
          className="w-full max-w-[800px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 overflow-hidden flex flex-col md:flex-row"
        >
          {/* Left Side: Desktop decorative strip */}
          <div className="hidden md:block w-2 bg-gradient-to-b from-[#1a7a6d] via-[#3a9d8f] to-teal-400"></div>

          {/* Top Edge: Mobile decorative strip */}
          <div className="md:hidden h-1.5 w-full bg-gradient-to-r from-[#1a7a6d] via-[#3a9d8f] to-teal-400"></div>

          <div className="flex-1 p-5 sm:p-6 lg:p-7">
            
            {/* Header Area */}
            <div className="flex items-start gap-4 mb-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm border border-teal-50"
                style={{ background: 'linear-gradient(135deg, #f0fdfa, #ccfbf1)' }}
              >
                <Cookie className="h-6 w-6 text-[#1a7a6d]" />
              </div>
              
              <div className="flex-1 pt-0.5">
                <h3 className="text-lg font-bold text-slate-800 tracking-tight" style={{ fontFamily: "'Lato', sans-serif" }}>
                  Your Privacy Matters
                </h3>
                <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
                  We use cookies to ensure secure authentication and to analyze traffic so we can improve MediBridge. 
                  <button 
                    onClick={() => setShowDetails(!showDetails)}
                    className="ml-1 text-[#1a7a6d] font-medium hover:text-[#0f4d45] underline underline-offset-2 transition-colors inline-block"
                  >
                    Customise preferences
                  </button>
                  <span className="mx-1.5 text-slate-300">•</span>
                  <Link to="/terms-privacy" className="text-slate-400 hover:text-slate-600 transition-colors inline-block">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>

            {/* Expandable Preferences Area */}
            <div
              className="overflow-hidden transition-all duration-400 ease-in-out pl-0 md:pl-16"
              style={{ 
                maxHeight: showDetails ? '300px' : '0', 
                opacity: showDetails ? 1 : 0,
                marginTop: showDetails ? '16px' : '0'
              }}
            >
              <div className="space-y-3 pb-5 border-t border-slate-100 pt-4">
                {/* Necessary Cookies - Fixed */}
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-[#3a9d8f] shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Strictly Necessary</p>
                      <p className="text-xs text-slate-500 mt-0.5">Required for secure login and session management.</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1a7a6d] bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-full whitespace-nowrap ml-3">
                    Always Active
                  </span>
                </div>

                {/* Analytics Cookies - Toggleable */}
                <div className="flex items-center justify-between bg-white border border-slate-200/60 shadow-sm rounded-xl px-4 py-3 cursor-pointer hover:border-teal-200 hover:shadow-md transition-all" onClick={() => setPreferences(p => ({ ...p, analytics: !p.analytics }))}>
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-purple-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Analytics & Performance</p>
                      <p className="text-xs text-slate-500 mt-0.5">Helps us understand how you use the platform.</p>
                    </div>
                  </div>
                  
                  {/* Custom Toggle Switch */}
                  <div className="ml-3 shrink-0">
                    <div className={`relative h-6 w-11 rounded-full transition-colors duration-300 ease-in-out border ${preferences.analytics ? 'bg-[#3a9d8f] border-[#3a9d8f]' : 'bg-slate-200 border-slate-300'}`}>
                      <span className={`absolute top-[2px] left-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out ${preferences.analytics ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={`flex flex-col sm:flex-row items-center justify-end gap-3 ${showDetails ? '' : 'mt-4 md:-mt-10'}`}>
              
              <button
                onClick={() => handleClose('necessary')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full text-[13px] font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 active:scale-95"
              >
                Deny Optional
              </button>

              {showDetails && (
                <button
                  onClick={() => handleClose('selected')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full text-[13px] font-semibold text-[#1a7a6d] bg-teal-50 border border-teal-100 hover:bg-teal-100 transition-all duration-200 active:scale-95"
                >
                  Save Preferences
                </button>
              )}

              <button
                onClick={() => handleClose('all')}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full text-[13px] font-bold text-white shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #1a7a6d, #3a9d8f)',
                }}
              >
                Accept All
              </button>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes cookieSlideUp {
          from {
            transform: translateY(100%) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default CookieConsent;
