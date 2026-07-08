ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_can_receive_own_conversation_messages" ON realtime.messages;
CREATE POLICY "authenticated_can_receive_own_conversation_messages"
ON realtime.messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversation_members cm
    WHERE cm.user_id = auth.uid()
      AND cm.conversation_id::text = realtime.messages.topic
  )
);
