-- Create api_logs table
CREATE TABLE IF NOT EXISTS public.api_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_time DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own logs" ON public.api_logs;
DROP POLICY IF EXISTS "Users can view their own logs" ON public.api_logs;

-- Create a more permissive insert policy for auth endpoints
CREATE POLICY "Allow logging auth endpoints"
    ON public.api_logs
    FOR INSERT
    TO authenticated, anon
    WITH CHECK (
        endpoint LIKE '/auth/%' OR  -- Allow logging for auth endpoints
        auth.uid() = user_id        -- Or if user is logging their own actions
    );

-- Create a policy for viewing logs
CREATE POLICY "Users can view their own logs"
    ON public.api_logs
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT INSERT ON public.api_logs TO anon, authenticated;
GRANT SELECT ON public.api_logs TO authenticated;
GRANT ALL ON public.api_logs TO service_role; 