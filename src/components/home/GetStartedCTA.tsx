import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Zap, Activity } from 'lucide-react';

const GetStartedCTA = () => {
  const navigate = useNavigate();
  const ctaRef = React.useRef(null);
  const isInView = useInView(ctaRef, { once: true, amount: 0.2 });

  const benefits = [
    { icon: <Zap className="w-5 h-5 text-yellow-400" />, text: "Setup takes 2 minutes" },
    { icon: <ShieldCheck className="w-5 h-5 text-green-400" />, text: "100% HIPAA Compliant" },
    { icon: <Activity className="w-5 h-5 text-blue-400" />, text: "Cancel anytime" },
  ];

  return (
    <section ref={ctaRef} className="py-24 relative overflow-hidden bg-white">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          className="max-w-4xl mx-auto bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2.5rem] p-10 md:p-16 text-center text-white shadow-2xl relative overflow-hidden"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          {/* Decorative background elements inside the card */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-health-lavender/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-health-sky/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
              Ready to take control <br className="hidden md:block" />
              of your health?
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto font-light">
              Be among the first to experience how MediBridge AI can help you understand your body and live a healthier life.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button
                size="lg"
                className="w-full sm:w-auto text-lg px-10 py-7 rounded-full bg-white text-gray-900 hover:bg-gray-100 shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => navigate('/profile')}
              >
                Get Started for Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-lg px-10 py-7 rounded-full bg-transparent border-2 border-gray-600 text-white hover:bg-white/10 transition-all duration-300"
                onClick={() => navigate('/nutrition')}
              >
                Try Food Scanner
              </Button>
            </div>
            
            <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-10 text-gray-400 text-sm font-medium">
              {benefits.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-white/10">
                    {item.icon}
                  </div>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default GetStartedCTA;
