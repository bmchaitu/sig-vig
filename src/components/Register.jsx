import React, { useState, useEffect } from "react";
import useApi from "../server/useapi";
import { useTheme } from '../components/ThemeProvider';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password2: ""
  });

  const [flashMessages, setFlashMessages] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Setup useApi
  const {
    data,
    error,
    loading,
    refetch
  } = useApi({
    url: "https://sriramchitta.pythonanywhere.com/users/register/",
    method: "post",
    body: formData,
    headers: { "Content-Type": "application/json" },
    enabled: false,
    queryKey: ['register', formData]
  });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handlechange = (e) => {
    const { name, value } = e.target;
    setFormData(i => ({
      ...i,
      [name]: value
    }));
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.username.trim()) errors.username = 'Username is required';
    else if (formData.username.length < 3) errors.username = 'Username must be at least 3 characters';

    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Invalid email address';

    if (!formData.password.trim()) errors.password = 'Password is required';
    else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters';

    if (!formData.password2.trim()) errors.password2 = 'Please confirm your password';
    else if (formData.password !== formData.password2) errors.password2 = 'Passwords do not match';

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFlashMessages([]);

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setFlashMessages([{ category: 'danger', message: 'Please fix the errors below and try again.' }]);
      return;
    }

    setValidationErrors({});
    refetch();
  };

  // Watch for API response
  useEffect(() => {
    if (data) {
      setFlashMessages([{ category: 'success', message: 'Registration successful! You can now login.' }]);
      console.log("Registered successfully", data);
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    }
    if (error) {
      setFlashMessages([{ category: 'danger', message: 'Registration failed. Please try again.' }]);
      console.log("Registration error:", error);
    }
  }, [data, error, navigate]);

  // ClinFinesse professional color scheme
  const cliniFinesseTheme = {
    primary: '#57c1ef', // Light blue from palette
    secondary: '#ee3739', // Red from palette
    accent: '#4299e1', // A complementary blue for buttons
    background: theme === 'dark' ? '#1a1a1a' : '#f8fafc',
    cardBackground: theme === 'dark' ? '#2d2d2d' : '#ffffff',
    text: theme === 'dark' ? '#ffffff' : '#1e293b',
    textSecondary: theme === 'dark' ? '#94a3b8' : '#64748b',
    border: theme === 'dark' ? '#404040' : '#e2e8f0',
    inputBackground: theme === 'dark' ? '#3a3a3a' : '#ffffff',
    inputBorder: theme === 'dark' ? '#525252' : '#cbd5e1',
    inputBorderFocus: '#57c1ef',
    errorBackground: theme === 'dark' ? '#3a1e1e' : '#fdf2f2',
    errorText: theme === 'dark' ? '#f87171' : '#dc2626',
    errorBorder: theme === 'dark' ? '#f87171' : '#fecaca',
    successBackground: theme === 'dark' ? '#1e3a3a' : '#f0f9f0',
    successText: theme === 'dark' ? '#4ade80' : '#166534',
    successBorder: theme === 'dark' ? '#4ade80' : '#bbf7d0',
  };

  return (
    <div 
      className="min-h-screen flex justify-center items-center transition-colors duration-500"
      style={{ backgroundColor: cliniFinesseTheme.background }}
    >
      <div className="w-full max-w-md mx-4">
        <div 
          className={`p-6 rounded-xl shadow-xl border transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          style={{ 
            backgroundColor: cliniFinesseTheme.cardBackground,
            borderColor: cliniFinesseTheme.border,
            boxShadow: theme === 'dark' 
              ? '0 20px 40px rgba(0, 0, 0, 0.4)' 
              : '0 20px 40px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div 
                className="w-9 h-9 rounded-lg flex items-center justify-center shadow-lg"
                style={{ 
                  backgroundColor: cliniFinesseTheme.primary,
                  boxShadow: `0 4px 12px ${cliniFinesseTheme.primary}30`
                }}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h1 
                className="text-2xl font-bold"
                style={{ 
                  color: cliniFinesseTheme.text,
                  fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
                }}
              >
                ClinFinesse
          </h1>
            </div>
            <p 
              className="text-sm leading-relaxed mb-1"
              style={{ color: cliniFinesseTheme.textSecondary }}
            >
              Create your account to get started with our platform
            </p>
            <p 
              className="text-xs"
              style={{ color: cliniFinesseTheme.textSecondary }}
            >
              Join the future of pharmaceutical data management
            </p>
            <div 
              className="w-16 h-0.5 mx-auto mt-3 rounded-full"
              style={{ 
                backgroundColor: cliniFinesseTheme.primary
              }}
            />
        </div>

        {/* Flash Messages */}
        {flashMessages.length > 0 && (
          <div className="mb-6">
            {flashMessages.map((msg, index) => (
              <div
                key={index}
                  className="flex items-center gap-3 p-4 rounded-lg mb-3 text-sm transition-all duration-300 animate-in slide-in-from-top-2"
                  style={{
                    backgroundColor: msg.category === 'success' 
                      ? cliniFinesseTheme.successBackground
                      : cliniFinesseTheme.errorBackground,
                    color: msg.category === 'success' 
                      ? cliniFinesseTheme.successText
                      : cliniFinesseTheme.errorText,
                    border: `1px solid ${msg.category === 'success' 
                      ? cliniFinesseTheme.successBorder
                      : cliniFinesseTheme.errorBorder}`
                  }}
              >
                <div className="flex-shrink-0">
                  {msg.category === 'success' && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {msg.category === 'danger' && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                  <span className="font-medium">{msg.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Field */}
            <div className="group">
              <label 
                htmlFor="username" 
                className="block text-sm font-semibold mb-1.5"
                style={{ color: cliniFinesseTheme.text }}
              >
              Username
            </label>
              <div className="relative">
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handlechange}
              required
                  className="w-full px-3 py-2.5 rounded-lg border-2 transition-all duration-200 focus:ring-2 focus:ring-opacity-20 focus:outline-none group-hover:shadow-md"
                  style={{
                    backgroundColor: cliniFinesseTheme.inputBackground,
                    borderColor: validationErrors.username ? cliniFinesseTheme.secondary : cliniFinesseTheme.inputBorder,
                    color: cliniFinesseTheme.text
                  }}
              placeholder="Choose a unique username"
            />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="w-5 h-5 opacity-40" style={{ color: cliniFinesseTheme.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            {validationErrors.username && (
                <p 
                  className="text-xs mt-2 flex items-center gap-1 animate-in slide-in-from-left-2 duration-200"
                  style={{ color: cliniFinesseTheme.errorText }}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                {validationErrors.username}
              </p>
            )}
          </div>

          {/* Email Field */}
            <div className="group">
              <label 
                htmlFor="email" 
                className="block text-sm font-semibold mb-1.5"
                style={{ color: cliniFinesseTheme.text }}
              >
              Email Address
            </label>
              <div className="relative">
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handlechange}
              required
                  className="w-full px-3 py-2.5 rounded-lg border-2 transition-all duration-200 focus:ring-2 focus:ring-opacity-20 focus:outline-none group-hover:shadow-md"
                  style={{
                    backgroundColor: cliniFinesseTheme.inputBackground,
                    borderColor: validationErrors.email ? cliniFinesseTheme.secondary : cliniFinesseTheme.inputBorder,
                    color: cliniFinesseTheme.text
                  }}
              placeholder="Enter your email address"
            />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="w-5 h-5 opacity-40" style={{ color: cliniFinesseTheme.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
              </div>
            {validationErrors.email && (
                <p 
                  className="text-xs mt-2 flex items-center gap-1 animate-in slide-in-from-left-2 duration-200"
                  style={{ color: cliniFinesseTheme.errorText }}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
            <div className="group">
              <label 
                htmlFor="password" 
                className="block text-sm font-semibold mb-1.5"
                style={{ color: cliniFinesseTheme.text }}
              >
              Password
            </label>
              <div className="relative">
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handlechange}
              required
                  className="w-full px-3 py-2.5 rounded-lg border-2 transition-all duration-200 focus:ring-2 focus:ring-opacity-20 focus:outline-none group-hover:shadow-md"
                  style={{
                    backgroundColor: cliniFinesseTheme.inputBackground,
                    borderColor: validationErrors.password ? cliniFinesseTheme.secondary : cliniFinesseTheme.inputBorder,
                    color: cliniFinesseTheme.text
                  }}
              placeholder="Create a strong password"
            />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="w-5 h-5 opacity-40" style={{ color: cliniFinesseTheme.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
            {validationErrors.password && (
                <p 
                  className="text-xs mt-2 flex items-center gap-1 animate-in slide-in-from-left-2 duration-200"
                  style={{ color: cliniFinesseTheme.errorText }}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                {validationErrors.password}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
            <div className="group">
              <label 
                htmlFor="password2" 
                className="block text-sm font-semibold mb-1.5"
                style={{ color: cliniFinesseTheme.text }}
              >
              Confirm Password
            </label>
              <div className="relative">
            <input
              type="password"
              id="password2"
              name="password2"
              value={formData.password2}
              onChange={handlechange}
              required
                  className="w-full px-3 py-2.5 rounded-lg border-2 transition-all duration-200 focus:ring-2 focus:ring-opacity-20 focus:outline-none group-hover:shadow-md"
                  style={{
                    backgroundColor: cliniFinesseTheme.inputBackground,
                    borderColor: validationErrors.password2 ? cliniFinesseTheme.secondary : cliniFinesseTheme.inputBorder,
                    color: cliniFinesseTheme.text
                  }}
              placeholder="Confirm your password"
            />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="w-5 h-5 opacity-40" style={{ color: cliniFinesseTheme.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            {validationErrors.password2 && (
                <p 
                  className="text-xs mt-2 flex items-center gap-1 animate-in slide-in-from-left-2 duration-200"
                  style={{ color: cliniFinesseTheme.errorText }}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                {validationErrors.password2}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
              type="submit"
            disabled={loading}
              className="w-full py-3 px-5 rounded-lg font-semibold text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-60 disabled:cursor-not-allowed text-white transform hover:scale-[1.01] active:scale-[0.99] mt-6"
              style={{
                backgroundColor: loading ? cliniFinesseTheme.textSecondary : cliniFinesseTheme.accent,
                boxShadow: loading ? 'none' : `0 4px 10px ${cliniFinesseTheme.accent}30`
              }}
          >
            {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Account...
              </div>
            ) : (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Create Account
                </div>
            )}
          </button>
          </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
            <p 
              className="text-sm"
              style={{ color: cliniFinesseTheme.textSecondary }}
            >
            Already have an account?{' '}
            <button
              onClick={() => navigate("/login")}
              className="font-semibold transition-all duration-200 hover:underline transform hover:scale-105"
              style={{ color: cliniFinesseTheme.primary }}
            >
              Sign in here
            </button>
          </p>
        </div>

        {/* Footer */}
          <div className="mt-6 text-center">
            <p 
              className="text-xs"
              style={{ color: cliniFinesseTheme.textSecondary }}
            >
              Secure pharmaceutical data management platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;