-- Add primary keys to tables that don't have them

-- Add primary key to cleaned makeup products
ALTER TABLE public."cleaned makeup products" 
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- Only add primary key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'cleaned makeup products' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public."cleaned makeup products" ADD PRIMARY KEY (id);
    END IF;
END $$;