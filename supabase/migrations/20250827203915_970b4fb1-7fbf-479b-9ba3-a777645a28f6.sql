-- Security Fix Phase 1B: Complete RLS Policy Implementation
-- Add missing RLS policies for remaining tables

-- skintone table - Allow public read access for skin tone data
CREATE POLICY "Allow public read access to skintone" 
ON "skintone" 
FOR SELECT 
USING (true);

-- subscription_info table - Allow users to manage their own subscription info
CREATE POLICY "Users can view their own subscription info" 
ON "subscription_info" 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription info" 
ON "subscription_info" 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription info" 
ON "subscription_info" 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscription info" 
ON "subscription_info" 
FOR DELETE 
USING (auth.uid() = user_id);

-- skintonetomatachwith products table - Allow public read access for product matching
CREATE POLICY "Allow public read access to skintone to match with products" 
ON "skintonetomatachwith products" 
FOR SELECT 
USING (true);