import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import useApi from '../server/useapi';
import { useTheme } from '../components/ThemeProvider';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { useVirtual } from 'react-virtual';
// 1. Import MUI DataGrid at the top
import { DataGrid } from '@mui/x-data-grid';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartDataLabels // Register the datalabels plugin
);

const PrrChiAnalysis = () => {
  const { theme } = useTheme();
  const [file, setFile] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [sheetData, setSheetData] = useState(null);
  
  // Updated state variables for enhanced features
  const [analysisType, setAnalysisType] = useState('prr');
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [uniqueDrugs, setUniqueDrugs] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [chartView, setChartView] = useState(false);
  const [drugFilter, setDrugFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [viewMode, setViewMode] = useState('table');
  
  // Existing states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    prrMin: '',
    prrMax: '',
    chiMin: '',
    chiMax: '',
    casesMin: '',
    casesMax: '',
    rorMin: '',
    rorMax: '',
    newMin: '',
    newMax: '',
    nowMin: '',
    nowMax: '',
    previousMin: '',
    previousMax: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);

  // Enhanced dark theme configuration
  const cliniFinesseTheme = useMemo(() => ({
    primary: theme === 'dark' ? '#64B5F6' : '#57c1ef',
    secondary: theme === 'dark' ? '#FF5252' : '#ee3739',
    background: theme === 'dark' ? '#121212' : '#f8f9fa',
    surface: theme === 'dark' ? '#1E1E1E' : '#ffffff',
    surfaceHover: theme === 'dark' ? '#2A2A2A' : '#f0f0f0',
    surfaceActive: theme === 'dark' ? '#333333' : '#e2e8f0',
    border: theme === 'dark' ? '#333333' : '#e1e5e9',
    borderLight: theme === 'dark' ? '#404040' : '#f1f5f9',
    text: theme === 'dark' ? '#E0E0E0' : '#2c3e50',
    textSecondary: theme === 'dark' ? '#BDBDBD' : '#6c757d',
    textMuted: theme === 'dark' ? '#757575' : '#94a3b8',
    warning: theme === 'dark' ? '#FFB74D' : '#ffc107',
    success: theme === 'dark' ? '#81C784' : '#4caf50',
    shadow: theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)',
    shadowLight: theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
    gradient: theme === 'dark'
      ? 'linear-gradient(135deg, #1E1E1E 0%, #121212 100%)'
      : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
    cardGradient: theme === 'dark'
      ? 'linear-gradient(180deg, #1E1E1E 0%, #171717 100%)'
      : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    metrics: {
      prr: theme === 'dark' ? '#64B5F6' : '#3b82f6',
      chi: theme === 'dark' ? '#B39DDB' : '#8b5cf6',
      cases: theme === 'dark' ? '#81C784' : '#10b981'
    },
    fonts: {
      primary: "'Orbitron', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      monospace: "'Orbitron', monospace"
    }
  }), [theme]);

  // API call setup
  const { data: apiResponse, error: apiError, loading: apiLoading, refetch } = useApi({
    url: 'https://sig-vig-866002518023.us-central1.run.app/calculate-dlp-signals',
    method: 'post',
    body: sheetData,
    enabled: false, // Don't call automatically
    queryKey: ['analysis', selectedSheet]
  });

  // Handle file upload
  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }
    setFile(file);
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('excel_file', file);
      const response = await fetch('https://sig-vig-866002518023.us-central1.run.app/calculate-dlp-signals', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        console.error('Invalid data format received:', data);
        throw new Error('Invalid data format received from server');
      }
      const processedData = data.map((signal, index) => ({
        id: index,
        drug: signal.drug_name || 'Unknown Drug',
        event: signal.event_term || 'Unknown Event',
        prr: parseFloat(signal.PRR) || 0,
        ror: parseFloat(signal.ROR) || 0,
        chi: parseFloat(signal.ChiSquare) || 0,
        new: parseInt(signal.New) || 0,
        now: parseInt(signal.Now) || 0,
        previous: parseInt(signal.Previous) || 0,
        serious: parseInt(signal.Serious) || 0,
        nonserious: parseInt(signal.NonSerious) || 0,
        isDME: Boolean(signal.is_dme),
        isFatal: Boolean(signal.is_fatal),
        isIME: Boolean(signal.is_ime),
        isTME: Boolean(signal.is_tme),
        isESI: Boolean(signal.is_esi),
        isSDR: Boolean(signal.is_sdr),
        caseIds: Array.isArray(signal.case_ids) ? signal.case_ids : []
      }));
      const drugs = [...new Set(processedData.filter(row => row.drug !== 'Unknown Drug').map(row => row.drug))];
      setUniqueDrugs(drugs);
      setResults({
        totalPairs: processedData.length,
        significantSignals: processedData.filter(s => s.prr >= 2 || s.chi >= 4).length,
        topSignals: processedData
      });
      setFilterType('all');
      setSelectedDrug(null);
      setDrugFilter('');
      setEventFilter('');
      setFilters({
        prrMin: '', prrMax: '', chiMin: '', chiMax: '', casesMin: '', casesMax: '', rorMin: '', rorMax: '', newMin: '', newMax: '', nowMin: '', nowMax: '', previousMin: '', previousMax: ''
      });
    } catch (error) {
      console.error('Error processing data:', error);
      alert(`Error processing data: ${error.message}. Please check the console for more details.`);
      setFile(null); // Reset to step 1 on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle drop event
  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFile(file);
      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append('excel_file', file);
        const response = await fetch('https://sig-vig-866002518023.us-central1.run.app/calculate-dlp-signals', {
          method: 'POST',
          body: formData
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        const processedData = data.map((signal, index) => ({
          id: index,
          drug: signal.drug_name || 'Unknown Drug',
          event: signal.event_term || 'Unknown Event',
          prr: parseFloat(signal.PRR) || 0,
          ror: parseFloat(signal.ROR) || 0,
          chi: parseFloat(signal.ChiSquare) || 0,
          new: parseInt(signal.New) || 0,
          now: parseInt(signal.Now) || 0,
          previous: parseInt(signal.Previous) || 0,
          serious: parseInt(signal.Serious) || 0,
          nonserious: parseInt(signal.NonSerious) || 0,
          isDME: Boolean(signal.is_dme),
          isFatal: Boolean(signal.is_fatal),
          isIME: Boolean(signal.is_ime),
          isTME: Boolean(signal.is_tme),
          isESI: Boolean(signal.is_esi),
          isSDR: Boolean(signal.is_sdr),
          caseIds: Array.isArray(signal.case_ids) ? signal.case_ids : []
        }));
        const drugs = [...new Set(processedData.filter(row => row.drug !== 'Unknown Drug').map(row => row.drug))];
        setUniqueDrugs(drugs);
        setResults({
          totalPairs: processedData.length,
          significantSignals: processedData.filter(s => s.prr >= 2 || s.chi >= 4).length,
          topSignals: processedData
        });
        setFilterType('all');
        setSelectedDrug(null);
        setDrugFilter('');
        setEventFilter('');
        setFilters({
          prrMin: '', prrMax: '', chiMin: '', chiMax: '', casesMin: '', casesMax: '', rorMin: '', rorMax: '', newMin: '', newMax: '', nowMin: '', nowMax: '', previousMin: '', previousMax: ''
        });
      } catch (error) {
        console.error('Error processing data:', error);
        alert('Error processing data. Please try again.');
        setFile(null); // Reset to step 1 on error
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  // Handle sheet selection and API call
  const handleSheetSelect = useCallback(async (sheetName) => {
    setSelectedSheet(sheetName);
    setIsLoading(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('excel_file', file);
      formData.append('sheet_name', sheetName);

      // Make API call
      const response = await fetch('https://signal-app-748522437054.us-central1.run.app', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      // Process the API response
      const processedData = data.map(signal => ({
        drug: signal.drug_name,
        event: signal.event_term,
        prr: parseFloat(signal.PRR) || 0,
        ror: parseFloat(signal.ROR) || 0,
        chi: parseFloat(signal.ChiSquare) || 0,
        cases: signal.cases || 0,
        isDME: Boolean(signal.is_dme),
        isFatal: Boolean(signal.is_fatal),
        caseIds: signal.case_ids || []
      }));

      // Extract unique drugs
      const drugs = [...new Set(processedData.map(row => row.drug))];
      setUniqueDrugs(drugs);

      // Set results with the complete data
      setResults({
        totalPairs: processedData.length,
        significantSignals: processedData.filter(s => s.prr >= 2 || s.chi >= 4).length,
        topSignals: processedData // Store complete data
      });

      // Reset filters when loading new data
      setFilterType('all');
      setSelectedDrug(null);
      setDrugFilter('');
      setEventFilter('');
      setFilters({
        prrMin: '',
        prrMax: '',
        chiMin: '',
        chiMax: '',
        casesMin: '',
        casesMax: '',
        rorMin: '',
        rorMax: ''
      });

    } catch (error) {
      console.error('Error processing data:', error);
      alert('Error processing data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [file]);

  // Calculate header counts independently
  const headerCounts = useMemo(() => {
    if (!results?.topSignals) {
      return {
        all: 0,
        sdr: 0,
        dme: 0,
        fatal: 0,
        ime: 0,
        tme: 0,
        esi: 0
      };
    }

    // Apply only basic filters
    let baseFiltered = [...results.topSignals];
    
    if (selectedDrug) {
      baseFiltered = baseFiltered.filter(row => row.drug === selectedDrug);
    }

    if (drugFilter) {
      baseFiltered = baseFiltered.filter(row => 
        row.drug.toLowerCase().includes(drugFilter.toLowerCase())
      );
    }

    if (eventFilter) {
      baseFiltered = baseFiltered.filter(row => 
        row.event.toLowerCase().includes(eventFilter.toLowerCase())
      );
    }

    // Calculate counts from the base filtered data
    return {
      all: baseFiltered.length,
      sdr: baseFiltered.filter(row => row.isSDR).length,
      dme: baseFiltered.filter(row => row.isDME).length,
      fatal: baseFiltered.filter(row => row.isFatal).length,
      ime: baseFiltered.filter(row => row.isIME).length,
      tme: baseFiltered.filter(row => row.isTME).length,
      esi: baseFiltered.filter(row => row.isESI).length
    };
  }, [results?.topSignals, selectedDrug, drugFilter, eventFilter]); // Note: filterType is NOT a dependency

  // Filter data for display separately
  const filteredData = useMemo(() => {
    if (!results?.topSignals) return [];
    
    let filtered = [...results.topSignals];

    // Apply all filters for display data
    if (selectedDrug) {
      filtered = filtered.filter(row => row.drug === selectedDrug);
    }

    if (drugFilter) {
      filtered = filtered.filter(row => 
        row.drug.toLowerCase().includes(drugFilter.toLowerCase())
      );
    }

    if (eventFilter) {
      filtered = filtered.filter(row => 
        row.event.toLowerCase().includes(eventFilter.toLowerCase())
      );
    }

    // Apply numeric filters
    const numericFilters = {
      prr: { min: filters.prrMin, max: filters.prrMax },
      chi: { min: filters.chiMin, max: filters.chiMax },
      now: { min: filters.nowMin, max: filters.nowMax },
      new: { min: filters.newMin, max: filters.newMax },
      previous: { min: filters.previousMin, max: filters.previousMax },
      ror: { min: filters.rorMin, max: filters.rorMax }
    };

    Object.entries(numericFilters).forEach(([field, { min, max }]) => {
      if (min !== '' || max !== '') {
        const minVal = min === '' ? -Infinity : parseFloat(min);
        const maxVal = max === '' ? Infinity : parseFloat(max);
        
        filtered = filtered.filter(row => {
          const value = parseFloat(row[field]);
          return !isNaN(value) && value >= minVal && value <= maxVal;
        });
      }
    });

    // Apply event type filter last and only to display data
    if (filterType !== 'all') {
      const filterMap = {
        sdr: row => row.isSDR,
        dme: row => row.isDME,
        fatal: row => row.isFatal,
        ime: row => row.isIME,
        tme: row => row.isTME,
        esi: row => row.isESI
      };
      
      if (filterMap[filterType]) {
        filtered = filtered.filter(filterMap[filterType]);
      }
    }

    return filtered;
  }, [results?.topSignals, selectedDrug, drugFilter, eventFilter, filterType, filters]);

  // Render header with independent counts
  const renderHeader = () => (
    <div className="flex items-center space-x-4 p-4 overflow-x-auto">
      {[
        { type: 'all', label: 'All' },
        { type: 'sdr', label: 'SDR' },
        { type: 'dme', label: 'DME' },
        { type: 'fatal', label: 'Fatal' },
        { type: 'ime', label: 'IME' },
        { type: 'tme', label: 'TME' }
      ].map(({ type, label }) => (
        <button
          key={type}
          onClick={() => setFilterType(type)}
          className={`px-4 py-2 rounded-lg transition-all duration-200 ${
            filterType === type 
              ? 'bg-blue-500 text-white' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          {label} ({headerCounts[type]})
        </button>
      ))}
    </div>
  );

  // Safe number formatting helper
  const formatNumber = (value, decimals = 2) => {
    if (value === null || value === undefined || isNaN(value)) return '0.00';
    return Number(value).toFixed(decimals);
  };

  // Handle sort
  const handleSort = useCallback((key) => {
    setSortConfig(prevSort => ({
      key,
      direction: prevSort.key === key && prevSort.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setFilterType('all');
    setSelectedDrug(null);
    setDrugFilter('');
    setEventFilter('');
    setFilters({
      prrMin: '',
      prrMax: '',
      chiMin: '',
      chiMax: '',
      casesMin: '',
      casesMax: '',
      rorMin: '',
      rorMax: '',
      newMin: '',
      newMax: '',
      nowMin: '',
      nowMax: '',
      previousMin: '',
      previousMax: ''
    });
    setSortConfig({ key: null, direction: 'asc' });
  }, []);

  // Export to Excel
  const handleExport = useCallback(() => {
    if (!filteredData) return;

    // Get only first 8 columns of data
    const limitedData = filteredData.map(row => {
      const keys = Object.keys(row);
      const limitedRow = {};
      keys.slice(0, 8).forEach(key => {
        limitedRow[key] = row[key];
      });
      return limitedRow;
    });

    // Create worksheet from limited data
    const ws = XLSX.utils.json_to_sheet(limitedData);
    
    // Get the range of the worksheet
    const range = XLSX.utils.decode_range(ws['!ref']);
    
    // Set column widths
    ws['!cols'] = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      // Get header cell to determine column name
      const headerCell = ws[XLSX.utils.encode_cell({ r: 0, c: col })];
      const headerValue = headerCell ? headerCell.v : '';
      
      // Set width based on column content
      let width = 15; // default width
      if (headerValue.toLowerCase().includes('id')) width = 12;
      else if (headerValue.toLowerCase().includes('name') || headerValue.toLowerCase().includes('title')) width = 25;
      else if (headerValue.toLowerCase().includes('date') || headerValue.toLowerCase().includes('time')) width = 18;
      else if (headerValue.toLowerCase().includes('description') || headerValue.toLowerCase().includes('comment')) width = 35;
      else if (headerValue.toLowerCase().includes('status')) width = 12;
      else if (headerValue.toLowerCase().includes('email')) width = 25;
      
      ws['!cols'].push({ wch: width });
    }
    
    // Style header row
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;
      
      ws[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "366092" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }
    
    // Style data rows
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[cellAddress]) continue;
        
        // Alternate row colors
        const fillColor = row % 2 === 0 ? "F8F9FA" : "FFFFFF";
        
        ws[cellAddress].s = {
          fill: { fgColor: { rgb: fillColor } },
          alignment: { vertical: "center", wrapText: true },
          border: {
            top: { style: "thin", color: { rgb: "E0E0E0" } },
            bottom: { style: "thin", color: { rgb: "E0E0E0" } },
            left: { style: "thin", color: { rgb: "E0E0E0" } },
            right: { style: "thin", color: { rgb: "E0E0E0" } }
          }
        };
        
        // Format specific data types
        const cellValue = ws[cellAddress].v;
        
        // Format dates
        if (cellValue instanceof Date || (typeof cellValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(cellValue))) {
          ws[cellAddress].s.numFmt = "dd/mm/yyyy";
        }
        
        // Format numbers with proper alignment
        if (typeof cellValue === 'number') {
          ws[cellAddress].s.alignment = { ...ws[cellAddress].s.alignment, horizontal: "right" };
          // Format currency if it looks like money
          if (cellValue > 1000 && cellValue % 1 !== 0) {
            ws[cellAddress].s.numFmt = "#,##0.00";
          } else if (cellValue > 100) {
            ws[cellAddress].s.numFmt = "#,##0";
          }
        }
        
        // Center align short text
        if (typeof cellValue === 'string' && cellValue.length < 10) {
          ws[cellAddress].s.alignment = { ...ws[cellAddress].s.alignment, horizontal: "center" };
        }
      }
    }
    
    // Set row heights
    ws['!rows'] = [];
    for (let row = range.s.r; row <= range.e.r; row++) {
      if (row === 0) {
        // Header row - taller
        ws['!rows'].push({ hpt: 25 });
      } else {
        // Data rows
        ws['!rows'].push({ hpt: 20 });
      }
    }
    
    // Create workbook and add worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Signal Detection Results");
    
    // Set workbook properties
    wb.Props = {
      Title: "Signal Detection Results",
      Subject: "Exported Data",
      Author: "Signal Detection System",
      CreatedDate: new Date()
    };
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `signal_detection_results_${timestamp}.xlsx`;
    
    // Write file
    XLSX.writeFile(wb, filename);
  }, [filteredData]);
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    },
    exit: { 
      opacity: 0,
      y: -20,
      transition: { duration: 0.4 }
    }
  };

  // Group data by drug
  const groupDataByDrug = (data) => {
    if (!data || !Array.isArray(data)) return {};
    
    return data.reduce((acc, signal) => {
      if (!acc[signal.drug]) {
        acc[signal.drug] = {
          events: [],
          totalCases: 0,
          averagePRR: 0,
          averageROR: 0,
          averageChi: 0,
          significantSignals: 0,
          dmeCount: 0,
          fatalCount: 0,
          imeCount: 0,
          tmeCount: 0,
          esiCount: 0,
          sdrCount: 0,
          newCount: 0,
          nowCount: 0,
          previousCount: 0
        };
      }
      
      acc[signal.drug].events.push(signal);
      acc[signal.drug].totalCases += signal.now || 0;
      acc[signal.drug].dmeCount += signal.isDME ? 1 : 0;
      acc[signal.drug].fatalCount += signal.isFatal ? 1 : 0;
      acc[signal.drug].imeCount += signal.isIME ? 1 : 0;
      acc[signal.drug].tmeCount += signal.isTME ? 1 : 0;
      acc[signal.drug].esiCount += signal.isESI ? 1 : 0;
      acc[signal.drug].sdrCount += signal.isSDR ? 1 : 0;
      acc[signal.drug].newCount += signal.new || 0;
      acc[signal.drug].nowCount += signal.now || 0;
      acc[signal.drug].previousCount += signal.previous || 0;
      acc[signal.drug].significantSignals += (signal.prr >= 2 || signal.chi >= 4) ? 1 : 0;
      
      return acc;
    }, {});
  };

  // Updated SignalCard component
  const SignalCard = React.memo(({ drugName, data, index }) => {
    const isExpanded = expandedCard === drugName;
    
    // Calculate metrics
    const metrics = {
      totalEvents: data.events.length,
      totalCases: data.events.reduce((sum, e) => sum + (e.now || 0), 0),
      avgPRR: data.events.reduce((sum, e) => sum + e.prr, 0) / data.events.length,
      avgROR: data.events.reduce((sum, e) => sum + e.ror, 0) / data.events.length,
      avgChi: data.events.reduce((sum, e) => sum + e.chi, 0) / data.events.length,
      dmeCount: data.events.filter(e => e.isDME).length,
      fatalCount: data.events.filter(e => e.isFatal).length,
      imeCount: data.events.filter(e => e.isIME).length,
      tmeCount: data.events.filter(e => e.isTME).length,
      esiCount: data.events.filter(e => e.isESI).length,
      sdrCount: data.sdrCount,
      newCount: data.events.reduce((sum, e) => sum + (e.new || 0), 0),
      nowCount: data.events.reduce((sum, e) => sum + (e.now || 0), 0),
      previousCount: data.events.reduce((sum, e) => sum + (e.previous || 0), 0),
      significantSignals: data.events.filter(e => e.prr >= 2 || e.chi >= 4).length
    };

    // Group events by type and calculate case counts
    const eventGroups = {
      dme: {
        events: data.events.filter(e => e.isDME),
        cases: data.events.filter(e => e.isDME).reduce((sum, e) => sum + (e.now || 0), 0)
      },
      fatal: {
        events: data.events.filter(e => e.isFatal),
        cases: data.events.filter(e => e.isFatal).reduce((sum, e) => sum + (e.now || 0), 0)
      },
      ime: {
        events: data.events.filter(e => e.isIME),
        cases: data.events.filter(e => e.isIME).reduce((sum, e) => sum + (e.now || 0), 0)
      },
      tme: {
        events: data.events.filter(e => e.isTME),
        cases: data.events.filter(e => e.isTME).reduce((sum, e) => sum + (e.now || 0), 0)
      },
      esi: {
        events: data.events.filter(e => e.isESI),
        cases: data.events.filter(e => e.isESI).reduce((sum, e) => sum + (e.now || 0), 0)
      },
      other: {
        events: data.events.filter(e => !e.isDME && !e.isFatal && !e.isIME && !e.isTME && !e.isESI),
        cases: data.events.filter(e => !e.isDME && !e.isFatal && !e.isIME && !e.isTME && !e.isESI)
          .reduce((sum, e) => sum + (e.now || 0), 0)
      }
    };

    // Sort events by case count (now) descending and take top 20
    const topEvents = [...data.events]
      .sort((a, b) => (b.now || 0) - (a.now || 0))
      .slice(0, 10);

    // Color palette for unique event colors
    const pieColors = [
      '#64B5F6', '#FF5252', '#FFB74D', '#81C784', '#BA68C8', '#FFD54F', '#4DD0E1', '#A1887F', '#90A4AE', '#F06292',
      '#9575CD', '#4DB6AC', '#DCE775', '#FFD740', '#B0BEC5', '#E57373', '#7986CB', '#AED581', '#FFF176', '#AEEA00'
    ];

    // Prepare pie chart data for case distribution by event type (unique color per event, top 20 only)
    const pieChartData = {
      labels: topEvents.map(e => e.event),
      datasets: [{
        data: topEvents.map(e => e.now || 0),
        backgroundColor: topEvents.map((e, idx) => pieColors[idx % pieColors.length]),
        borderColor: cliniFinesseTheme.surface,
        borderWidth: 2
      }]
    };

    const pieChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: cliniFinesseTheme.text,
            usePointStyle: true,
            padding: 10,
            boxWidth: 6,
            font: {
              size: 10,
              weight: '500',
              family: cliniFinesseTheme.fonts.primary
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} cases (${percentage}%)`;
            }
          }
        }
      }
    };

    // PDF download handler
    const handleDownloadPDF = async () => {
      const cardElement = document.getElementById(`signal-card-${drugName}`);
      if (!cardElement) return;
      const canvas = await html2canvas(cardElement, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${drugName}_signal_card.pdf`);
    };

    // Function to generate detailed PDF for a card with visualizations
    const generateDetailedPDF = async (row) => {
      try {
        const doc = new jsPDF();
        const margin = 20;
        let yPos = margin;
        const pageWidth = doc.internal.pageSize.width;
        const contentWidth = pageWidth - (2 * margin);
        
        // Helper function to add text and update yPos
        const addText = (text, fontSize = 12, isBold = false, align = 'left') => {
          doc.setFontSize(fontSize);
          doc.setFont('helvetica', isBold ? 'bold' : 'normal');
          doc.text(text, align === 'center' ? pageWidth / 2 : margin, yPos, { align });
          yPos += fontSize * 0.8;
        };

        // Add header with drug name
        doc.setFillColor(247, 250, 252);
        doc.rect(0, 0, pageWidth, 40, 'F');
        addText(row.drug, 24, true, 'center');
        yPos += 10;

        // Add summary metrics
        const summaryMetrics = [
          { label: 'Total Cases', value: row.now },
          { label: 'New Cases', value: row.new },
          { label: 'Previous Cases', value: row.previous }
        ];

        doc.setFillColor(240, 247, 255);
        doc.rect(margin, yPos, contentWidth, 25, 'F');
        yPos += 8;
        
        // Display metrics in a row
        const metricWidth = contentWidth / summaryMetrics.length;
        summaryMetrics.forEach((metric, index) => {
          const xPos = margin + (metricWidth * index) + (metricWidth / 2);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(metric.value.toString(), xPos, yPos, { align: 'center' });
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(metric.label, xPos, yPos + 10, { align: 'center' });
        });
        yPos += 25;

        // Add Signal Analysis section
        addText('Signal Analysis', 16, true);
        yPos += 5;

        // Create signal metrics table
        const signalMetrics = [
          ['Metric', 'Value', 'Threshold'],
          ['PRR', formatNumber(row.prr), '> 2.0'],
          ['Chi-Square', formatNumber(row.chi), '> 4.0'],
          ['ROR', formatNumber(row.ror), '> 2.0']
        ];

        doc.autoTable({
          startY: yPos,
          head: [signalMetrics[0]],
          body: signalMetrics.slice(1),
          theme: 'grid',
          headStyles: { fillColor: [66, 153, 225], textColor: 255 },
          styles: { fontSize: 10 },
          margin: { left: margin }
        });
        yPos = doc.lastAutoTable.finalY + 15;

        // Add Event Classifications section
        addText('Event Classifications', 16, true);
        yPos += 5;

        // Create classifications grid
        const classifications = [
          { label: 'SDR', value: row.isSDR },
          { label: 'DME', value: row.isDME },
          { label: 'Fatal', value: row.isFatal },
          { label: 'IME', value: row.isIME },
          { label: 'TME', value: row.isTME },
          { label: 'ESI', value: row.isESI }
        ];

        // Draw classifications as a grid
        const boxSize = 30;
        const boxesPerRow = 3;
        const gapBetweenBoxes = 10;
        const totalRowWidth = (boxSize * boxesPerRow) + (gapBetweenBoxes * (boxesPerRow - 1));
        let startX = (pageWidth - totalRowWidth) / 2;
        let currentX = startX;
        let currentY = yPos;

        classifications.forEach((classification, index) => {
          if (index > 0 && index % boxesPerRow === 0) {
            currentX = startX;
            currentY += boxSize + gapBetweenBoxes;
          }

          // Draw box
          doc.setFillColor(classification.value ? [66, 153, 225] : [226, 232, 240]);
          doc.rect(currentX, currentY, boxSize, boxSize, 'F');
          
          // Add label
          doc.setFontSize(8);
          doc.setTextColor(classification.value ? 255 : 0);
          doc.text(classification.label, currentX + (boxSize/2), currentY + (boxSize/2), { align: 'center' });
          
          currentX += boxSize + gapBetweenBoxes;
        });
        yPos = currentY + boxSize + 20;

        // Add Trend Analysis section if we have historical data
        if (row.previous > 0 || row.new > 0) {
          addText('Trend Analysis', 16, true);
          yPos += 5;

          // Create trend data
          const trendData = {
            labels: ['Previous', 'Current', 'New'],
            datasets: [{
              data: [row.previous, row.now, row.new]
            }]
          };

          // Generate trend chart using Chart.js
          const canvas = document.createElement('canvas');
          canvas.width = 400;
          canvas.height = 200;
          const ctx = canvas.getContext('2d');
          new Chart(ctx, {
            type: 'line',
            data: trendData,
            options: {
              responsive: false,
              scales: {
                y: { beginAtZero: true }
              }
            }
          });

          // Add chart to PDF
          const chartImage = canvas.toDataURL('image/png');
          doc.addImage(chartImage, 'PNG', margin, yPos, contentWidth, 80);
          yPos += 90;
        }

        // Add Case IDs section if available
        if (row.caseIds && row.caseIds.length > 0) {
          if (yPos > doc.internal.pageSize.height - 60) {
            doc.addPage();
            yPos = margin;
          }

          addText('Case IDs', 16, true);
          yPos += 5;

          // Create case IDs table
          const caseIdChunks = [];
          for (let i = 0; i < row.caseIds.length; i += 5) {
            caseIdChunks.push(row.caseIds.slice(i, i + 5));
          }

          doc.autoTable({
            startY: yPos,
            head: [['Case IDs']],
            body: caseIdChunks.map(chunk => [chunk.join(', ')]),
            theme: 'grid',
            headStyles: { fillColor: [66, 153, 225] },
            styles: { fontSize: 8, cellPadding: 2 },
            margin: { left: margin }
          });
        }

        // Add footer with timestamp
        const timestamp = new Date().toLocaleString();
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(`Generated on: ${timestamp}`, margin, doc.internal.pageSize.height - 10);

        // Save the PDF
        doc.save(`${row.drug}-analysis-report.pdf`.replace(/[^a-zA-Z0-9-]/g, '_'));

      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please try again.');
      }
    };

    // Update the card rendering to use the new PDF generation
    const renderCard = (row) => (
      <motion.div
        key={row.id}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{row.drug}</h3>
            <div className="flex space-x-4">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {row.now} Cases
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">
                {row.events.length} Signals
              </div>
            </div>
          </div>
          <button
            onClick={() => generateDetailedPDF(row)}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            title="Download Detailed PDF Report"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">SDR</div>
            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">{row.sdrCount}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Fatal</div>
            <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">{row.fatalCount}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">DME</div>
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">{row.dmeCount}</div>
          </div>
        </div>

        {expandedCard === row.drug && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">IME</div>
                <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">{row.imeCount}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">TME</div>
                <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">{row.tmeCount}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">ESI</div>
                <div className="text-lg font-semibold text-red-600 dark:text-red-400">{row.esiCount}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">New Cases</div>
                <div className="text-lg font-semibold text-teal-600 dark:text-teal-400">{row.newCount}</div>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Top Events</h4>
              <div className="space-y-2">
                {row.events.slice(0, 5).map((event, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{event.event}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{event.now} cases</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setExpandedCard(expandedCard === row.drug ? null : row.drug)}
          className="mt-4 w-full flex items-center justify-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <span>{expandedCard === row.drug ? 'Show Less' : 'Show More'}</span>
          <svg
            className={`w-4 h-4 ml-1 transform transition-transform ${expandedCard === row.drug ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </motion.div>
    );

    return (
      <motion.div
        id={`signal-card-${drugName}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          scale: isExpanded ? 1 : 0.98
        }}
        transition={{ 
          duration: 0.3,
          delay: !expandedCard ? index * 0.1 : 0
        }}
        className={`rounded-xl overflow-hidden transition-all duration-300 ${
          expandedCard && !isExpanded ? 'hidden' : ''
        }`}
        style={{ 
          backgroundColor: cliniFinesseTheme.surface,
          boxShadow: `0 4px ${isExpanded ? '32px' : '20px'} ${cliniFinesseTheme.shadowLight}`,
          border: `1px solid ${cliniFinesseTheme.border}`
        }}
      >
        {/* Card Header */}
        <div className="p-3 sm:p-4 border-b relative overflow-hidden" style={{ borderColor: cliniFinesseTheme.border }}>
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
            <div 
              className="w-full h-full rounded-full opacity-10"
              style={{ backgroundColor: cliniFinesseTheme.primary }}
            />
          </div>
          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-semibold mb-1 specimen-font" style={{ color: cliniFinesseTheme.text }}>
                  {drugName}
                </h3>
              </div>
              <button
                onClick={() => {
                  if (isExpanded) {
                    setExpandedCard(null);
                  } else {
                    setExpandedCard(drugName);
                  }
                }}
                className="p-2 rounded-lg transition-all duration-200 hover:bg-opacity-80"
                style={{ 
                  backgroundColor: isExpanded ? `${cliniFinesseTheme.primary}15` : 'transparent',
                  color: isExpanded ? cliniFinesseTheme.primary : cliniFinesseTheme.textSecondary
                }}
              >
                <motion.svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </button>
            </div>
            <div className="flex flex-wrap gap-2 specimen-font-medium">
              <span className="text-xs sm:text-sm" style={{ color: cliniFinesseTheme.textSecondary }}>
                {metrics.totalCases} Cases
              </span>
              <span 
                className="text-xs sm:text-sm px-2 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: `${cliniFinesseTheme.primary}15`,
                  color: cliniFinesseTheme.primary
                }}
              >
                {metrics.significantSignals} Signals
              </span>
            </div>
          </div>
        </div>
        {/* Metrics Grid or SDR/Fatal/DME counts for card view */}
        {viewMode === 'card' ? (
          <div className="p-3 sm:p-4 grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: 'SDR', value: metrics.sdrCount, color: cliniFinesseTheme.primary },
              { label: 'Fatal', value: metrics.fatalCount, color: cliniFinesseTheme.metrics.chi },
              { label: 'DME', value: metrics.dmeCount, color: cliniFinesseTheme.metrics.prr }
            ].map((metric, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center p-2 sm:p-3 rounded-lg"
                style={{ 
                  backgroundColor: `${cliniFinesseTheme.surfaceActive}`,
                  border: `1px solid ${cliniFinesseTheme.border}`
                }}
              >
                <div className="text-xs font-medium mb-1 specimen-font-medium" style={{ color: cliniFinesseTheme.textMuted }}>
                  {metric.label}
                </div>
                <div 
                  className="text-sm sm:text-base font-semibold specimen-font-semibold"
                  style={{ color: metric.color }}
                >
                  {metric.value}
                </div>
              </div>
            ))}
          </div>
        ) : (
        <div className="p-3 sm:p-4 grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: 'Avg PRR', value: metrics.avgPRR, threshold: 2, color: 'prr' },
            { label: 'Avg ROR', value: metrics.avgROR, threshold: 2, color: 'prr' },
            { label: 'Avg χ²', value: metrics.avgChi, threshold: 4, color: 'chi' }
          ].map((metric, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center p-2 sm:p-3 rounded-lg"
              style={{ 
                backgroundColor: `${cliniFinesseTheme.surfaceActive}`,
                border: `1px solid ${cliniFinesseTheme.border}`
              }}
            >
              <div className="text-xs font-medium mb-1 specimen-font-medium" style={{ color: cliniFinesseTheme.textMuted }}>
                {metric.label}
              </div>
              <div 
                className="text-sm sm:text-base font-semibold specimen-font-semibold"
                style={{ 
                  color: metric.value >= metric.threshold 
                    ? cliniFinesseTheme.metrics[metric.color]
                    : cliniFinesseTheme.text
                }}
              >
                {metric.value.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        )}
        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t"
              style={{ borderColor: cliniFinesseTheme.border }}
            >
              {/* Pie Chart */}
              <div className="p-4 border-b" style={{ borderColor: cliniFinesseTheme.border }}>
                <h4 className="text-sm font-medium mb-4 specimen-font-medium" style={{ color: cliniFinesseTheme.textSecondary }}>
                  Case Distribution by Event Type
                </h4>
                <div className="h-64">
                  <Pie data={pieChartData} options={pieChartOptions} />
                </div>
              </div>

              {/* Events List */}
              <div className="p-3 sm:p-4 space-y-2">
                {['dme', 'fatal', 'ime', 'tme', 'esi', 'other'].map(group => (
                  eventGroups[group].events.length > 0 && (
                    <div key={group} className="space-y-2">
                      <h4 
                        className="text-sm font-medium px-2 specimen-font-medium"
                        style={{ color: cliniFinesseTheme.textSecondary }}
                      >
                        {group.toUpperCase()} Events ({eventGroups[group].events.length}) - {eventGroups[group].cases} Cases
                      </h4>
                      <div className="space-y-2">
                        {eventGroups[group].events.map((event, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-3 rounded-lg"
                            style={{ 
                              backgroundColor: cliniFinesseTheme.surfaceActive,
                              border: `1px solid ${cliniFinesseTheme.border}`
                            }}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div className="flex-1">
                                <div className="font-medium specimen-font" style={{ color: cliniFinesseTheme.text }}>
                                  {event.event}
                                </div>
                                <div className="text-sm specimen-font-medium" style={{ color: cliniFinesseTheme.textSecondary }}>
                                  {event.now || 0} Cases
                                </div>
                              </div>
                              <div className="flex justify-end space-x-4">
                                <div className="text-right">
                                  <div className="text-xs specimen-font-medium" style={{ color: cliniFinesseTheme.textMuted }}>PRR</div>
                                  <div 
                                    className="font-medium specimen-font"
                                    style={{ color: event.prr >= 2 ? cliniFinesseTheme.metrics.prr : cliniFinesseTheme.text }}
                                  >
                                    {event.prr.toFixed(2)}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs specimen-font-medium" style={{ color: cliniFinesseTheme.textMuted }}>χ²</div>
                                  <div 
                                    className="font-medium specimen-font"
                                    style={{ color: event.chi >= 4 ? cliniFinesseTheme.metrics.chi : cliniFinesseTheme.text }}
                                  >
                                    {event.chi.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  });

  // Memoize chart options
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: cliniFinesseTheme.text,
          usePointStyle: true,
          padding: 10,
          boxWidth: 6,
          font: {
            size: 10,
            weight: '500',
            family: cliniFinesseTheme.fonts.primary
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: cliniFinesseTheme.border + '20'
        },
        ticks: {
          color: cliniFinesseTheme.textSecondary,
          font: {
            size: 10,
            family: cliniFinesseTheme.fonts.primary
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: cliniFinesseTheme.textSecondary,
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 10,
            family: cliniFinesseTheme.fonts.primary
          }
        }
      }
    }
  }), [cliniFinesseTheme]);

  // Memoize chart colors
  const chartColors = useMemo(() => ({
    prr: {
      backgroundColor: cliniFinesseTheme.metrics.prr + '80',
      borderColor: cliniFinesseTheme.metrics.prr
    },
    chi: {
      backgroundColor: cliniFinesseTheme.metrics.chi + '80',
      borderColor: cliniFinesseTheme.metrics.chi
    },
    cases: {
      backgroundColor: cliniFinesseTheme.metrics.cases + '20',
      borderColor: cliniFinesseTheme.metrics.cases
    }
  }), [cliniFinesseTheme]);

  // Add virtualization for table rows
  const parentRef = useRef();
  const rowVirtualizer = useVirtual({
    size: filteredData?.length || 0,
    parentRef,
    estimateSize: useCallback(() => 48, []), // Estimated row height
    overscan: 5
  });

  // 2. Create a SignalTable component below the main component
  const columns = [
    { field: 'drug', headerName: 'Drug', flex: 1, minWidth: 120 },
    { field: 'event', headerName: 'Event', flex: 2, minWidth: 200, renderCell: (params) => <strong>{params.value}</strong> },
    { field: 'prr', headerName: 'PRR', type: 'number', flex: 1, minWidth: 80, valueFormatter: ({ value }) => value?.toFixed ? value.toFixed(2) : value },
    { field: 'ror', headerName: 'ROR', type: 'number', flex: 1, minWidth: 80, valueFormatter: ({ value }) => value?.toFixed ? value.toFixed(2) : value },
    { field: 'chi', headerName: 'Chi-Square', type: 'number', flex: 1, minWidth: 100, valueFormatter: ({ value }) => value?.toFixed ? value.toFixed(2) : value },
    { field: 'serious', headerName: 'Serious', type: 'number', flex: 1, minWidth: 90 },
    { field: 'nonserious', headerName: 'Non-Serious', type: 'number', flex: 1, minWidth: 110 },
    { field: 'now', headerName: 'Current Cases', type: 'number', flex: 1, minWidth: 100 },
    { field: 'new', headerName: 'New Cases', type: 'number', flex: 1, minWidth: 100 },
    { field: 'previous', headerName: 'Previous Cases', type: 'number', flex: 1, minWidth: 120 },
  ];

  function SignalTable({ rows }) {
    return (
      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={rows.map((row, i) => ({ id: i, ...row }))}
          columns={columns}
          pageSize={20}
          rowsPerPageOptions={[10, 20, 50, 100]}
          disableSelectionOnClick
          sx={{
            '& .MuiDataGrid-columnHeaders': { backgroundColor: '#222' },
            '& .MuiDataGrid-cell': { color: '#fff', backgroundColor: '#181818' },
            '& .MuiDataGrid-row': { borderBottom: '1px solid #333' },
            '& .MuiDataGrid-footerContainer': { backgroundColor: '#222', color: '#fff' },
          }}
        />
      </div>
    );
  }

  // Controls section for both table and card views
  const ControlsSection = (
    <div 
      className={`rounded-xl overflow-hidden mb-6 ${
        viewMode !== 'chart' && !(viewMode === 'card' && expandedCard) ? 'sticky top-20 z-10 backdrop-blur-sm' : ''
      }`}
      style={{ 
        backgroundColor: cliniFinesseTheme.surface,
        border: `1px solid ${cliniFinesseTheme.border}`,
        boxShadow: `0 4px 12px ${cliniFinesseTheme.shadowLight}`
      }}
    >
      <div className="border-b" style={{ borderColor: cliniFinesseTheme.border }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
          <div className="flex flex-wrap gap-2 order-2 sm:order-1">
            {(viewMode === 'card'
              ? [ { id: 'all', label: `All (${headerCounts.all})` } ]
              : [
                  { id: 'all', label: `All (${headerCounts.all})` },
                  { id: 'sdr', label: `SDR (${headerCounts.sdr})` },
                  { id: 'dme', label: `DME (${headerCounts.dme})` },
                  { id: 'fatal', label: `Fatal (${headerCounts.fatal})` },
                  { id: 'ime', label: `IME (${headerCounts.ime})` },
                  { id: 'tme', label: `TME (${headerCounts.tme})` }
                ]
            ).map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 specimen-font-medium"
                style={{ 
                  backgroundColor: filterType === tab.id ? `${cliniFinesseTheme.primary}15` : 'transparent',
                  color: filterType === tab.id ? cliniFinesseTheme.primary : cliniFinesseTheme.textSecondary,
                  border: `1px solid ${filterType === tab.id ? cliniFinesseTheme.primary : cliniFinesseTheme.border}`
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto order-1 sm:order-2">
            <div className="flex items-center justify-center">
              <div 
                className="flex items-center gap-2 p-1 rounded-lg"
                style={{ 
                  backgroundColor: `${cliniFinesseTheme.surfaceActive}40`,
                  border: `1px solid ${cliniFinesseTheme.border}`
                }}
              >
                {[
                  { id: 'table', label: 'Table', icon: 'M3 10h18M3 14h18M3 18h18M3 6h18' },
                  { id: 'card', label: 'Cards', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z' },
                  { id: 'chart', label: 'Charts', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
                ].map(view => (
                  <button
                    key={view.id}
                    onClick={() => handleViewModeChange(view.id)}
                    className={`p-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 specimen-font-medium`}
                    style={{ 
                      backgroundColor: viewMode === view.id ? cliniFinesseTheme.surfaceActive : 'transparent',
                      color: viewMode === view.id ? cliniFinesseTheme.primary : cliniFinesseTheme.textSecondary
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={view.icon} />
                    </svg>
                    <span className="hidden sm:inline">{view.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="relative flex-1 sm:flex-none">
              <select
                value={selectedDrug || ''}
                onChange={(e) => setSelectedDrug(e.target.value)}
                className="px-4 py-2 rounded-lg text-sm transition-all duration-200 appearance-none w-full specimen-font-medium"
                style={{ 
                  backgroundColor: cliniFinesseTheme.surface,
                  border: `1px solid ${cliniFinesseTheme.border}`,
                  color: cliniFinesseTheme.text,
                  boxShadow: `0 2px 8px ${cliniFinesseTheme.shadowLight}`
                }}
              >
                <option value="">All Drugs</option>
                {uniqueDrugs.map(drug => (
                  <option key={drug} value={drug} className="specimen-font">{drug}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke={cliniFinesseTheme.textSecondary} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Add handler for view mode changes
  const handleViewModeChange = (mode) => {
    if (mode === 'card') {
      // Reset all filters when switching to card view
      setFilterType('all');
      setSelectedDrug(null);
      setDrugFilter('');
      setEventFilter('');
      setFilters({
        prrMin: '',
        prrMax: '',
        chiMin: '',
        chiMax: '',
        casesMin: '',
        casesMax: '',
        rorMin: '',
        rorMax: '',
        newMin: '',
        newMax: '',
        nowMin: '',
        nowMax: '',
        previousMin: '',
        previousMax: ''
      });
    }
    setViewMode(mode);
  };

  return (
    <div 
      className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8 transition-all duration-300"
      style={{ 
        backgroundColor: cliniFinesseTheme.background,
        color: cliniFinesseTheme.text,
        fontFamily: cliniFinesseTheme.fonts.primary
      }}
    >
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto mt-8"
      >
        {/* Header */}
        {!file ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 
              className="text-4xl font-bold mb-4 specimen-font"
            style={{ color: cliniFinesseTheme.text }}
          >
            Signal Detection Analysis
          </h1>
            <p 
              className="text-lg specimen-font-medium"
              style={{ color: cliniFinesseTheme.textSecondary }}
            >
            Upload your Excel file to analyze drug-event associations
          </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 
              className="text-3xl font-bold mb-2 specimen-font"
              style={{ color: cliniFinesseTheme.text }}
            >
              Analysis Results
            </h1>
            <p 
              className="text-base specimen-font-medium"
              style={{ color: cliniFinesseTheme.textSecondary }}
            >
              {file.name}
            </p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* File Upload */}
          {!file && (
            <motion.div 
              key="upload"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div 
                className={`
                  relative border-2 border-dashed rounded-xl p-12 text-center
                  transition-all duration-200 ease-in-out
                `}
                style={{ 
                  backgroundColor: cliniFinesseTheme.surface,
                  borderColor: dragActive ? cliniFinesseTheme.primary : cliniFinesseTheme.border,
                  color: cliniFinesseTheme.text,
                  boxShadow: `0 8px 24px ${cliniFinesseTheme.shadow}`
                }}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".xlsx,.xls,.xlsm"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label 
                  htmlFor="file-upload"
                  className="cursor-pointer block"
                >
                  <motion.div 
                    className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ 
                      backgroundColor: `${cliniFinesseTheme.primary}15`,
                      color: cliniFinesseTheme.primary
                    }}
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </motion.div>
                  <h3 
                    className="text-lg font-medium mb-2 specimen-font"
                    style={{ color: cliniFinesseTheme.text }}
                  >
                    Drop your Excel file here
                  </h3>
                  <p className="specimen-font-medium" style={{ color: cliniFinesseTheme.textSecondary }}>
                    Supported formats: .xlsx, .xls, .xlsm
                  </p>
                </label>
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div className="inline-flex items-center space-x-3">
                <div 
                  className="animate-spin rounded-full h-6 w-6 border-b-2"
                  style={{ borderColor: cliniFinesseTheme.primary }}
                ></div>
                <span className="specimen-font-medium" style={{ color: cliniFinesseTheme.textSecondary }}>
                  Processing your data...
                </span>
              </div>
            </motion.div>
          )}

          {/* Results Section */}
          {results && !isLoading && (
            <motion.div
              key="results"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-8"
            >
              {viewMode === 'table' ? (
                <div className="flex flex-col space-y-6">
                  {/* Controls Section with proper spacing and z-index */}
                  <div className="relative z-10">
                  {ControlsSection}
                    </div>

                  {/* Summary Cards with proper spacing */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <motion.div 
                      className="rounded-xl p-6 relative overflow-hidden" 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ 
                        backgroundColor: cliniFinesseTheme.surface, 
                        boxShadow: `0 8px 24px ${cliniFinesseTheme.shadow}`, 
                        border: `1px solid ${cliniFinesseTheme.border}` 
                      }}
                    >
                      <div className="text-3xl font-bold mb-2 specimen-font" style={{ color: cliniFinesseTheme.primary }}>{headerCounts.sdr}</div>
                      <div className="specimen-font-medium" style={{ color: cliniFinesseTheme.textSecondary }}>SDR</div>
                    </motion.div>
                    <motion.div 
                      className="rounded-xl p-6 relative overflow-hidden"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      style={{ 
                        backgroundColor: cliniFinesseTheme.surface, 
                        boxShadow: `0 8px 24px ${cliniFinesseTheme.shadow}`, 
                        border: `1px solid ${cliniFinesseTheme.border}` 
                      }}
                    >
                      <div className="text-3xl font-bold mb-2 specimen-font" style={{ color: cliniFinesseTheme.metrics.prr }}>{headerCounts.dme}</div>
                      <div className="specimen-font-medium" style={{ color: cliniFinesseTheme.textSecondary }}>DME</div>
                    </motion.div>
                    <motion.div 
                      className="rounded-xl p-6 relative overflow-hidden"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      style={{ 
                        backgroundColor: cliniFinesseTheme.surface, 
                        boxShadow: `0 8px 24px ${cliniFinesseTheme.shadow}`, 
                        border: `1px solid ${cliniFinesseTheme.border}` 
                      }}
                    >
                      <div className="text-3xl font-bold mb-2 specimen-font" style={{ color: cliniFinesseTheme.metrics.chi }}>{headerCounts.fatal}</div>
                      <div className="specimen-font-medium" style={{ color: cliniFinesseTheme.textSecondary }}>Fatal</div>
                    </motion.div>
                    <motion.div 
                      className="rounded-xl p-6 relative overflow-hidden"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      style={{ 
                        backgroundColor: cliniFinesseTheme.surface, 
                        boxShadow: `0 8px 24px ${cliniFinesseTheme.shadow}`, 
                        border: `1px solid ${cliniFinesseTheme.border}` 
                      }}
                    >
                      <div className="text-3xl font-bold mb-2 specimen-font" style={{ color: cliniFinesseTheme.metrics.cases }}>{headerCounts.ime}</div>
                      <div className="specimen-font-medium" style={{ color: cliniFinesseTheme.textSecondary }}>IME</div>
                    </motion.div>
                    </div>

                  {/* Enhanced Table Container */}
                  <div 
                    className="rounded-xl shadow-lg overflow-hidden"
                    style={{ 
                      background: cliniFinesseTheme.surface,
                      border: `1px solid ${cliniFinesseTheme.border}`,
                    }}
                  >
                    {/* Table Header Controls */}
                    <div 
                      className="px-6 py-4 border-b flex items-center justify-between flex-wrap gap-4"
                      style={{ borderColor: cliniFinesseTheme.border }}
                    >
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-semibold specimen-font" style={{ color: cliniFinesseTheme.text }}>
                          Analysis Results
                        </h3>
                        <span className="text-sm specimen-font-medium" style={{ color: cliniFinesseTheme.textSecondary }}>
                          {filteredData.length} entries
                        </span>
                  </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={handleResetFilters}
                          className="px-4 py-2 rounded-lg text-sm transition-all duration-200 specimen-font-medium"
                          style={{ 
                            backgroundColor: cliniFinesseTheme.surfaceActive,
                            color: cliniFinesseTheme.textSecondary,
                            border: `1px solid ${cliniFinesseTheme.border}`
                          }}
                        >
                          Reset Filters
                        </button>
                      </div>
                    </div>

                    {/* Table Container */}
                    <div 
                      style={{ 
                        maxHeight: 'calc(100vh - 300px)', // Increased from 400px to 300px to make table taller
                        minHeight: '600px', // Increased from 400px to 600px
                        overflowY: 'auto'
                      }}
                    >
                      <table className="w-full table-fixed" style={{ fontFamily: "'Play', monospace" }}>
                        <thead>
                          <tr 
                            className="text-left"
                            style={{ 
                              position: 'sticky', 
                              top: 0, 
                              backgroundColor: cliniFinesseTheme.surfaceActive,
                              borderBottom: `2px solid ${cliniFinesseTheme.border}`,
                              zIndex: 1
                            }}
                          >
                            <th className="w-[15%] px-4 py-4 font-semibold specimen-font" style={{ color: cliniFinesseTheme.primary }}>
                              <div className="flex items-center gap-2 truncate">
                                Drug
                                {sortConfig.key === 'drug' && (
                                  <span style={{ color: cliniFinesseTheme.textSecondary }}>
                                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </div>
                            </th>
                            <th className="w-[20%] px-4 py-4 font-semibold specimen-font" style={{ color: cliniFinesseTheme.primary }}>
                              <div className="flex items-center gap-2 truncate">
                                Event
                                {sortConfig.key === 'event' && (
                                  <span style={{ color: cliniFinesseTheme.textSecondary }}>
                                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </div>
                            </th>
                            <th className="w-[10%] px-4 py-4 text-right font-semibold specimen-font">Current Cases</th>
                            <th className="w-[10%] px-4 py-4 text-right font-semibold specimen-font">New Cases</th>
                            <th className="w-[12%] px-4 py-4 text-right font-semibold specimen-font">Previous Cases</th>
                            <th className="w-[11%] px-4 py-4 text-right font-semibold specimen-font">
                              <div className="flex items-center justify-end gap-2">
                                PRR
                                {sortConfig.key === 'prr' && (
                                  <span style={{ color: cliniFinesseTheme.textSecondary }}>
                                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </div>
                            </th>
                            <th className="w-[11%] px-4 py-4 text-right font-semibold specimen-font">
                              <div className="flex items-center justify-end gap-2">
                                ROR
                                {sortConfig.key === 'ror' && (
                                  <span style={{ color: cliniFinesseTheme.textSecondary }}>
                                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </div>
                            </th>
                            <th className="w-[11%] px-4 py-4 text-right font-semibold specimen-font">
                              <div className="flex items-center justify-end gap-2">
                                Chi-Square
                                {sortConfig.key === 'chi' && (
                                  <span style={{ color: cliniFinesseTheme.textSecondary }}>
                                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </div>
                            </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.map((signal, idx) => (
                            <motion.tr 
                              key={idx}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, delay: idx * 0.03 }}
                              style={{ 
                                borderBottom: `1px solid ${cliniFinesseTheme.border}`,
                                backgroundColor: idx % 2 === 0 ? cliniFinesseTheme.surface : cliniFinesseTheme.surfaceHover
                              }}
                              className="hover:brightness-110 transition-all duration-200"
                            >
                              <td className="px-4 py-4 specimen-font-medium" style={{ color: cliniFinesseTheme.text }}>
                                <div className="truncate" title={signal.drug || '-'}>
                                  {signal.drug || '-'}
                                </div>
                              </td>
                              <td className="px-4 py-4 specimen-font font-bold" style={{ color: cliniFinesseTheme.text }}>
                                <div className="truncate" title={signal.event || '-'}>
                                  {signal.event || '-'}
                                </div>
                              </td>
                              <td className="px-4 py-4 text-right specimen-font-medium" style={{ color: cliniFinesseTheme.text }}>
                                {signal.now !== undefined ? Number(signal.now).toFixed(0) : '-'}
                              </td>
                              <td className="px-4 py-4 text-right specimen-font-medium" style={{ color: cliniFinesseTheme.text }}>
                                {signal.new !== undefined ? Number(signal.new).toFixed(0) : '-'}
                              </td>
                              <td className="px-4 py-4 text-right specimen-font-medium" style={{ color: cliniFinesseTheme.text }}>
                                {signal.previous !== undefined ? Number(signal.previous).toFixed(0) : '-'}
                              </td>
                              <td 
                                className="px-4 py-4 text-right specimen-font-medium"
                                style={{ 
                                  color: signal.prr >= 2 ? cliniFinesseTheme.metrics.prr : cliniFinesseTheme.text 
                                }}
                              >
                                {typeof signal.prr === 'number' ? Number(signal.prr).toFixed(2) : '-'}
                              </td>
                              <td 
                                className="px-4 py-4 text-right specimen-font-medium"
                                style={{ 
                                  color: signal.ror >= 2 ? cliniFinesseTheme.metrics.prr : cliniFinesseTheme.text 
                                }}
                              >
                                {typeof signal.ror === 'number' ? Number(signal.ror).toFixed(2) : '-'}
                              </td>
                              <td 
                                className="px-4 py-4 text-right specimen-font-medium"
                                style={{ 
                                  color: signal.chi >= 4 ? cliniFinesseTheme.metrics.chi : cliniFinesseTheme.text 
                                }}
                              >
                                {typeof signal.chi === 'number' ? Number(signal.chi).toFixed(2) : '-'}
                              </td>
                            </motion.tr>
                        ))}
                        {filteredData.length === 0 && (
                          <tr>
                              <td 
                                colSpan={8} 
                                className="text-center py-12 specimen-font-medium"
                                style={{ color: cliniFinesseTheme.textSecondary }}
                              >
                                <div className="flex flex-col items-center gap-4">
                                  <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>No results found matching your criteria</span>
                                </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  </div>

                  {/* Export Button */}
                  <div className="p-6 border-t flex justify-end" style={{ borderColor: cliniFinesseTheme.border }}>
                    <motion.button
                      onClick={handleExport}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 specimen-font-medium"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      style={{
                        backgroundColor: cliniFinesseTheme.primary,
                        color: '#ffffff',
                        boxShadow: `0 4px 16px ${cliniFinesseTheme.primary}40`
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 00.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export to Excel
                    </motion.button>
                  </div>
                </div>
              ) : viewMode === 'card' ? (
                <>
                  {ControlsSection}
                  {/* card grid */}
                    <div className="p-2 sm:p-4">
                      <motion.div 
                        className="grid grid-cols-1 gap-4 sm:gap-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        style={{
                          gridTemplateColumns: expandedCard ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))'
                        }}
                      >
                        {Object.entries(groupDataByDrug(results?.topSignals || [])).map(([drugName, data], idx) => (
                          <SignalCard key={drugName} drugName={drugName} data={data} index={idx} />
                        ))}
                        {filteredData?.length === 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="col-span-full flex flex-col items-center justify-center py-12"
                            style={{ color: cliniFinesseTheme.textSecondary }}
                          >
                            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-lg">No results found matching your criteria</span>
                          </motion.div>
                        )}
                      </motion.div>
                    </div>
                </>
              ) : (
                <>
                  {/* Default order for other views (summary cards first, then controls) */}
                  {/* ...summary cards ... */}
                  {ControlsSection}
                  <div className="space-y-8">
                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Case Trend Analysis - make it span 2 columns on large screens for more width */}
                      <div 
                        className="rounded-xl p-6 lg:col-span-2"
                        style={{ 
                          backgroundColor: cliniFinesseTheme.surface,
                          border: `1px solid ${cliniFinesseTheme.border}`,
                          boxShadow: `0 4px 12px ${cliniFinesseTheme.shadowLight}`
                        }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold" style={{ color: cliniFinesseTheme.text }}>
                            Case Trend Analysis
                          </h3>
                            </div>
                        <div className="h-[220px] lg:h-[260px] xl:h-[280px] 2xl:h-[320px]">
                          <Bar
                            data={{
                              labels: filteredData.slice(0, 20).map(r => r.event),
                              datasets: [
                                {
                                  label: 'Previous Cases',
                                  data: filteredData.slice(0, 20).map(r => r.previous),
                                  backgroundColor: cliniFinesseTheme.metrics.cases + '80',
                                  borderColor: cliniFinesseTheme.metrics.cases,
                                  borderWidth: 1,
                                  stack: 'cases',
                                  barPercentage: 0.7,
                                  categoryPercentage: 0.7,
                                },
                                {
                                  label: 'New Cases',
                                  data: filteredData.slice(0, 20).map(r => r.new),
                                  backgroundColor: cliniFinesseTheme.metrics.chi + '80',
                                  borderColor: cliniFinesseTheme.metrics.chi,
                                  borderWidth: 1,
                                  stack: 'cases',
                                  barPercentage: 0.7,
                                  categoryPercentage: 0.7,
                                }
                              ]
                            }}
                            options={{
                              ...chartOptions,
                              plugins: {
                                ...chartOptions.plugins,
                                tooltip: {
                                  ...chartOptions.plugins?.tooltip,
                                  callbacks: {
                                    label: function(context) {
                                      const value = context.raw;
                                      const total = (filteredData[context.dataIndex]?.new || 0) + (filteredData[context.dataIndex]?.previous || 0);
                                      const percentage = total ? ((value / total) * 100).toFixed(1) : 0;
                                      return `${context.dataset.label}: ${value} (${percentage}% of total)`;
                                    }
                                  }
                                },
                                datalabels: {
                                  display: true,
                                  color: cliniFinesseTheme.text,
                                  font: {
                                    weight: 'bold',
                                    family: cliniFinesseTheme.fonts.primary
                                  },
                                  anchor: 'end',
                                  align: 'end',
                                  formatter: function(value, context) {
                                    // Only show on top of the stack
                                    if (context.datasetIndex === 1) {
                                      const total = value + (filteredData[context.dataIndex]?.previous || 0);
                                      return total;
                                    }
                                    return '';
                                  }
                                }
                              },
                              scales: {
                                ...chartOptions.scales,
                                y: {
                                  ...chartOptions.scales.y,
                                  stacked: true,
                                  beginAtZero: true,
                                  title: {
                                    display: true,
                                    text: 'Number of Cases',
                                    color: cliniFinesseTheme.textSecondary
                                  }
                                },
                                x: {
                                  ...chartOptions.scales.x,
                                  stacked: true,
                                  title: {
                                    display: true,
                                    text: 'Events',
                                    color: cliniFinesseTheme.textSecondary
                                  }
                                }
                              },
                              elements: {
                                bar: {
                                  borderWidth: 2,
                                  borderSkipped: false,
                                }
                              },
                              plugins: {
                                ...chartOptions.plugins,
                                datalabels: {
                                  display: true,
                                  color: cliniFinesseTheme.text,
                                  font: {
                                    weight: 'bold',
                                    family: cliniFinesseTheme.fonts.primary
                                  },
                                  anchor: 'end',
                                  align: 'end',
                                  formatter: function(value, context) {
                                    if (context.datasetIndex === 1) {
                                      const total = value + (filteredData[context.dataIndex]?.previous || 0);
                                      return total;
                                    }
                                    return '';
                                  }
                                }
                              }
                            }}
                            
                          />
                        </div>
                        {/* Summary Statistics */}
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div 
                            className="p-3 rounded-lg"
                            style={{ backgroundColor: cliniFinesseTheme.surfaceActive }}
                          >
                            <div className="text-sm" style={{ color: cliniFinesseTheme.textMuted }}>
                              Total Cases
                            </div>
                            <div className="text-lg font-semibold" style={{ color: cliniFinesseTheme.text }}>
                              {filteredData.reduce((sum, r) => sum + (r.now || 0), 0)}
                            </div>
                          </div>
                          <div 
                            className="p-3 rounded-lg"
                            style={{ backgroundColor: cliniFinesseTheme.surfaceActive }}
                          >
                            <div className="text-sm" style={{ color: cliniFinesseTheme.textMuted }}>
                              New Cases
                            </div>
                            <div className="text-lg font-semibold" style={{ color: cliniFinesseTheme.metrics.chi }}>
                              {filteredData.reduce((sum, r) => sum + (r.new || 0), 0)}
                            </div>
                          </div>
                          <div 
                            className="p-3 rounded-lg"
                            style={{ backgroundColor: cliniFinesseTheme.surfaceActive }}
                          >
                            <div className="text-sm" style={{ color: cliniFinesseTheme.textMuted }}>
                              Growth Rate
                            </div>
                            <div className="text-lg font-semibold" style={{ color: cliniFinesseTheme.metrics.prr }}>
                              {(() => {
                                const newCases = filteredData.reduce((sum, r) => sum + (r.new || 0), 0);
                                const previousCases = filteredData.reduce((sum, r) => sum + (r.previous || 0), 0);
                                const growthRate = previousCases ? ((newCases / previousCases) * 100).toFixed(1) : 0;
                                return `${growthRate}%`;
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Event Type Pie Chart - more compact */}
                      <div 
                        className="rounded-xl p-6 flex flex-col items-center justify-center shadow-lg" style={{ backgroundColor: cliniFinesseTheme.surface, border: `1px solid ${cliniFinesseTheme.border}`, boxShadow: `0 6px 24px ${cliniFinesseTheme.shadowLight}` }}
                      >
                        <h3 className="text-lg font-semibold mb-3 text-center" style={{ color: cliniFinesseTheme.text, letterSpacing: '0.5px' }}>
                          Event Type Distribution (%)
                        </h3>
                        <div className="flex flex-col items-center justify-center w-full">
                          <div className="relative flex items-center justify-center" style={{ width: 200, height: 200, filter: 'drop-shadow(0 4px 16px ' + cliniFinesseTheme.primary + '22)' }}>
                          <Pie
                            data={{
                              labels: ['DME', 'Fatal', 'IME', 'TME', 'ESI', 'SDR'],
                              datasets: [{
                                data: [
                                  filteredData.filter(r => r.isDME).length,
                                  filteredData.filter(r => r.isFatal).length,
                                  filteredData.filter(r => r.isIME).length,
                                  filteredData.filter(r => r.isTME).length,
                                  filteredData.filter(r => r.isESI).length,
                                  filteredData.filter(r => r.isSDR).length
                                ],
                                backgroundColor: [
                                  cliniFinesseTheme.metrics.prr + 'cc',
                                  cliniFinesseTheme.metrics.chi + 'cc',
                                  cliniFinesseTheme.metrics.cases + 'cc',
                                  cliniFinesseTheme.primary + 'cc',
                                  cliniFinesseTheme.secondary + 'cc',
                                  cliniFinesseTheme.warning + 'cc'
                                ],
                                borderColor: cliniFinesseTheme.surface,
                                borderWidth: 2,
                                hoverOffset: 8
                              }]
                            }}
                            options={{
                                responsive: true,
                                cutout: '72%',
                              plugins: {
                                legend: {
                                    display: false
                                  },
                                  tooltip: {
                                    enabled: true,
                                    callbacks: {
                                      label: function(context) {
                                        const value = context.raw;
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percent = total ? ((value / total) * 100).toFixed(1) : 0;
                                        return `${context.label}: ${value} (${percent}%)`;
                                      }
                                    }
                                  },
                                  datalabels: {
                                    display: true,
                                    color: cliniFinesseTheme.text,
                                    font: {
                                      weight: 'bold',
                                      size: 13,
                                      family: cliniFinesseTheme.fonts.primary
                                    },
                                    formatter: function(value, context) {
                                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                      const percent = total ? ((value / total) * 100).toFixed(1) : 0;
                                      return percent > 0 ? percent + '%' : '';
                                    }
                                  }
                                },
                                animation: {
                                  animateRotate: true,
                                  animateScale: true
                                }
                              }}
                              plugins={[
                                {
                                  id: 'centerLabel',
                                  afterDraw: (chart) => {
                                    const { ctx, chartArea } = chart;
                                    ctx.save();
                                    ctx.beginPath();
                                    ctx.arc((chartArea.left + chartArea.right) / 2, (chartArea.top + chartArea.bottom) / 2, 44, 0, 2 * Math.PI);
                                    ctx.fillStyle = cliniFinesseTheme.surfaceActive;
                                    ctx.globalAlpha = 0.7;
                                    ctx.fill();
                                    ctx.globalAlpha = 1;
                                    ctx.font = 'bold 22px ' + (cliniFinesseTheme.fonts.primary || 'sans-serif');
                                    ctx.fillStyle = cliniFinesseTheme.primary;
                                    ctx.textAlign = 'center';
                                    ctx.textBaseline = 'middle';
                                    const total =
                                      filteredData.filter(r => r.isDME).length +
                                      filteredData.filter(r => r.isFatal).length +
                                      filteredData.filter(r => r.isIME).length +
                                      filteredData.filter(r => r.isTME).length +
                                      filteredData.filter(r => r.isSDR).length;
                                    ctx.fillText(total, (chartArea.left + chartArea.right) / 2, (chartArea.top + chartArea.bottom) / 2 - 8);
                                    ctx.font = 'normal 13px ' + (cliniFinesseTheme.fonts.primary || 'sans-serif');
                                    ctx.fillStyle = cliniFinesseTheme.textSecondary;
                                    ctx.fillText('Total', (chartArea.left + chartArea.right) / 2, (chartArea.top + chartArea.bottom) / 2 + 16);
                                    ctx.restore();
                                }
                              }
                              ]}
                          />
                        </div>
                          {/* Custom horizontal legend with hover effect */}
                          <div className="flex flex-wrap justify-center gap-3 mt-4">
                            {['DME', 'Fatal', 'IME', 'TME', 'ESI', 'SDR'].map((label, idx) => (
                              <div key={label} className="flex items-center gap-1 specimen-font-medium transition-all duration-150 hover:scale-105 hover:bg-opacity-20 rounded px-2 py-1 cursor-pointer" style={{ fontSize: 13, color: cliniFinesseTheme.textSecondary, backgroundColor: [cliniFinesseTheme.metrics.prr + '22', cliniFinesseTheme.metrics.chi + '22', cliniFinesseTheme.metrics.cases + '22', cliniFinesseTheme.primary + '22', cliniFinesseTheme.secondary + '22', cliniFinesseTheme.warning + '22'][idx] }}>
                                <span className="inline-block rounded-full" style={{ width: 12, height: 12, backgroundColor: [cliniFinesseTheme.metrics.prr + 'cc', cliniFinesseTheme.metrics.chi + 'cc', cliniFinesseTheme.metrics.cases + 'cc', cliniFinesseTheme.primary + 'cc', cliniFinesseTheme.secondary + 'cc', cliniFinesseTheme.warning + 'cc'][idx] }}></span>
                                <span>{label}</span>
                                <span className="ml-1" style={{ color: cliniFinesseTheme.text, fontWeight: 600 }}>{[filteredData.filter(r => r.isDME).length, filteredData.filter(r => r.isFatal).length, filteredData.filter(r => r.isIME).length, filteredData.filter(r => r.isTME).length, filteredData.filter(r => r.isESI).length, filteredData.filter(r => r.isSDR).length][idx]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default PrrChiAnalysis; 