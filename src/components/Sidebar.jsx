import React, { useState } from 'react';
import { useTheme } from './ThemeProvider';

const Sidebar = ({ isOpen, onFileUpload, onAnalyze }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setUploadStatus('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setUploadStatus('Uploading...');
    setUploadedFile(file);

    try {
      // Here we would normally upload the file to the server
      // For now, we'll simulate an API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setUploadStatus('File uploaded successfully!');
      onFileUpload && onFileUpload(file);
    } catch (error) {
      setUploadStatus('Failed to upload file. Please try again.');
      setUploadedFile(null);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) {
      setUploadStatus('Please upload a file first');
      return;
    }

    try {
      setUploadStatus('Analyzing data...');
      await onAnalyze(uploadedFile);
      setUploadStatus('Analysis complete!');
    } catch (error) {
      setUploadStatus('Failed to analyze data. Please try again.');
    }
  };

  const menuItems = [
    {
      id: 'upload',
      label: 'Upload Data',
      icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
    },
    {
      id: 'analysis',
      label: 'Analysis Results',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    },
    {
      id: 'history',
      label: 'History',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    }
  ];

  return (
    <aside
      className={`
        fixed top-0 left-0 h-full w-64
        transform transition-all duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        border-r z-40
      `}
      style={{
        backgroundColor: theme === 'dark' ? '#2d2d2d' : '#ffffff',
        borderColor: theme === 'dark' ? '#404040' : '#e2e8f0',
      }}
    >
      {/* Logo Section */}
      <div 
        className="h-16 flex items-center justify-center border-b"
        style={{ borderColor: theme === 'dark' ? '#404040' : '#e2e8f0' }}
      >
        <h1 
          className="text-2xl font-semibold"
          style={{ color: '#57c1ef' }}
        >
          ClinFinesse
        </h1>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 hover:bg-[#57c1ef] hover:text-white"
              style={{
                backgroundColor: activeTab === item.id
                  ? '#57c1ef'
                  : theme === 'dark' ? '#404040' : '#f1f5f9',
                color: activeTab === item.id
                  ? '#ffffff'
                  : theme === 'dark' ? '#ffffff' : '#1e293b',
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </div>

        {/* File Upload Area */}
        {activeTab === 'upload' && (
          <>
            <div
              className={`
                mt-6 p-6 rounded-lg border-2 border-dashed cursor-pointer
                transition-all duration-300
                ${isDragging ? 'border-[#57c1ef] bg-[#57c1ef]/10' : ''}
              `}
              style={{
                backgroundColor: theme === 'dark' ? '#404040' : '#f1f5f9',
                borderColor: isDragging ? '#57c1ef' : (theme === 'dark' ? '#404040' : '#e2e8f0'),
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('fileInput').click()}
            >
              <div className="text-center">
                <svg
                  className="w-12 h-12 mx-auto mb-4"
                  fill="none"
                  stroke={isDragging ? '#57c1ef' : (theme === 'dark' ? '#94a3b8' : '#64748b')}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p 
                  className="text-sm font-medium mb-2"
                  style={{ color: isDragging ? '#57c1ef' : (theme === 'dark' ? '#ffffff' : '#1e293b') }}
                >
                  {uploadedFile ? uploadedFile.name : 'Drop Excel file here'}
                </p>
                <p 
                  className="text-xs"
                  style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                >
                  or click to browse
                </p>
                <input
                  id="fileInput"
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
                />
              </div>
            </div>

            {/* Upload Status */}
            {uploadStatus && (
              <div 
                className="mt-4 p-3 rounded-lg text-center"
                style={{ 
                  backgroundColor: theme === 'dark' ? '#404040' : '#f1f5f9',
                  color: uploadStatus.includes('success') ? '#57c1ef' : 
                         uploadStatus.includes('Failed') ? '#ee3739' : 
                         theme === 'dark' ? '#ffffff' : '#1e293b'
                }}
              >
                {uploadStatus}
              </div>
            )}

            {/* Analyze Button */}
            {uploadedFile && (
              <button
                onClick={handleAnalyze}
                className="w-full mt-4 py-2 rounded-lg transition-all duration-300 hover:bg-[#57c1ef] hover:text-white"
                style={{
                  backgroundColor: theme === 'dark' ? '#404040' : '#f1f5f9',
                  color: theme === 'dark' ? '#ffffff' : '#1e293b',
                }}
              >
                Analyze Data
              </button>
            )}
          </>
        )}

        {/* Quick Stats */}
        <div 
          className="mt-6 p-4 rounded-lg"
          style={{ backgroundColor: theme === 'dark' ? '#404040' : '#f1f5f9' }}
        >
          <h3 
            className="text-sm font-semibold mb-4"
            style={{ color: theme === 'dark' ? '#ffffff' : '#1e293b' }}
          >
            Analysis Overview
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>
                Completed
              </span>
              <span style={{ color: '#57c1ef' }}>
                24
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>
                In Progress
              </span>
              <span style={{ color: '#ee3739' }}>
                3
              </span>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar; 