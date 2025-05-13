-- Create function to check if a user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(blocker_id UUID, blocked_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id = blocker_id AND blocked_id = blocked_id)
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
BEGIN
  -- Create the conversation
  INSERT INTO conversations (type, name, description, avatar_url, is_group, created_by)
  VALUES ('group', group_name, group_description, avatar_url, true, auth.uid())
  RETURNING id INTO v_conversation_id;
  
  -- Add the creator as admin
  INSERT INTO conversation_members (conversation_id, user_id, role)
  VALUES (v_conversation_id, auth.uid(), 'admin');
  
  -- Add other members
  IF member_ids IS NOT NULL AND array_length(member_ids, 1) > 0 THEN
    INSERT INTO conversation_members (conversation_id, user_id)
    SELECT v_conversation_id, m
    FROM unnest(member_ids) AS m
    WHERE m != auth.uid(); -- Skip the creator who is already added as admin
  END IF;
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies for conversation_members table
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversation members are viewable by conversation members"
  ON conversation_members FOR SELECT
  USING (is_conversation_member(auth.uid(), conversation_id));

CREATE POLICY "Group admins can insert members"
  ON conversation_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE user_id = auth.uid() AND conversation_id = NEW.conversation_id AND role = 'admin'
    ) OR auth.uid() = NEW.user_id -- Allow users to add themselves
  );

CREATE POLICY "Group admins can update members"
  ON conversation_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE user_id = auth.uid() AND conversation_id = OLD.conversation_id AND role = 'admin'
    )
  );

CREATE POLICY "Group admins can delete members or users can remove themselves"
  ON conversation_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE user_id = auth.uid() AND conversation_id = OLD.conversation_id AND role = 'admin'
    ) OR auth.uid() = OLD.user_id -- Allow users to remove themselves
  );

-- Create RLS policies for blocked_users table
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own blocks"
  ON blocked_users FOR SELECT
  USING (blocker_id = auth.uid());

CREATE POLICY "Users can create their own blocks"
  ON blocked_users FOR INSERT
  WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "Users can delete their own blocks"
  ON blocked_users FOR DELETE
  USING (blocker_id = auth.uid());

-- Update messages RLS to handle group messages and blocking
DROP POLICY IF EXISTS "Messages are viewable by conversation participants" ON messages;

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

-- Update messages RLS for insert
DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;

CREATE POLICY "Users can insert their own messages to conversations they're in"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = NEW.conversation_id AND user_id = auth.uid()
    )
  );

-- Update conversations RLS to handle group chats and blocking
DROP POLICY IF EXISTS "Conversations are viewable by participants" ON conversations;

CREATE POLICY "Conversations are viewable by participants"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = id AND user_id = auth.uid()
    )
  );
