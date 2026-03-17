import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';

const TestimonialsSection = () => {
  const scrollRef = useRef(null);
  const isInView = useInView(scrollRef, { once: true, amount: 0.2 });

  const testimonials = [
    {
      name: "Rahul Sharma",
      role: "Software Engineer",
      content: "MediBridge completely changed how I look at my diet. The AI food scanner revealed so many hidden sugars in my 'healthy' snacks. I've lost 5kg since I started using the Pro version.",
      rating: 5,
      avatar: "R"
    },
    {
      name: "Priya Patel",
      role: "Waitlist User",
      content: "As someone with a chronic condition, the daily health insights and the 24/7 AI doctor have been lifesavers. It doesn't replace my actual doctor, but it gives me peace of mind at 2 AM.",
      rating: 5,
      avatar: "P"
    },
    {
      name: "Amit Desai",
      role: "Fitness Enthusiast",
      content: "The way MediBridge connects all my fragmented health data into one single, readable report is brilliant. Best 99 rupees I spend every month.",
      rating: 5,
      avatar: "A"
    }
  ];

  return (
    <section ref={scrollRef} className="py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-health-sky/10 text-health-sky hover:bg-health-sky/20 mb-6">
            Real Stories
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900 tracking-tight">
            Loved by Thousands across <span className="text-health-sky">India</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Don't just take our word for it. Here is what our community is saying about MediBridge.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
            >
              <Card className="h-full border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 group bg-gray-50/50">
                <CardContent className="p-8 flex flex-col h-full relative">
                  <Quote className="absolute top-6 right-6 w-12 h-12 text-gray-200 -z-10 group-hover:text-health-sky/10 transition-colors duration-300" />
                  
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  
                  <p className="text-gray-700 italic flex-grow mb-6 leading-relaxed relative z-10">
                    "{testimonial.content}"
                  </p>
                  
                  <div className="flex items-center mt-auto relative z-10">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-health-sky to-health-lavender flex items-center justify-center text-white font-bold text-xl shadow-md">
                      {testimonial.avatar}
                    </div>
                    <div className="ml-4">
                      <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
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

export default TestimonialsSection;
