
-- Fix: Replace the vulnerable join_conversation_self policy
-- Only the conversation creator or an existing admin member can add new members
DROP POLICY IF EXISTS "join_conversation_self" ON public.conversation_members;

CREATE POLICY "invited_members_only" ON public.conversation_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_members.conversation_id
        AND c.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM conversation_members cm
      WHERE cm.conversation_id = conversation_members.conversation_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
  );
