-- Enable RLS on the conversations table if not already enabled
ALTER TABLE IF EXISTS public.conversations ENABLE ROW LEVEL SECURITY;

-- Add type column to conversations table to distinguish between direct and group chats
ALTER TABLE IF EXISTS public.conversations
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'direct',
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create a blocked_users table to track user blocking
CREATE TABLE IF NOT EXISTS public.blocked_users (
  blocker_id UUID NOT NULL REFERENCES auth.users(id),
  blocked_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);

-- Create a conversation_members table to track group members and their roles
-- (replacing the conversation_participants table which doesn't have roles)
CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'member', -- 'admin', 'member'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Migrate data from conversation_participants to conversation_members if needed
INSERT INTO conversation_members (conversation_id, user_id)
SELECT conversation_id, user_id FROM conversation_participants
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- Create policies for the blocked_users table
CREATE POLICY "Users can see their own blocks"
ON public.blocked_users
FOR SELECT
USING (blocker_id = auth.uid() OR blocked_id = auth.uid());

CREATE POLICY "Users can block other users"
ON public.blocked_users
FOR INSERT
WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "Users can unblock users they blocked"
ON public.blocked_users
FOR DELETE
USING (blocker_id = auth.uid());

-- Create policies for conversation_members
CREATE POLICY "Users can see groups they're in"
ON public.conversation_members
FOR SELECT
USING (user_id = auth.uid() OR 
      conversation_id IN (
        SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid()
      ));

CREATE POLICY "Group admins can manage members"
ON public.conversation_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM conversation_members 
    WHERE conversation_id = conversation_members.conversation_id 
    AND user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Users can join or leave groups"
ON public.conversation_members
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave groups"
ON public.conversation_members
FOR DELETE
USING (user_id = auth.uid());

-- Functions to check if a user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(blocker_id UUID, blocked_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id = $1 AND blocked_id = $2)
       OR (blocker_id = $2 AND blocked_id = $1)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update functions for messaging considering blocks
CREATE OR REPLACE FUNCTION can_message_user(sender_id UUID, recipient_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Can't message if either user blocked the other
  IF is_user_blocked(sender_id, recipient_id) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS on messages table to respect blocked users
DROP POLICY IF EXISTS "Users can see messages in their conversations" ON messages;
CREATE POLICY "Users can see messages in their conversations" 
ON messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_members 
    WHERE conversation_id = messages.conversation_id 
    AND user_id = auth.uid()
  )
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id = auth.uid() AND blocked_id = messages.sender_id)
       OR (blocker_id = messages.sender_id AND blocked_id = auth.uid())
  )
);

-- Create function to create a group chat
CREATE OR REPLACE FUNCTION create_group_chat(
  group_name TEXT,
  group_description TEXT,
  avatar_url TEXT,
  member_ids UUID[]
)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
BEGIN
  -- Create the conversation
  INSERT INTO conversations (type, name, description, created_by, avatar_url)
  VALUES ('group', group_name, group_description, auth.uid(), avatar_url)
  RETURNING id INTO conversation_id;
  
  -- Add the creator as admin
  INSERT INTO conversation_members (conversation_id, user_id, role)
  VALUES (conversation_id, auth.uid(), 'admin');
  
  -- Add members
  IF member_ids IS NOT NULL AND array_length(member_ids, 1) > 0 THEN
    INSERT INTO conversation_members (conversation_id, user_id)
    SELECT conversation_id, member_id
    FROM unnest(member_ids) AS member_id
    WHERE member_id != auth.uid() -- Skip the creator who is already added as admin
    AND NOT is_user_blocked(auth.uid(), member_id); -- Skip blocked users
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
