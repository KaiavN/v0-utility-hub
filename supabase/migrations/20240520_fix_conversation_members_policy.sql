-- First, drop the problematic policy
DROP POLICY IF EXISTS "Users can view their own conversation members" ON conversation_members;

-- Create a new, non-recursive policy
CREATE POLICY "Users can view their own conversation members" ON conversation_members
FOR SELECT
USING (
  auth.uid() = user_id OR 
  conversation_id IN (
    SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid()
  )
);

-- Fix any other potentially recursive policies
DROP POLICY IF EXISTS "Users can view conversations they are members of" ON conversations;

CREATE POLICY "Users can view conversations they are members of" ON conversations
FOR SELECT
USING (
  id IN (
    SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid()
  )
);
