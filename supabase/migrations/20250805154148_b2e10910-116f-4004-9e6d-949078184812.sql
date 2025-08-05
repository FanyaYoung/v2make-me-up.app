-- Add primary key to golden_and_adversarial_mst-e_image_ids
ALTER TABLE public."golden_and_adversarial_mst-e_image_ids" 
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'golden_and_adversarial_mst-e_image_ids' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public."golden_and_adversarial_mst-e_image_ids" ADD PRIMARY KEY (id);
    END IF;
END $$;