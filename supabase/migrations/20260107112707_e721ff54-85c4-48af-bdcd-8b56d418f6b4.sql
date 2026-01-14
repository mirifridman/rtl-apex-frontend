-- Add new columns to employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS role text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS telegram_chat_id text,
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Add comment for phone format
COMMENT ON COLUMN public.employees.phone IS 'Phone number in format: 972501234567';