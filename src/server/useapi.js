// hooks/useApi.js
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

function useApi({ 
  url = '', 
  method = 'get', 
  body = null, 
  params = null, 
  headers = {}, 
  enabled = true,
  queryKey = ['genericApi'] 
}) {
  const fetchData = async () => {
    if (!url) throw new Error('API URL is not defined');

    const response = await axios({
      url,
      method,
      data: body,
      params,
      headers,
    });

    return response.data;
  };

  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey,
    queryFn: fetchData,
    enabled,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });

  return {
    data,
    error: error?.message,
    loading: isLoading || isFetching,
    refetch,
  };
}

export default useApi;
