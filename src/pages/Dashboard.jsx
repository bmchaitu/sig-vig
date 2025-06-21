import React, { useState } from 'react';
import { useTheme } from '../components/ThemeProvider';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hoveredCard, setHoveredCard] = useState(null);

  // Theme configuration
  const cliniFinesseTheme = {
    primary: '#57c1ef',
    secondary: '#ee3739',
    background: theme === 'dark' ? '#1a1a1a' : '#f8f9fa',
    surface: theme === 'dark' ? '#2d2d2d' : '#ffffff',
    surfaceHover: theme === 'dark' ? '#353535' : '#f0f0f0',
    border: theme === 'dark' ? '#404040' : '#e1e5e9',
    text: theme === 'dark' ? '#ffffff' : '#2c3e50',
    textSecondary: theme === 'dark' ? '#b0b0b0' : '#6c757d',
    warning: '#ffc107',
    success: '#4caf50',
    shadow: theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
  };

  const analysisTools = [
    {
      id: 'prr-chi',
      title: 'PRR & Chi-Square',
      subtitle: 'Statistical Signal Detection',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      status: 'active',
      path: '/prr-chi'
    },
    {
      id: 'ebgm',
      title: 'EBGM Analysis',
      subtitle: 'Bayesian Data Mining',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      status: 'coming_soon',
      path: '/ebgm'
    }
  ];

  return (
    <div 
      className="min-h-screen transition-colors duration-200 pt-24 pb-8 sm:pt-28 md:pt-32"
      style={{ backgroundColor: cliniFinesseTheme.background }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Welcome Section */}
        <div className="mb-8 sm:mb-12 md:mb-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 
              className="text-3xl sm:text-4xl md:text-5xl font-bold specimen-font mb-4"
              style={{ color: cliniFinesseTheme.text }}
            >
              Welcome back, {user?.username}
            </h1>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-3">
              <div 
                className="px-4 py-1.5 rounded-full text-sm specimen-font-medium"
                style={{ 
                  backgroundColor: `${cliniFinesseTheme.primary}15`,
                  color: cliniFinesseTheme.primary
                }}
              >
                Data Analysis Tools
              </div>
              <div 
                className="px-4 py-1.5 rounded-full text-sm specimen-font-medium"
                style={{ 
                  backgroundColor: `${cliniFinesseTheme.secondary}15`,
                  color: cliniFinesseTheme.secondary
                }}
              >
                Signal Detection
              </div>
            </div>
            <p 
              className="text-base sm:text-lg specimen-font-medium max-w-2xl mx-auto mb-6"
              style={{ color: cliniFinesseTheme.textSecondary }}
            >
              Access powerful analysis tools to explore your data and detect significant patterns
            </p>
            <div 
              className="h-px w-24 mx-auto"
              style={{ 
                background: `linear-gradient(to right, ${cliniFinesseTheme.primary}, ${cliniFinesseTheme.secondary})`
              }}
            />
          </div>
        </div>

        {/* Analysis Tools */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto">
          {analysisTools.map((tool) => (
            <div
              key={tool.id}
              onMouseEnter={() => setHoveredCard(tool.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => tool.status === 'active' && navigate(tool.path)}
              className={`
                relative rounded-xl sm:rounded-2xl border p-6 sm:p-8 transition-all duration-300
                h-[200px] sm:h-[220px] md:h-[240px] flex flex-col
                ${tool.status === 'active' 
                  ? 'cursor-pointer transform hover:-translate-y-2 hover:shadow-2xl' 
                  : 'cursor-not-allowed opacity-60'}
              `}
              style={{
                backgroundColor: cliniFinesseTheme.surface,
                borderColor: hoveredCard === tool.id ? cliniFinesseTheme.primary : cliniFinesseTheme.border,
                boxShadow: hoveredCard === tool.id ? 
                  `0 16px 48px ${cliniFinesseTheme.primary}25` : 
                  `0 4px 16px ${cliniFinesseTheme.shadow}`
              }}
            >
              {/* Status Badge */}
              {tool.status === 'coming_soon' && (
                <div 
                  className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-medium specimen-font-medium"
                  style={{ 
                    backgroundColor: `${cliniFinesseTheme.secondary}15`,
                    color: cliniFinesseTheme.secondary,
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  Coming Soon
                </div>
              )}

              {/* Tool Header */}
              <div className="flex items-start gap-5">
                <div 
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transform transition-transform duration-300 group-hover:rotate-6 flex-shrink-0"
                  style={{ 
                    backgroundColor: `${cliniFinesseTheme.primary}15`,
                    color: cliniFinesseTheme.primary,
                    boxShadow: hoveredCard === tool.id ? 
                      `0 8px 24px ${cliniFinesseTheme.primary}20` : 'none'
                  }}
                >
                  {tool.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 
                    className="text-xl sm:text-2xl font-semibold specimen-font mb-2 truncate"
                    style={{ color: cliniFinesseTheme.text }}
                  >
                    {tool.title}
                  </h3>
                  <p 
                    className="text-sm sm:text-base specimen-font-medium line-clamp-2"
                    style={{ color: cliniFinesseTheme.textSecondary }}
                  >
                    {tool.subtitle}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              {tool.status === 'active' && (
                <div 
                  className="flex justify-end mt-auto"
                  style={{
                    opacity: hoveredCard === tool.id ? 1 : 0.7,
                    transform: `translateX(${hoveredCard === tool.id ? '0' : '-8px'})`,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div 
                    className="flex items-center gap-2 text-sm sm:text-base font-medium specimen-font"
                    style={{ color: cliniFinesseTheme.primary }}
                  >
                    Launch Analysis
                    <svg 
                      className="w-4 h-4 sm:w-5 sm:h-5 transform transition-transform duration-300"
                      style={{
                        transform: hoveredCard === tool.id ? 'translateX(4px)' : 'translateX(0)'
                      }}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;