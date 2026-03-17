import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Instagram, Linkedin, Mail, Heart } from 'lucide-react';

const HomeFooter = () => {
  return (
    <footer className="bg-white pt-20 pb-10 border-t border-gray-100">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          
          {/* Brand & Description Column (Spans 2 columns on lg screens) */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6 text-2xl">
              <img
                src="/medibridge-logo.png"
                alt="MediBridge Logo"
                className="h-10 w-auto object-contain"
              />
              <div className="flex flex-col leading-tight">
                <span
                  style={{ fontFamily: "'Lato', sans-serif", fontWeight: 700 }}
                  className="text-xl tracking-tight text-[#1a7a6d]"
                >
                  MediBridge
                </span>
                <span
                  style={{ fontFamily: "'Lato', sans-serif", fontWeight: 400 }}
                  className="text-[8px] tracking-[0.15em] text-[#3a9d8f] uppercase"
                >
                  Bridging Care, Connecting Health
                </span>
              </div>
            </Link>
            <p className="text-gray-500 mb-8 max-w-sm leading-relaxed">
              Empowering individuals to take control of their health through AI-driven insights, 
              precision nutrition, and comprehensive medical tracking.
            </p>
            <div className="flex items-center gap-4 text-gray-400">
              <a href="#" className="hover:text-health-lavender transition-colors p-2 rounded-full hover:bg-health-lavender/10"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="hover:text-health-lavender transition-colors p-2 rounded-full hover:bg-health-lavender/10"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="hover:text-health-lavender transition-colors p-2 rounded-full hover:bg-health-lavender/10"><Linkedin className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-bold text-gray-900 mb-6 uppercase text-sm tracking-wider">Product</h4>
            <ul className="space-y-4 text-gray-600">
              <li><Link to="/profile" className="hover:text-health-lavender transition-colors">Digital Health Profile</Link></li>
              <li><Link to="/nutrition" className="hover:text-health-lavender transition-colors">Nutrition Scanner</Link></li>
              <li><Link to="/ai-bot" className="hover:text-health-lavender transition-colors">AI Health Assistant</Link></li>
              <li><Link to="/health-report" className="hover:text-health-lavender transition-colors">Comprehensive Reports</Link></li>
              <li><Link to="/history" className="hover:text-health-lavender transition-colors">Medical History</Link></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-bold text-gray-900 mb-6 uppercase text-sm tracking-wider">Company</h4>
            <ul className="space-y-4 text-gray-600">
              <li><Link to="/about" className="hover:text-health-lavender transition-colors">About Us</Link></li>
              <li><Link to="/careers" className="hover:text-health-lavender transition-colors">Careers</Link></li>
              <li><Link to="/blog" className="hover:text-health-lavender transition-colors">Health Blog</Link></li>
              <li><Link to="/contact" className="hover:text-health-lavender transition-colors">Contact Support</Link></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-bold text-gray-900 mb-6 uppercase text-sm tracking-wider">Legal</h4>
            <ul className="space-y-4 text-gray-600">
              <li><Link to="/terms-privacy?tab=terms" className="hover:text-health-lavender transition-colors">Terms of Service</Link></li>
              <li><Link to="/terms-privacy?tab=privacy" className="hover:text-health-lavender transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-privacy?tab=cookies" className="hover:text-health-lavender transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
          
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} MediBridge Inc. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm flex items-center">
            Made with <Heart className="w-4 h-4 mx-1 text-red-500 fill-red-500" /> in India
          </p>
        </div>
      </div>
    </footer>
  );
};

export default HomeFooter;
