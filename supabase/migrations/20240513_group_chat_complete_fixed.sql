-- First check if uuid-ossp extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create typing_status table if it doesn't exist
CREATE TABLE IF NOT EXISTS typing_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL,
  user_id UUID NOT NULL,
  is_typing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Check if conversations table exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'conversations'
  ) THEN
    CREATE TABLE conversations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      type TEXT NOT NULL DEFAULT 'direct',
      name TEXT NULL,
      description TEXT NULL,
      avatar_url TEXT NULL,
      created_by UUID NULL
    );
  END IF;
END $$;

-- Add is_group column to conversations table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'is_group'
  ) THEN
    ALTER TABLE conversations ADD COLUMN is_group BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create conversation_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS conversation_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Create blocked_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read BOOLEAN NOT NULL DEFAULT false
);

-- Create read_receipts table if it doesn't exist
CREATE TABLE IF NOT EXISTS read_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Create index on conversation_members for faster lookups
CREATE INDEX IF NOT EXISTS idx_conversation_members_conversation_id ON conversation_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_user_id ON conversation_members(user_id);

-- Create index on blocked_users for faster lookups
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_id ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_id ON blocked_users(blocked_id);

-- Create index on messages for faster lookups
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- Create index on read_receipts for faster lookups
CREATE INDEX IF NOT EXISTS idx_read_receipts_message_id ON read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_read_receipts_user_id ON read_receipts(user_id);

-- Create index on typing_status for faster lookups
CREATE INDEX IF NOT EXISTS idx_typing_status_conversation_id ON typing_status(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_status_user_id ON typing_status(user_id);

-- Create function to check if a user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(p_blocker_id UUID, p_blocked_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id = p_blocker_id AND blocked_id = p_blocked_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if a user is a member of a conversation
CREATE OR REPLACE FUNCTION is_conversation_member(p_user_id UUID, p_conversation_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM conversation_members
    WHERE user_id = p_user_id AND conversation_id = p_conversation_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get all members of a conversation
CREATE OR REPLACE FUNCTION get_conversation_members(p_conversation_id UUID)
RETURNS TABLE (
  user_id UUID,
  role TEXT,
  joined_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT cm.user_id, cm.role, cm.joined_at
  FROM conversation_members cm
  WHERE cm.conversation_id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get all conversations a user is a member of
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id UUID)
RETURNS TABLE (
  conversation_id UUID,
  name TEXT,
  created_at TIMESTAMPTZ,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, c.created_at, cm.role
  FROM conversations c
  JOIN conversation_members cm ON c.id = cm.conversation_id
  WHERE cm.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the typing status function to check for conversation membership
CREATE OR REPLACE FUNCTION update_typing_status(
  p_conversation_id UUID,
  p_user_id UUID,
  p_is_typing BOOLEAN
) RETURNS VOID AS $$
BEGIN
  -- Check if the user is a member of the conversation
  IF NOT EXISTS (
    SELECT 1 FROM conversation_members
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id
  ) THEN
    -- If not a member, just return without error (silent fail)
    RETURN;
  END IF;

  -- Update or insert typing status
  INSERT INTO typing_status (conversation_id, user_id, is_typing)
  VALUES (p_conversation_id, p_user_id, p_is_typing)
  ON CONFLICT (conversation_id, user_id)
  DO UPDATE SET is_typing = p_is_typing, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create a group chat
CREATE OR REPLACE FUNCTION create_group_chat(
  group_name TEXT,
  group_description TEXT,
  avatar_url TEXT,
  member_ids UUID[]
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_current_user_id UUID;
BEGIN
  -- Get current user ID
  v_current_user_id := auth.uid();
  
  -- Create the conversation
  INSERT INTO conversations (type, name, description, avatar_url, is_group, created_by)
  VALUES ('group', group_name, group_description, avatar_url, true, v_current_user_id)
  RETURNING id INTO v_conversation_id;
  
  -- Add the creator as admin
  INSERT INTO conversation_members (conversation_id, user_id, role)
  VALUES (v_conversation_id, v_current_user_id, 'admin');
  
  -- Add other members
  IF member_ids IS NOT NULL AND array_length(member_ids, 1) > 0 THEN
    INSERT INTO conversation_members (conversation_id, user_id)
    SELECT v_conversation_id, m
    FROM unnest(member_ids) AS m
    WHERE m != v_current_user_id; -- Skip the creator who is already added as admin
  END IF;
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies for conversation_members table
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Conversation members are viewable by conversation members" ON conversation_members;
CREATE POLICY "Conversation members are viewable by conversation members"
  ON conversation_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = conversation_members.conversation_id AND user_id = auth.uid()
    )
  );

-- Fixed: Insert policy without referencing NEW in USING clause
DROP POLICY IF EXISTS "Group admins can insert members" ON conversation_members;
CREATE POLICY "Group admins can insert members"
  ON conversation_members FOR INSERT
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM conversation_members
        WHERE user_id = auth.uid() AND conversation_id = conversation_members.conversation_id AND role = 'admin'
      )
    ) OR auth.uid() = conversation_members.user_id -- Allow users to add themselves
  );

-- Fixed: Update policy without using NEW
DROP POLICY IF EXISTS "Group admins can update members" ON conversation_members;
CREATE POLICY "Group admins can update members"
  ON conversation_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE user_id = auth.uid() AND conversation_id = conversation_members.conversation_id AND role = 'admin'
    )
  );

-- Fixed: Delete policy without referencing NEW
DROP POLICY IF EXISTS "Group admins can delete members or users can remove themselves" ON conversation_members;
CREATE POLICY "Group admins can delete members or users can remove themselves"
  ON conversation_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE user_id = auth.uid() AND conversation_id = conversation_members.conversation_id AND role = 'admin'
    ) OR auth.uid() = conversation_members.user_id -- Allow users to remove themselves
  );

-- Create RLS policies for blocked_users table
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own blocks" ON blocked_users;
CREATE POLICY "Users can view their own blocks"
  ON blocked_users FOR SELECT
  USING (blocker_id = auth.uid());

-- Fixed: Insert policy with proper check
DROP POLICY IF EXISTS "Users can create their own blocks" ON blocked_users;
CREATE POLICY "Users can create their own blocks"
  ON blocked_users FOR INSERT
  WITH CHECK (blocker_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own blocks" ON blocked_users;
CREATE POLICY "Users can delete their own blocks"
  ON blocked_users FOR DELETE
  USING (blocker_id = auth.uid());

-- Update messages RLS to handle group messages and blocking
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Messages are viewable by conversation participants and group members" ON messages;
CREATE POLICY "Messages are viewable by conversation participants and group members"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    ) AND NOT EXISTS (
      SELECT 1 FROM blocked_users
      WHERE (blocker_id = auth.uid() AND blocked_id = messages.sender_id)
         OR (blocker_id = messages.sender_id AND blocked_id = auth.uid())
    )
  );

-- Fixed: Insert policy without using NEW in USING 
DROP POLICY IF EXISTS "Users can insert their own messages to conversations they're in" ON messages;
CREATE POLICY "Users can insert their own messages to conversations they're in"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

-- Update conversations RLS to handle group chats and blocking
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Conversations are viewable by participants" ON conversations;
CREATE POLICY "Conversations are viewable by participants"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = id AND user_id = auth.uid()
    )
  );

-- Enable RLS on typing_status
ALTER TABLE typing_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Typing status is viewable by conversation members" ON typing_status;
CREATE POLICY "Typing status is viewable by conversation members"
  ON typing_status FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = typing_status.conversation_id AND user_id = auth.uid()
    )
  );

-- Fixed: Insert policy without using NEW in USING
DROP POLICY IF EXISTS "Users can insert their own typing status" ON typing_status;
CREATE POLICY "Users can insert their own typing status"
  ON typing_status FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = typing_status.conversation_id AND user_id = auth.uid()
    )
  );

-- Fixed: Update policy without conflicting names
DROP POLICY IF EXISTS "Users can update their own typing status" ON typing_status;
CREATE POLICY "Users can update their own typing status"
  ON typing_status FOR UPDATE
  USING (
    user_id = auth.uid()
  );

-- Enable RLS on read_receipts
ALTER TABLE read_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read receipts are viewable by conversation members" ON read_receipts;
CREATE POLICY "Read receipts are viewable by conversation members"
  ON read_receipts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_members cm ON m.conversation_id = cm.conversation_id
      WHERE m.id = read_receipts.message_id AND cm.user_id = auth.uid()
    )
  );

-- Fixed: Insert policy without using NEW in USING
DROP POLICY IF EXISTS "Users can create their own read receipts" ON read_receipts;
CREATE POLICY "Users can create their own read receipts"
  ON read_receipts FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

-- Migrate existing data if needed
DO $$
DECLARE
  v_conversation record;
  v_user1 UUID;
  v_user2 UUID;
BEGIN
  -- For each conversation
  FOR v_conversation IN SELECT * FROM conversations WHERE type IS NULL OR type = '' LOOP
    -- Set type to 'direct' if not set
    UPDATE conversations SET type = 'direct' WHERE id = v_conversation.id AND (type IS NULL OR type = '');
    
    -- Check if conversation_members entries exist
    IF NOT EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = v_conversation.id) THEN
      -- Try to find participants from messages
      SELECT DISTINCT sender_id INTO v_user1 FROM messages 
      WHERE conversation_id = v_conversation.id 
      ORDER BY MIN(created_at) LIMIT 1;
      
      IF v_user1 IS NOT NULL THEN
        -- Find another user who sent messages
        SELECT DISTINCT sender_id INTO v_user2 FROM messages 
        WHERE conversation_id = v_conversation.id AND sender_id != v_user1
        LIMIT 1;
        
        -- Add members
        IF v_user1 IS NOT NULL THEN
          INSERT INTO conversation_members (conversation_id, user_id)
          VALUES (v_conversation.id, v_user1);
        END IF;
        
        IF v_user2 IS NOT NULL THEN
          INSERT INTO conversation_members (conversation_id, user_id)
          VALUES (v_conversation.id, v_user2);
        END IF;
      END IF;
    END IF;
  END LOOP;
END $$;
