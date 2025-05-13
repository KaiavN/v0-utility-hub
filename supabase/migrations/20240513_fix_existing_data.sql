-- Migrate existing conversation participants to the new schema
DO $$
DECLARE
  v_conversation_id UUID;
  v_user_id UUID;
BEGIN
  -- Check if conversation_participants table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'conversation_participants'
  ) THEN
    -- For each conversation participant, add to conversation_members
    FOR v_conversation_id, v_user_id IN
      SELECT conversation_id, user_id FROM conversation_participants
    LOOP
      -- Insert into conversation_members if not exists
      INSERT INTO conversation_members (conversation_id, user_id, role)
      VALUES (v_conversation_id, v_user_id, 'member')
      ON CONFLICT (conversation_id, user_id) DO NOTHING;
    END LOOP;
  END IF;
END $$;

-- Update existing conversations to set is_group = false
UPDATE conversations SET is_group = false WHERE is_group IS NULL;

-- Update existing conversations to set type = 'direct' if not set
UPDATE conversations SET type = 'direct' WHERE type IS NULL;
