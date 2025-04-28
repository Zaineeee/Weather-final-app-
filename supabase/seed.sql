-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Ensure the role column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'role') 
    THEN
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
END $$;

-- Ensure the last_sign_in column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'last_sign_in') 
    THEN
        ALTER TABLE profiles ADD COLUMN last_sign_in TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create admin user if it doesn't exist
DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@example.com') THEN
        SELECT id INTO new_user_id FROM auth.create_user(
            uid := gen_random_uuid()::text,
            email := 'admin@example.com',
            email_confirm := true,
            password := 'password123',
            data := jsonb_build_object('full_name', 'Admin User')
        );

        -- Create admin profile
        INSERT INTO public.profiles (
            id,
            email,
            full_name,
            role,
            created_at,
            last_sign_in
        )
        VALUES (
            new_user_id,
            'admin@example.com',
            'Admin User',
            'admin',
            NOW(),
            NOW()
        );
    END IF;
END $$;

-- Create test users
DO $$
DECLARE
    new_user_id UUID;
    i INTEGER;
BEGIN
    FOR i IN 1..10 LOOP
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'user' || i || '@example.com') THEN
            -- Create user
            SELECT id INTO new_user_id FROM auth.create_user(
                uid := gen_random_uuid()::text,
                email := 'user' || i || '@example.com',
                email_confirm := true,
                password := 'password123',
                data := jsonb_build_object('full_name', 'Test User ' || i)
            );

            -- Create profile
            INSERT INTO public.profiles (
                id,
                email,
                full_name,
                role,
                created_at,
                last_sign_in
            )
            VALUES (
                new_user_id,
                'user' || i || '@example.com',
                'Test User ' || i,
                'user',
                NOW() - (random() * interval '30 days'),
                NOW() - (random() * interval '24 hours')
            );
        END IF;
    END LOOP;
END $$;

-- Update last_sign_in times for some users to create test data
UPDATE public.profiles 
SET last_sign_in = NOW() - (random() * interval '24 hours')
WHERE role = 'user'; 