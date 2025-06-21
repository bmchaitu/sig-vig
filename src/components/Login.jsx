import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useApi from "../server/useapi";
import { useTheme, themeConfig } from "../components/ThemeProvider";
import { useAuth } from "../context/AuthContext";
import logo from '../assets/logo.png';
import { motion, AnimatePresence } from "framer-motion";

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [flashMessages, setFlashMessages] = useState([]);
  const [activeFeature, setActiveFeature] = useState(0);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { login } = useAuth();

  const { data, error, loading, refetch } = useApi({
    url: "https://sriramchitta.pythonanywhere.com/users/login/",
    method: "post",
    body: formData,
    headers: { "Content-Type": "application/json" },
    enabled: false,
    queryKey: ["login", formData.username],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFlashMessages([]);

    try {
      await refetch();

      if (data) {
        localStorage.setItem("Access-Token", data.access);
        console.log(data);

        login({
          username: formData.username,
          token: data.access,
        });

        setFlashMessages([{ category: 'success', message: 'Login successful!' }]);
        setTimeout(() => navigate("/"), 1500);
      }
      if (error) {
        console.error("Login failed:", error);
        setFlashMessages([{ category: 'danger', message: 'Login failed. Please check your credentials.' }]);
      }
    } catch (err) {
      console.error("Error in login:", err);
      setFlashMessages([{ category: 'danger', message: 'Login failed. Please check your credentials.' }]);
    }
  };

  const handleForgotPassword = () => {
    navigate("/");
  };

  const handleSignUp = () => {
    navigate("/Register");
  };

  const currentTheme = themeConfig[theme];

  // Professional color scheme for pharma company
  const cliniFinesseTheme = {
    primary: '#57c1ef', // Light blue from palette
    secondary: '#ee3739', // Red from palette
    background: theme === 'dark' ? '#1a1a1a' : '#f8fafc',
    cardBackground: theme === 'dark' ? '#2d2d2d' : '#ffffff',
    text: theme === 'dark' ? '#ffffff' : '#1e293b',
    textSecondary: theme === 'dark' ? '#94a3b8' : '#64748b',
    border: theme === 'dark' ? '#404040' : '#e2e8f0',
    inputBackground: theme === 'dark' ? '#3a3a3a' : '#ffffff',
    inputBorder: theme === 'dark' ? '#525252' : '#cbd5e1',
    surface: theme === 'dark' ? '#3a3a3a' : '#ffffff',
  };

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      title: "Advanced Signal Detection",
      description: "Leverage cutting-edge statistical methods for early detection of drug safety signals",
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      stats: ["95% Accuracy", "Real-time Analysis", "Multi-source Data"]
    },
    {
      title: "Regulatory Intelligence",
      description: "Stay compliant with global pharmacovigilance regulations and standards",
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      stats: ["100% Compliance", "Global Standards", "Automated Reports"]
    },
    {
      title: "Smart Workflow Automation",
      description: "Streamline your pharmacovigilance processes with intelligent automation",
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      stats: ["60% Time Saved", "Zero Error Rate", "24/7 Monitoring"]
    },
    {
      title: "Data Visualization",
      description: "Transform complex data into actionable insights with interactive visualizations",
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 13v-1m4 1v-3m4 3V8M12 21l9-9-9-9-9 9 9 9z" />
        </svg>
      ),
      stats: ["Dynamic Charts", "Custom Reports", "Real-time Updates"]
    }
  ];

  return (
    <div 
      className="min-h-screen flex transition-colors duration-500"
      style={{ backgroundColor: cliniFinesseTheme.background }}
    >
      {/* Left Side - Login Form */}
      <div className="w-full md:w-[40%] flex justify-center items-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <motion.div 
            className="p-8 rounded-xl border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              backgroundColor: cliniFinesseTheme.cardBackground,
              borderColor: cliniFinesseTheme.border,
              boxShadow: `0 4px 24px ${cliniFinesseTheme.shadow}`
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
              <div className="flex flex-col items-start">
                <div className="flex items-center specimen-font gap-2">
                  <span className="text-3xl font-bold" style={{ color: cliniFinesseTheme.secondary }}>
                    SIG
                  </span>
                  <span className="text-3xl font-bold" style={{ color: cliniFinesseTheme.primary }}>
                    VIG
                  </span>
                </div>
                <span className="text-xs specimen-font-medium tracking-wide mt-1" style={{ color: cliniFinesseTheme.textSecondary }}>
                  powered by <span style={{ color: cliniFinesseTheme.secondary }}>CLIN</span><span style={{ color: cliniFinesseTheme.primary }}>FINESSE</span>
                </span>
              </div>
            </div>

            {/* Flash Messages */}
            {flashMessages.length > 0 && (
              <div className="mb-6">
                {flashMessages.map((msg, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-md mb-3 text-sm specimen-font-medium transition-all duration-300"
                    style={{
                      backgroundColor: msg.category === 'success' 
                        ? theme === 'dark' ? '#1e3a3a' : '#f0f9f0'
                        : theme === 'dark' ? '#3a1e1e' : '#fdf2f2',
                      color: msg.category === 'success' 
                        ? theme === 'dark' ? '#4ade80' : '#166534'
                        : theme === 'dark' ? '#f87171' : '#dc2626',
                      border: `1px solid ${msg.category === 'success' 
                        ? theme === 'dark' ? '#4ade80' : '#bbf7d0'
                        : theme === 'dark' ? '#f87171' : '#fecaca'}`
                    }}
                  >
                    {msg.category === 'success' && (
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                    {msg.category === 'danger' && (
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                    {msg.message}
                  </div>
                ))}
              </div>
            )}
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label 
                  htmlFor="username" 
                  className="block text-sm specimen-font-medium mb-2"
                  style={{ color: cliniFinesseTheme.text }}
                >
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-md border specimen-font-medium transition-all duration-200 focus:ring-2 focus:ring-opacity-20 focus:outline-none"
                  style={{
                    backgroundColor: cliniFinesseTheme.inputBackground,
                    borderColor: cliniFinesseTheme.inputBorder,
                    color: cliniFinesseTheme.text,
                    focusRingColor: cliniFinesseTheme.primary
                  }}
                  placeholder="Enter your username"
                />
              </div>
              
              <div>
                <label 
                  htmlFor="password" 
                  className="block text-sm specimen-font-medium mb-2"
                  style={{ color: cliniFinesseTheme.text }}
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-md border specimen-font-medium transition-all duration-200 focus:ring-2 focus:ring-opacity-20 focus:outline-none"
                  style={{
                    backgroundColor: cliniFinesseTheme.inputBackground,
                    borderColor: cliniFinesseTheme.inputBorder,
                    color: cliniFinesseTheme.text,
                    focusRingColor: cliniFinesseTheme.primary
                  }}
                  placeholder="Enter your password"
                />
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm specimen-font-medium transition-colors duration-200 hover:underline"
                  style={{ 
                    color: cliniFinesseTheme.primary,
                  }}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-md text-sm specimen-font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-60 disabled:cursor-not-allowed text-white"
                style={{
                  backgroundColor: loading ? cliniFinesseTheme.textSecondary : cliniFinesseTheme.primary,
                  boxShadow: loading ? 'none' : `0 4px 12px ${cliniFinesseTheme.primary}20`
                }}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p 
                className="text-xs specimen-font-medium"
                style={{ color: cliniFinesseTheme.textSecondary }}
              >
                Secure data management platform
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Features and Certifications */}
      <div className="hidden md:flex md:w-[60%] relative overflow-hidden">
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-20 w-full">
          {/* Brand Header */}
          <div className="mb-16">
            <h1 className="text-4xl font-bold mb-4 specimen-font" style={{ color: cliniFinesseTheme.text }}>
              Advanced Signal Detection Platform
            </h1>
            <p className="text-lg mb-8 specimen-font-medium" style={{ color: cliniFinesseTheme.textSecondary }}>
              Enhance your pharmacovigilance workflow with precise signal detection and analysis
            </p>
          </div>
          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-8 mb-12">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-14 h-14 flex items-center justify-center rounded-xl shadow-lg" style={{ backgroundColor: cliniFinesseTheme.surface }}>
                  {React.cloneElement(feature.icon, { className: 'w-10 h-10', style: { color: cliniFinesseTheme.primary } })}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 specimen-font" style={{ color: cliniFinesseTheme.text }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm specimen-font-medium" style={{ color: cliniFinesseTheme.textSecondary }}>
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {/* Certifications */}
          <div className="pt-8 border-t" style={{ borderColor: cliniFinesseTheme.border }}>
            <div className="flex items-center gap-6">
              {/* ...certifications code as before... */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;