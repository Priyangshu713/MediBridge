import React from 'react';
import { motion, useInView } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Zap, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const PricingSection = () => {
  const navigate = useNavigate();
  const pricingRef = React.useRef(null);
  const isInView = useInView(pricingRef, { once: true, amount: 0.2 });

  const plans = [
    {
      name: "Basic",
      price: "Free",
      description: "Everything you need to start understanding your health.",
      features: [
        "Basic Health Profile",
        "Limited daily API queries",
        "Standard health tracking",
        "Community support"
      ],
      missingFeatures: [
        "Advanced AI Health Assistant",
        "Unlimited food scanning",
        "Free Doctor Visits"
      ],
      buttonText: "Get Started",
      buttonVariant: "outline" as const,
      popular: false
    },
    {
      name: "MediBridge Lite",
      price: "Starts from ₹49",
      description: "Standard AI features to build your optimal health routine.",
      features: [
        "Everything in Basic",
        "AI-powered health recommendations",
        "Personalized nutrition suggestions",
        "Basic health insights"
      ],
      missingFeatures: [
        "Free Doctor Visits",
        "Advanced premium Gemini models",
        "Detailed health reports & trends",
        "Custom meal planning & recipes",
      ],
      buttonText: "Choose Lite",
      buttonVariant: "outline" as const,
      popular: false
    },
    {
      name: "MediBridge Pro",
      price: "Starts from ₹149",
      description: "Premium features and free consultations for total optimization.",
      features: [
        "Everything in Lite",
        "Free Doctor Visits included",
        "Advanced premium Gemini models",
        "Detailed health reports & trends",
        "Custom meal planning & recipes",
        "Priority Support"
      ],
      missingFeatures: [],
      buttonText: "Upgrade to Pro",
      buttonVariant: "default" as const,
      popular: true,
      asterisk: "* Includes complimentary doctor visit credits."
    }
  ];

  return (
    <section ref={pricingRef} className="py-24 bg-gray-50 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-health-lavender/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-t from-health-mint/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900 tracking-tight">
            Simple, Transparent <span className="text-health-lavender">Pricing</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Start for free, upgrade when you need the full power of our AI health ecosystem.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.2 }}
            >
              <Card className={`h-full relative overflow-hidden flex flex-col border-2 ${plan.popular ? 'border-health-lavender shadow-xl scale-100 md:scale-105 z-10' : 'border-gray-200 shadow-sm'}`}>
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-health-lavender text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center shadow-md">
                    <Zap className="w-3 h-3 mr-1" /> MOST POPULAR
                  </div>
                )}
                <CardContent className="p-6 md:p-8 flex flex-col flex-grow">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-sm text-gray-500 min-h-[40px]">{plan.description}</p>
                  </div>

                  <div className="mb-6 pb-6 border-b border-gray-100">
                    <div className="flex items-baseline">
                      <span className="text-3xl xl:text-4xl font-extrabold text-gray-900">{plan.price}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6 flex-grow">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start text-sm">
                        <CheckCircle2 className={`w-4 h-4 mr-2 mt-0.5 shrink-0 ${plan.popular ? 'text-health-lavender' : 'text-health-mint'}`} />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                    {plan.missingFeatures.map((feature, i) => (
                      <li key={`missing-${i}`} className="flex items-start opacity-50 text-sm">
                        <X className="w-4 h-4 mr-2 mt-0.5 shrink-0 text-gray-400" />
                        <span className="text-gray-500 line-through">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    {plan.asterisk && (
                      <p className="text-[10px] text-muted-foreground italic text-center mb-3">
                        {plan.asterisk}
                      </p>
                    )}
                    <Button
                      variant={plan.buttonVariant}
                      className={`w-full py-5 rounded-xl transition-all duration-300 font-semibold ${plan.popular ? 'bg-health-lavender hover:bg-health-lavender/90 text-white shadow-lg shadow-health-lavender/25' : ''}`}
                      onClick={() => navigate('/profile')}
                    >
                      {plan.buttonText}
                      {plan.popular && <ArrowRight className="w-4 h-4 ml-2" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
