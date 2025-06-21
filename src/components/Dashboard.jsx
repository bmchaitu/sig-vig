import React, { useState, useMemo, useCallback, memo } from 'react';
import { useTheme } from './ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';

// Constants
const PRR_THRESHOLD = 2;
const CHI2_THRESHOLD = 4;
const CASES_THRESHOLD = 3;

// Demo/Fallback Data
const DEMO_SHEET_NAMES = ['Sheet1', 'Sheet2', 'Sheet3'];
const DEMO_RESULTS = {
  results: [
    {
      drug_name: "Aspirin",
      event_term: "Headache",
      cases: 45,
      PRR: 2.34,
      ChiSquare: 8.67
    },
    {
      drug_name: "Ibuprofen",
      event_term: "Nausea",
      cases: 23,
      PRR: 1.89,
      ChiSquare: 3.21
    },
    {
      drug_name: "Paracetamol",
      event_term: "Dizziness",
      cases: 15,
      PRR: 3.12,
      ChiSquare: 6.45
    },
    {
      drug_name: "Amoxicillin",
      event_term: "Rash",
      cases: 8,
      PRR: 2.76,
      ChiSquare: 4.89
    },
    {
      drug_name: "Omeprazole",
      event_term: "Stomach Pain",
      cases: 12,
      PRR: 1.45,
      ChiSquare: 2.34
    }
  ]
};

// API Endpoints
const API_BASE_URL = 'https://signalspark-suite-866002518023.us-central1.run.app';
const API_ENDPOINTS = {
  GET_SHEET_NAMES: `${API_BASE_URL}/get-sheet-names-prrchi`,
  CALCULATE_SIGNALS: `${API_BASE_URL}/calculate-prrchi-signals-from-sheet`
};

// Simulate API delay
const simulateApiDelay = () => new Promise(resolve => setTimeout(resolve, 1500));

// Memoized components
const ToolButton = memo(({ isActive, onClick, children, isDisabled, style }) => (
  <motion.button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-4 py-2 rounded-lg text-sm
      transition-all duration-200
      specimen-font-medium
      ${isActive ? 'shadow-lg' : ''}
      ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
    `}
    style={style}
    whileHover={!isDisabled && { scale: 1.02 }}
    whileTap={!isDisabled && { scale: 0.98 }}
  >
    {children}
  </motion.button>
));

const ResultsTable = memo(({ data, columns, colorPalette }) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-6 py-4 text-left text-sm specimen-font-medium"
                  style={{ color: colorPalette.textSecondary }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr 
              key={row.id}
              className="border-t transition-colors duration-200 hover:bg-opacity-50"
              style={{ 
                borderColor: colorPalette.border,
                backgroundColor: colorPalette.surfaceVariant
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-6 py-4 text-sm whitespace-nowrap"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

const Dashboard = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [currentTool, setCurrentTool] = useState('prr-chi');
  const [selectedFile, setSelectedFile] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [drugNameFilter, setDrugNameFilter] = useState('');

  // Memoize theme
  const cliniFinesseTheme = useMemo(() => ({
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
  }), [theme]);

  // File upload and sheet names API
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setIsLoading(true);
      setIsSimulationMode(false);

      try {
        const formData = new FormData();
        formData.append('file', file);

        await simulateApiDelay();
        const response = await fetch(API_ENDPOINTS.GET_SHEET_NAMES, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Failed to get sheet names');
        }

        const data = await response.json();
        setSheetNames(data.sheet_names);
    } catch (err) {
        console.warn('API failed, using simulation mode:', err);
        setIsSimulationMode(true);
        setSheetNames(DEMO_SHEET_NAMES);
        setError({
          type: 'warning',
          message: 'Using simulation mode due to API unavailability'
        });
    } finally {
      setIsLoading(false);
    }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls', '.xlsm']
    },
    multiple: false
  });

  // Analysis API
  const handleAnalyze = useCallback(async () => {
    if (!selectedFile || !selectedSheet) return;
    
    setIsLoading(true);
    setError(null);

    try {
      await simulateApiDelay();

      if (isSimulationMode) {
        // Use demo data in simulation mode
        setAnalysisResults(DEMO_RESULTS);
      } else {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('sheet_name', selectedSheet);

        const response = await fetch(API_ENDPOINTS.CALCULATE_SIGNALS, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Failed to analyze data');
        }

        const data = await response.json();
        setAnalysisResults({ results: data });
      }
    } catch (err) {
      console.warn('API failed, using simulation mode:', err);
      setIsSimulationMode(true);
      setAnalysisResults(DEMO_RESULTS);
      setError({
        type: 'warning',
        message: 'Using simulation mode due to API unavailability'
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, selectedSheet, isSimulationMode]);

  // Export functionality
  const handleExport = useCallback(() => {
    if (!analysisResults?.results) return;

    // Create CSV content
    const headers = ['Drug Name', 'Event Term', 'Cases', 'PRR', 'Chi-Square'];
    const csvContent = [
      headers.join(','),
      ...analysisResults.results.map(row => [
        row.drug_name,
        row.event_term,
        row.cases,
        row.PRR.toFixed(2),
        row.ChiSquare.toFixed(2)
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'signal_detection_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [analysisResults]);

  // Table columns configuration
  const columns = useMemo(() => [
    {
      accessorKey: 'drug_name',
      header: 'Drug Name'
    },
    {
      accessorKey: 'event_term',
      header: 'Event Term'
    },
    {
      accessorKey: 'cases',
      header: 'Cases',
      cell: ({ row }) => {
        const cases = row.original.cases;
        return (
          <span style={{ 
            color: cases >= CASES_THRESHOLD ? cliniFinesseTheme.success : cliniFinesseTheme.warning 
          }}>
            {cases}
        </span>
        );
      }
    },
    {
      accessorKey: 'PRR',
      header: 'PRR',
      cell: ({ row }) => {
        const prr = row.original.PRR;
        return (
          <span style={{ 
            color: prr >= PRR_THRESHOLD ? cliniFinesseTheme.success : cliniFinesseTheme.warning 
          }}>
            {prr.toFixed(2)}
          </span>
        );
      }
    },
    {
      accessorKey: 'ChiSquare',
      header: 'Chi-Square',
      cell: ({ row }) => {
        const chi = row.original.ChiSquare;
        return (
          <span style={{ 
            color: chi >= CHI2_THRESHOLD ? cliniFinesseTheme.success : cliniFinesseTheme.warning 
          }}>
            {chi.toFixed(2)}
          </span>
        );
      }
    }
  ], [cliniFinesseTheme]);

  // Filter results by drug name
  const filteredResults = useMemo(() => {
    if (!analysisResults?.results) return [];
    return analysisResults.results.filter(result => 
      result.drug_name.toLowerCase().includes(drugNameFilter.toLowerCase())
    );
  }, [analysisResults, drugNameFilter]);

  return (
    <div 
      className="min-h-screen transition-colors duration-200"
      style={{ backgroundColor: cliniFinesseTheme.background }}
    >
      {/* Main Container */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Tool Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* PRR & Chi-Square Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentTool('prr-chi')}
            className="relative overflow-hidden rounded-2xl border cursor-pointer"
            style={{
              backgroundColor: currentTool === 'prr-chi' 
                ? `${cliniFinesseTheme.primary}15`
                : cliniFinesseTheme.surface,
              borderColor: currentTool === 'prr-chi'
                ? cliniFinesseTheme.primary
                : cliniFinesseTheme.border,
              boxShadow: `0 4px 20px ${cliniFinesseTheme.shadow}`
            }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
      style={{ 
                    backgroundColor: `${cliniFinesseTheme.primary}20`,
                    color: cliniFinesseTheme.primary 
      }}
    >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div 
                  className="px-3 py-1 rounded-full text-xs specimen-font-medium"
                  style={{ 
                    backgroundColor: `${cliniFinesseTheme.success}20`,
                    color: cliniFinesseTheme.success
                  }}
                >
                  Active
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2 specimen-font" style={{ color: cliniFinesseTheme.text }}>
                PRR & Chi-Square Analysis
              </h3>
              <p className="text-sm specimen-font-medium" style={{ color: cliniFinesseTheme.textSecondary }}>
                Analyze drug-event combinations using Proportional Reporting Ratio and Chi-Square statistics.
              </p>
            </div>
          </motion.div>

          {/* EBGM Card (Coming Soon) */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative overflow-hidden rounded-2xl border opacity-75 cursor-not-allowed"
            style={{
              backgroundColor: cliniFinesseTheme.surface,
              borderColor: cliniFinesseTheme.border,
              boxShadow: `0 4px 20px ${cliniFinesseTheme.shadow}`
            }}
          >
            <div 
              className="absolute inset-0 z-10 flex items-center justify-center specimen-font"
              style={{ 
                backgroundColor: `${cliniFinesseTheme.surface}CC`,
                backdropFilter: 'blur(4px)'
              }}
            >
              <span 
                className="px-4 py-2 rounded-full text-sm border shadow-sm"
                style={{ 
                  backgroundColor: cliniFinesseTheme.surface,
                  borderColor: cliniFinesseTheme.border,
                  color: cliniFinesseTheme.textSecondary
                }}
              >
                Coming Soon
              </span>
          </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
            <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ 
                    backgroundColor: `${cliniFinesseTheme.secondary}20`,
                    color: cliniFinesseTheme.secondary 
                  }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2 specimen-font" style={{ color: cliniFinesseTheme.text }}>
                EBGM Analysis
              </h3>
              <p className="text-sm specimen-font-medium" style={{ color: cliniFinesseTheme.textSecondary }}>
                Advanced signal detection using Empirical Bayes Geometric Mean method.
              </p>
            </div>
          </motion.div>
          </div>

        {/* Analysis Section */}
        {currentTool === 'prr-chi' && (
          <div className="space-y-6">
            {/* File Upload Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl border"
          style={{ 
                backgroundColor: cliniFinesseTheme.surface,
            borderColor: cliniFinesseTheme.border,
                boxShadow: `0 4px 20px ${cliniFinesseTheme.shadow}`
          }}
        >
              <div 
                className="px-6 py-4 border-b specimen-font-medium"
                style={{ borderColor: cliniFinesseTheme.border }}
              >
                <h2 
                  className="text-lg"
                  style={{ color: cliniFinesseTheme.text }}
                  >
                  Data Upload
                </h2>
            <p 
                  className="mt-1 text-sm"
              style={{ color: cliniFinesseTheme.textSecondary }}
            >
                  Upload your Excel file (.xlsx, .xls, .xlsm) containing the drug safety data
            </p>
          </div>

              <div className="p-6">
                {!selectedFile ? (
          <div 
            {...getRootProps()} 
                    className={`
                      border-2 border-dashed rounded-xl p-8
                      flex flex-col items-center justify-center
                      cursor-pointer transition-all duration-200
                      ${isDragActive ? 'border-primary' : ''}
                    `}
            style={{
                      borderColor: isDragActive ? cliniFinesseTheme.primary : cliniFinesseTheme.border,
                      backgroundColor: cliniFinesseTheme.surfaceVariant
            }}
          >
            <input {...getInputProps()} />
                    <motion.div
                      initial={false}
                      animate={{ 
                        scale: isDragActive ? 1.05 : 1,
                        y: isDragActive ? -5 : 0
                      }}
                      className="text-center"
                    >
                      <div 
                        className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center"
                        style={{ 
                          backgroundColor: `${cliniFinesseTheme.primary}20`,
                          color: cliniFinesseTheme.primary
                        }}
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
                      </div>
              <p 
                        className="text-sm mb-2 specimen-font-medium"
                style={{ color: cliniFinesseTheme.text }}
              >
                        {isDragActive ? (
                          "Drop your file here..."
                        ) : (
                          <>
                            Drag & drop your file here, or{" "}
                            <span style={{ color: cliniFinesseTheme.primary }}>browse</span>
                          </>
                        )}
              </p>
                      <p 
                        className="text-xs specimen-font-medium"
                        style={{ color: cliniFinesseTheme.textSecondary }}
                      >
                        Supported formats: .xlsx, .xls, .xlsm
              </p>
                    </motion.div>
            </div>
                ) : (
                  <div className="space-y-4">
                    {/* Selected File Info */}
            <div 
                      className="p-4 rounded-lg flex items-start gap-4"
                      style={{ backgroundColor: cliniFinesseTheme.surfaceVariant }}
                    >
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ 
                          backgroundColor: `${cliniFinesseTheme.primary}20`,
                          color: cliniFinesseTheme.primary
              }}
            >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p 
                          className="text-sm font-medium mb-1 specimen-font-medium"
                          style={{ color: cliniFinesseTheme.text }}
                        >
                          {selectedFile.name}
                        </p>
                        <p 
                          className="text-xs specimen-font-medium"
                          style={{ color: cliniFinesseTheme.textSecondary }}
                        >
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedFile(null)}
                        className="p-2 rounded-lg"
                        style={{ color: cliniFinesseTheme.textSecondary }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </motion.button>
                    </div>

                    {/* Sheet Selection */}
                    {sheetNames.length > 0 && (
                      <div className="space-y-3">
                        <h3 
                          className="text-sm font-medium specimen-font-medium"
                          style={{ color: cliniFinesseTheme.text }}
                        >
                          Select Sheet
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {sheetNames.map((sheet) => (
                            <motion.button
                              key={sheet}
                              onClick={() => setSelectedSheet(sheet)}
                              className={`
                                p-3 rounded-lg text-sm text-left transition-all duration-200
                                specimen-font-medium
                              `}
                              style={{
                                backgroundColor: selectedSheet === sheet 
                                  ? cliniFinesseTheme.surface 
                                  : cliniFinesseTheme.surfaceVariant,
                                color: selectedSheet === sheet
                                  ? cliniFinesseTheme.text
                                  : cliniFinesseTheme.textSecondary,
                                boxShadow: selectedSheet === sheet
                                  ? `0 2px 8px ${cliniFinesseTheme.shadow}`
                                  : 'none',
                                border: `1px solid ${selectedSheet === sheet 
                                  ? cliniFinesseTheme.primary 
                                  : 'transparent'}`
                              }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {sheet}
                              </div>
                            </motion.button>
                          ))}
                        </div>
            </div>
          )}

                    {/* Analysis Button */}
                    <div className="flex justify-end pt-4">
                      <motion.button
                        onClick={handleAnalyze}
                        disabled={!selectedSheet || isLoading}
                        className={`
                          px-6 py-2.5 rounded-lg text-sm
                          flex items-center gap-2
                          specimen-font-medium
                          transition-all duration-200
                          ${!selectedSheet || isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
              style={{ 
                          backgroundColor: cliniFinesseTheme.primary,
                          color: '#ffffff',
                          boxShadow: `0 4px 12px ${cliniFinesseTheme.primary}40`
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isLoading ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
                            Start Analysis
                          </>
                        )}
                      </motion.button>
                    </div>
            </div>
          )}
        </div>
            </motion.div>

        {/* Analysis Results */}
            {analysisResults && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl border"
            style={{ 
                  backgroundColor: cliniFinesseTheme.surface,
              borderColor: cliniFinesseTheme.border,
                  boxShadow: `0 4px 20px ${cliniFinesseTheme.shadow}`
            }}
          >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold specimen-font" style={{ color: cliniFinesseTheme.text }}>
                      Analysis Results
                    </h3>
                    <p className="text-sm specimen-font-medium" style={{ color: cliniFinesseTheme.textSecondary }}>
                      Showing {filteredResults.length} signals
            </p>
          </div>

                  {/* Drug Name Filter */}
                  <div className="relative">
                    <input
                      type="text"
                      value={drugNameFilter}
                      onChange={(e) => setDrugNameFilter(e.target.value)}
                      placeholder="Filter by drug name..."
                      className="w-full lg:w-64 px-4 py-2 rounded-xl border text-sm specimen-font-medium focus:outline-none focus:ring-2 transition-shadow duration-200"
            style={{ 
                        backgroundColor: cliniFinesseTheme.surface,
              borderColor: cliniFinesseTheme.border,
                        color: cliniFinesseTheme.text,
                        boxShadow: `0 2px 8px ${cliniFinesseTheme.shadow}`
            }}
                    />
                    <svg 
                      className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2"
                      fill="none"
                      stroke={cliniFinesseTheme.textSecondary}
                      viewBox="0 0 24 24"
            >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
            </div>

                {/* Results Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                      <tr>
                        <th 
                          className="px-4 py-3 text-left text-xs specimen-font-medium border-b"
                          style={{ 
                            color: cliniFinesseTheme.textSecondary,
                            borderColor: cliniFinesseTheme.border
                          }}
                        >
                          Drug Name
                        </th>
                        <th 
                          className="px-4 py-3 text-left text-xs specimen-font-medium border-b"
                          style={{ 
                            color: cliniFinesseTheme.textSecondary,
                            borderColor: cliniFinesseTheme.border
                          }}
                        >
                          Event Term
                        </th>
                        <th 
                          className="px-4 py-3 text-right text-xs specimen-font-medium border-b"
                          style={{ 
                            color: cliniFinesseTheme.textSecondary,
                            borderColor: cliniFinesseTheme.border
                          }}
                        >
                          Cases
                        </th>
                        <th 
                          className="px-4 py-3 text-right text-xs specimen-font-medium border-b"
                          style={{ 
                            color: cliniFinesseTheme.textSecondary,
                            borderColor: cliniFinesseTheme.border
                          }}
                        >
                          PRR
                        </th>
                        <th 
                          className="px-4 py-3 text-right text-xs specimen-font-medium border-b"
                          style={{ 
                            color: cliniFinesseTheme.textSecondary,
                            borderColor: cliniFinesseTheme.border
                          }}
                        >
                          Chi-Square
                        </th>
                        <th 
                          className="px-4 py-3 text-center text-xs specimen-font-medium border-b"
                          style={{ 
                            color: cliniFinesseTheme.textSecondary,
                            borderColor: cliniFinesseTheme.border
                          }}
                        >
                          Signal
                        </th>
                    </tr>
                </thead>
                <tbody>
                      {filteredResults.map((result, index) => (
                        <motion.tr
                          key={`${result.drug_name}-${result.event_term}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group hover:shadow-sm transition-all duration-200"
                      style={{ 
                            backgroundColor: cliniFinesseTheme.surface
                      }}
                    >
                          <td 
                            className="px-4 py-3 text-sm specimen-font-medium border-b group-hover:border-transparent"
                  style={{ 
                    color: cliniFinesseTheme.text,
                              borderColor: cliniFinesseTheme.border
                  }}
                >
                            {result.drug_name}
                          </td>
                          <td 
                            className="px-4 py-3 text-sm specimen-font-medium border-b group-hover:border-transparent"
                  style={{ 
                    color: cliniFinesseTheme.text,
                              borderColor: cliniFinesseTheme.border
                  }}
                >
                            {result.event_term}
                          </td>
                          <td 
                            className="px-4 py-3 text-sm text-right specimen-font-medium border-b group-hover:border-transparent"
                            style={{ 
                              color: result.cases >= CASES_THRESHOLD ? cliniFinesseTheme.success : cliniFinesseTheme.textSecondary,
                              borderColor: cliniFinesseTheme.border
                            }}
                          >
                            {result.cases}
                          </td>
                          <td 
                            className="px-4 py-3 text-sm text-right specimen-font-medium border-b group-hover:border-transparent"
                  style={{ 
                              color: result.PRR >= PRR_THRESHOLD ? cliniFinesseTheme.success : cliniFinesseTheme.textSecondary,
                              borderColor: cliniFinesseTheme.border
                  }}
                >
                            {result.PRR.toFixed(2)}
                          </td>
                          <td 
                            className="px-4 py-3 text-sm text-right specimen-font-medium border-b group-hover:border-transparent"
                  style={{ 
                              color: result.ChiSquare >= CHI2_THRESHOLD ? cliniFinesseTheme.success : cliniFinesseTheme.textSecondary,
                              borderColor: cliniFinesseTheme.border
                  }}
                >
                            {result.ChiSquare.toFixed(2)}
                          </td>
                          <td 
                            className="px-4 py-3 text-center border-b group-hover:border-transparent"
                            style={{ borderColor: cliniFinesseTheme.border }}
                          >
                            {result.PRR >= PRR_THRESHOLD && 
                             result.ChiSquare >= CHI2_THRESHOLD && 
                             result.cases >= CASES_THRESHOLD ? (
                              <span 
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs specimen-font-medium"
                                style={{ 
                                  backgroundColor: `${cliniFinesseTheme.success}20`,
                                  color: cliniFinesseTheme.success
                                }}
                              >
                                Detected
                              </span>
                            ) : (
                              <span 
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs specimen-font-medium"
                style={{ 
                                  backgroundColor: `${cliniFinesseTheme.textSecondary}20`,
                                  color: cliniFinesseTheme.textSecondary
                }}
              >
                                Not Detected
                              </span>
                            )}
                          </td>
                        </motion.tr>
                ))}
                    </tbody>
                  </table>
            </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;