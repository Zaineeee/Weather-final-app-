import { supabase } from './supabase';

interface APILogEntry {
  user_id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time: number;
}

export const logApiCall = async (logEntry: APILogEntry) => {
  try {
    // Get current session to ensure we have valid auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('Skipping API log - no active session');
      return;
    }

    const { error } = await supabase
      .from('api_logs')
      .insert([logEntry]);

    if (error) {
      if (error.code === '42501') { // RLS violation
        console.log('Skipping API log due to permissions');
      } else {
        console.error('Error logging API call:', error);
      }
    }
  } catch (error) {
    console.error('Failed to log API call:', error);
  }
};

export const trackApiCall = async <T>(
  endpoint: string,
  method: string,
  apiCall: () => Promise<T>
): Promise<T> => {
  const startTime = performance.now();
  let status_code = 200;
  
  try {
    // Execute the API call first
    const result = await apiCall();
    
    // Handle Supabase response format
    if (result && typeof result === 'object' && 'error' in result) {
      status_code = (result.error as any)?.status || 500;
    }

    return result;
  } catch (error: any) {
    status_code = error?.status || error?.statusCode || 500;
    throw error;
  } finally {
    // Try to log the API call if we can get a user
    try {
      const endTime = performance.now();
      const response_time = endTime - startTime;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await logApiCall({
          user_id: user.id,
          endpoint,
          method,
          status_code,
          response_time
        });
      } else {
        console.log('Skipping API log - no user available');
      }
    } catch (logError) {
      console.log('Failed to log API call:', logError);
    }
  }
}; 