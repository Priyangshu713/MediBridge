import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Sparkles, MessageSquare, Laptop, Apple, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ProductShowcase = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: "Your Health Command Center",
      description: "Your body is constantly signaling its needs. Are you listening? Without our Daily Smart Insights, you're flying blind. Take control before small issues become big problems. Get tailored insights that adapt to your unique physiology.",
      image: "/showcase/dashboard.png",
      icon: <Sparkles className="h-6 w-6 text-health-lavender" />,
      align: "left",
      benefits: ["Daily Smart Insights", "Comprehensive Health Stats", "Personalized Recommendations"],
      path: "/profile"
    },
    {
      title: "AI Doctor in Your Pocket",
      description: "Medical uncertainty is stressful. Why guess? Get instant, context-aware answers from an AI that knows your history. It's like having a doctor on speed dial, 24/7, ready to answer your most pressing health questions.",
      image: "/showcase/mobile_chat.png",
      icon: <MessageSquare className="h-6 w-6 text-health-blue" />,
      align: "right",
      benefits: ["24/7 Availability", "Context-Aware Responses", "Secure & Private"],
      path: "/ai-bot"
    },
    {
      title: "Precision Nutrition",
      description: "Hidden ingredients are sabotaging your health. Our AI analyzes your food in seconds, revealing what labels hide. Eat with confidence, not confusion. Transform your diet from a guessing game into a precise science.",
      image: "/showcase/nutrition.png",
      icon: <Apple className="h-6 w-6 text-green-500" />,
      align: "left",
      benefits: ["Instant Food Analysis", "Hidden Ingredient Detection", "Personalized Diet Advice"],
      path: "/nutrition"
    },
    {
      title: "The Full Picture",
      description: "Fragmented data leads to missed diagnoses. Our comprehensive Health Reports connect the dots between your sleep, stress, and vitals. See the big picture you've been missing and uncover trends that define your long-term health.",
      image: "/showcase/report.png",
      icon: <Heart className="h-6 w-6 text-red-500" />,
      align: "right",
      benefits: ["Holistic Health Analysis", "Trend Identification", "Actionable Reports"],
      path: "/health-report"
    },
    {
      title: "Seamless Cross-Platform Experience",
      description: "Track your progress anywhere. Your health data syncs instantly across all your devices, ensuring you have your complete health history whenever you need it.",
      image: "/showcase/cross_platform.png",
      icon: <Laptop className="h-6 w-6 text-health-green" />,
      align: "left",
      benefits: ["Real-time Sync", "Mobile & Desktop Support", "Unified Health History"],
      path: "/history"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-white to-health-lavender/5 overflow-hidden">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-health-lavender-dark">
              Experience the Future of Health
            </h2>
            <p className="text-lg text-muted-foreground">
              A complete ecosystem designed to help you understand, track, and improve your health with the power of AI.
            </p>
          </motion.div>
        </div>

        <div className="space-y-32">
          {features.map((feature, index) => (
            <div key={index} className={`flex flex-col ${feature.align === 'right' ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-20`}>
              {/* Text Content */}
              <motion.div
                className="flex-1 space-y-8"
                initial={{ opacity: 0, x: feature.align === 'left' ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-white shadow-sm border border-health-lavender/10">
                    {feature.icon}
                  </div>
                  <span className="text-sm font-bold text-health-lavender uppercase tracking-wider">
                    {feature.title.split(' ')[0]} Feature
                  </span>
                </div>

                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                  {feature.title}
                </h3>

                <p className="text-lg text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                <ul className="space-y-4">
                  {feature.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-health-green shrink-0" />
                      <span className="font-medium text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => navigate(feature.path)}
                  className="bg-health-lavender hover:bg-health-lavender/90 text-white rounded-full px-8 py-6 text-lg shadow-lg shadow-health-lavender/20 hover:shadow-xl hover:shadow-health-lavender/30 transition-all duration-300 group"
                >
                  Try It Now
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>

              {/* Image Content */}
              <motion.div
                className="flex-1 relative"
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl shadow-health-lavender/20 border border-white/20 bg-white/50 backdrop-blur-sm">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-700"
                  />
                </div>

                {/* Decorative elements */}
                <div className="absolute -inset-4 bg-gradient-to-r from-health-lavender/20 to-health-blue/20 rounded-[2rem] blur-2xl -z-10 opacity-60" />
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-health-lavender/10 rounded-full blur-3xl -z-10" />
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-health-blue/10 rounded-full blur-3xl -z-10" />
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
