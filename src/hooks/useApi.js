import { useState } from 'react';

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock API endpoint - Replace with your actual API endpoint
  const API_BASE_URL = 'https://api.example.com';

  const uploadExcelFile = async (file) => {
    try {
      setLoading(true);
      setError(null);

      // For testing, we'll simulate an API call with mock data
      // Replace this with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock response data
      const mockData = {
        headers: ['ID', 'Name', 'Age', 'Status', 'Last Updated'],
        rows: [
          { id: 1, name: 'John Doe', age: 30, status: 'Active', lastUpdated: '2024-03-15' },
          { id: 2, name: 'Jane Smith', age: 28, status: 'Pending', lastUpdated: '2024-03-14' },
          { id: 3, name: 'Mike Johnson', age: 35, status: 'Inactive', lastUpdated: '2024-03-13' },
          { id: 4, name: 'Sarah Williams', age: 32, status: 'Active', lastUpdated: '2024-03-12' },
          { id: 5, name: 'Tom Brown', age: 40, status: 'Active', lastUpdated: '2024-03-11' },
        ]
      };

      return mockData;
    } catch (err) {
      setError(err.message || 'An error occurred while uploading the file');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const analyzeData = async (data) => {
    try {
      setLoading(true);
      setError(null);

      // For testing, we'll simulate an API call with mock data
      // Replace this with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock analysis results
      const mockAnalysis = {
        totalRecords: data.rows.length,
        statusBreakdown: {
          Active: 3,
          Pending: 1,
          Inactive: 1
        },
        averageAge: 33,
        lastUpdateRange: {
          start: '2024-03-11',
          end: '2024-03-15'
        }
      };

      return mockAnalysis;
    } catch (err) {
      setError(err.message || 'An error occurred while analyzing the data');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    uploadExcelFile,
    analyzeData
  };
};

export default useApi; 