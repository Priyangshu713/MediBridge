
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import { Heart } from 'lucide-react';

interface AuthViewProps {
  onLoginSuccess?: () => void;
}

const AuthView = ({ onLoginSuccess }: AuthViewProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-20"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="w-full max-w-md mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center justify-center gap-2">
          <Heart className="text-primary h-8 w-8" />
          MediBridge
        </h1>
        <p className="text-base text-muted-foreground font-medium">Your personalized wellness journey</p>
      </motion.div>

      <motion.div variants={itemVariants} className="w-full max-w-md">
        <Card className="bg-white border-muted/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-2xl">
          <CardHeader className="space-y-1 pb-4 pt-8">
            <CardTitle className="text-2xl font-bold text-center tracking-tight">
              {activeTab === 'login' ? 'Welcome back' : 'Create an account'}
            </CardTitle>
            <CardDescription className="text-center text-sm">
              {activeTab === 'login'
                ? 'Enter your details below to sign in'
                : 'Join MediBridge to start your journey'}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="flex justify-center p-1 mb-6 bg-muted/50 rounded-lg">
              <div
                className={`flex-1 text-center py-1.5 text-sm font-medium rounded-md cursor-pointer transition-all duration-200 
                  ${activeTab === 'login'
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab('login')}
              >
                Log in
              </div>
              <div
                className={`flex-1 text-center py-1.5 text-sm font-medium rounded-md cursor-pointer transition-all duration-200 
                  ${activeTab === 'signup'
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab('signup')}
              >
                Sign up
              </div>
            </div>

            <div className="relative w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: activeTab === 'login' ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: activeTab === 'login' ? 20 : -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="w-full"
                >
                  {activeTab === 'login' ? <LoginForm onLoginSuccess={onLoginSuccess} /> : <SignupForm />}
                </motion.div>
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Doctor portal link */}
      <motion.div variants={itemVariants} className="mt-8">
        <p className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/doctor-portal')}>
          Are you a medical professional?
        </p>
      </motion.div>
    </motion.div>
  );
};

export default AuthView;
