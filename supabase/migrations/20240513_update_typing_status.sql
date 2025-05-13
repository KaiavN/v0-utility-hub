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
    RAISE EXCEPTION 'User is not a member of this conversation';
  END IF;

  -- Update or insert typing status
  INSERT INTO typing_status (conversation_id, user_id, is_typing)
  VALUES (p_conversation_id, p_user_id, p_is_typing)
  ON CONFLICT (conversation_id, user_id)
  DO UPDATE SET is_typing = p_is_typing, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
