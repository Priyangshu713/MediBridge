import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity, Stethoscope, Bot } from 'lucide-react';

const TrustBar = () => {
  const partners = [
    { name: "Advanced AI Models", icon: <Bot className="w-6 h-6 mr-2" /> },
    { name: "End-to-End Encrypted", icon: <ShieldCheck className="w-6 h-6 mr-2" /> },
    { name: "Verified Healthcare Professionals", icon: <Stethoscope className="w-6 h-6 mr-2" /> },
    { name: "24/7 Health Monitoring", icon: <Activity className="w-6 h-6 mr-2" /> },
  ];

  return (
    <section className="py-10 bg-muted/30 border-b border-muted">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm font-semibold text-muted-foreground mb-8 uppercase tracking-widest">
          BUILT FOR SECURE, INTELLIGENT, AND ACCESSIBLE HEALTHCARE
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60">
          {partners.map((partner, index) => (
            <div key={index} className="flex items-center text-gray-500 hover:text-gray-900 transition-colors duration-300">
              {partner.icon}
              <span className="font-bold text-lg md:text-xl tracking-tight">{partner.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBar;
