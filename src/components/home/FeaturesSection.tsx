import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { HeartPulse, Utensils, Brain, Shield, BarChart, ArrowRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link } from 'react-router-dom';

const FeaturesSection = () => {
  const isMobile = useIsMobile();
  const featuresRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, amount: isMobile ? 0.1 : 0.2 });

  return (
    <section ref={featuresRef} className="py-20 md:py-32 px-4 relative overflow-hidden bg-white">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-health-lavender/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-health-mint/10 blur-3xl pointer-events-none" />

      <motion.div
        className="container mx-auto text-center mb-16"
        initial={{ opacity: 0, y: 30 }}
        animate={featuresInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
      >
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-health-lavender/10 text-health-lavender hover:bg-health-lavender/20 mb-6">
          Everything You Need
        </div>
        <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900 tracking-tight">
          Your Health, <span className="text-health-lavender">Simplified.</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
          We bring all your health data into one powerful, easy-to-use platform. No more guessing, just clear insights.
        </p>
      </motion.div>

      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(250px,auto)]">
          {/* Feature 1 - Large spanning card */}
          <motion.div
            className="md:col-span-2 md:row-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="h-full border-none shadow-xl overflow-hidden bg-gradient-to-br from-health-lavender/20 via-white to-health-sky/10 group relative">
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-8 md:p-12 h-full flex flex-col justify-between relative z-10">
                <div>
                  <div className="p-4 rounded-2xl bg-white shadow-sm inline-block mb-6">
                    <HeartPulse className="h-8 w-8 text-health-lavender" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">Personalized Health Insights</h3>
                  <p className="text-lg text-gray-600 max-w-md">
                    Stop treating symptoms and start understanding your body. Our AI analyzes your unique physiology to deliver custom recommendations that actually work for you.
                  </p>
                </div>
                <div className="mt-8">
                  <Link to="/profile" className="inline-flex items-center text-health-lavender font-semibold hover:gap-2 transition-all">
                    View Your Profile <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Feature 2 - Small top right */}
          <motion.div
            className="md:col-span-1 md:row-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="h-full border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
              <CardContent className="p-8 flex flex-col h-full justify-center">
                <div className="p-3 rounded-xl bg-health-mint/10 w-fit mb-4">
                  <Utensils className="h-6 w-6 text-health-mint" />
                </div>
                <h3 className="text-xl font-bold mb-2">Nutrition AI</h3>
                <p className="text-sm text-gray-600">Know exactly what you're eating. Instantly analyze meals and get healthier alternatives.</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Feature 3 - Small bottom right */}
          <motion.div
            className="md:col-span-1 md:row-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="h-full border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
              <CardContent className="p-8 flex flex-col h-full justify-center">
                <div className="p-3 rounded-xl bg-health-sky/10 w-fit mb-4">
                  <BarChart className="h-6 w-6 text-health-sky" />
                </div>
                <h3 className="text-xl font-bold mb-2">Smart Tracking</h3>
                <p className="text-sm text-gray-600">Visualize your progress. See how small habits compound into massive health gains.</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Feature 4 - Medium bottom span 2 */}
          <motion.div
            className="md:col-span-2 md:row-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="h-full border-none shadow-lg bg-gradient-to-r from-gray-900 to-gray-800 text-white overflow-hidden relative group">
              <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between h-full relative z-10">
                <div className="max-w-lg mb-6 md:mb-0">
                  <div className="p-3 rounded-xl bg-white/10 w-fit mb-4 backdrop-blur-sm">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">AI Doctor Assistance</h3>
                  <p className="text-gray-300">Get 24/7 answers to pressing health questions from an AI trained on modern medical literature.</p>
                </div>
                <Link to="/ai-bot" className="px-6 py-3 bg-white text-gray-900 font-bold rounded-full hover:bg-gray-100 transition-colors whitespace-nowrap">
                  Chat Now
                </Link>
              </CardContent>
            </Card>
          </motion.div>

           {/* Feature 5 - Small bottom left */}
          <motion.div
            className="md:col-span-1 md:row-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="h-full border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
              <CardContent className="p-8 flex flex-col h-full justify-center">
                <div className="p-3 rounded-xl bg-health-cream/30 w-fit mb-4">
                  <Shield className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Preventive Care</h3>
                <p className="text-sm text-gray-600">Stay ahead of issues before they become problems with predictive algorithms.</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
