import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "Is my health data secure?",
      answer: "Absolutely. We employ bank-level encryption (AES-256) to secure your data both in transit and at rest. Your health information is strictly confidential, and we are fully compliant with Indian healthcare data regulations. We never sell your data to third parties."
    },
    {
      question: "Is the AI a replacement for my doctor?",
      answer: "No. MediBridge's AI is designed to assist and inform, not replace professional medical diagnosis. It helps you understand symptoms, decodes complex medical jargon, and suggests preventive lifestyle changes, but you should always consult a licensed doctor for actual medical treatment."
    },
    {
      question: "What is included in the Free plan?",
      answer: "The Free plan gives you access to a basic health profile, standard tracking tools, and limited daily queries to our AI assistant. It's a great way to start taking control of your health at no cost."
    },
    {
      question: "How does the food scanner work?",
      answer: "Simply snap a photo of a food item or ingredient list. Our AI instantly analyzes the image, identifies the ingredients, and flags any potential allergens or harmful additives based on your personalized health profile."
    },
    {
      question: "Can I cancel my Pro subscription anytime?",
      answer: "Yes, you can upgrade, downgrade, or cancel your Pro subscription at any time right from your account dashboard. 100% hassle-free."
    }
  ];

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 bg-gray-50/50">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900 tracking-tight">
            Frequently Asked <span className="text-health-mint">Questions</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about MediBridge and how it works.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`border rounded-2xl overflow-hidden transition-all duration-300 ${openIndex === index ? 'bg-white shadow-md border-health-mint/30' : 'bg-transparent border-gray-200 hover:border-gray-300'}`}
            >
              <button
                onClick={() => toggleAccordion(index)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
              >
                <h3 className={`text-lg font-semibold transition-colors duration-300 ${openIndex === index ? 'text-health-mint' : 'text-gray-900'}`}>
                  {faq.question}
                </h3>
                <div className={`ml-4 shrink-0 p-2 rounded-full flex items-center justify-center transition-colors duration-300 ${openIndex === index ? 'bg-health-mint/10 text-health-mint' : 'bg-gray-100 text-gray-500'}`}>
                  {openIndex === index ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
