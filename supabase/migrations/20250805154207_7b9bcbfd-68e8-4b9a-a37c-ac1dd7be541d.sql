-- Add primary key to mst-e_image_details
ALTER TABLE public."mst-e_image_details" 
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'mst-e_image_details' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public."mst-e_image_details" ADD PRIMARY KEY (id);
    END IF;
END $$;