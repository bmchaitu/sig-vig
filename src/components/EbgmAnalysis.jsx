import React from 'react';
import { useTheme } from './ThemeProvider';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const EbgmAnalysis = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const cliniFinesseTheme = {
    primary: '#57c1ef',
    secondary: '#ee3739',
    background: theme === 'dark' ? '#1a1a1a' : '#f8f9fa',
    surface: theme === 'dark' ? '#2d2d2d' : '#ffffff',
    text: theme === 'dark' ? '#ffffff' : '#2c3e50',
    textSecondary: theme === 'dark' ? '#b0b0b0' : '#6c757d',
    border: theme === 'dark' ? '#404040' : '#e1e5e9',
    shadow: theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
  };

  return (
    <div 
      className="min-h-screen transition-colors duration-200"
      style={{ backgroundColor: cliniFinesseTheme.background }}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-24 h-24 rounded-2xl flex items-center justify-center mb-8"
            style={{ 
              backgroundColor: `${cliniFinesseTheme.secondary}20`,
              color: cliniFinesseTheme.secondary
            }}
          >
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-bold mb-4 specimen-font"
            style={{ color: cliniFinesseTheme.text }}
          >
            Coming Soon
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg mb-8 max-w-2xl specimen-font-medium"
            style={{ color: cliniFinesseTheme.textSecondary }}
          >
            We're working on implementing EBGM (Empirical Bayes Geometric Mean) analysis. 
            This advanced signal detection method will be available in a future update.
          </motion.p>

          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-xl text-sm specimen-font-medium flex items-center gap-2"
            style={{
              backgroundColor: cliniFinesseTheme.surface,
              color: cliniFinesseTheme.text,
              border: `1px solid ${cliniFinesseTheme.border}`,
              boxShadow: `0 4px 12px ${cliniFinesseTheme.shadow}`
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default EbgmAnalysis; 