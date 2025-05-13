-- Create typing_status table
CREATE TABLE IF NOT EXISTS public.typing_status (
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_typing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Create function to update typing status
CREATE OR REPLACE FUNCTION update_typing_status(
  p_conversation_id UUID,
  p_user_id UUID,
  p_is_typing BOOLEAN
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.typing_status (conversation_id, user_id, is_typing, updated_at)
  VALUES (p_conversation_id, p_user_id, p_is_typing, now())
  ON CONFLICT (conversation_id, user_id)
  DO UPDATE SET
    is_typing = p_is_typing,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION update_typing_status TO authenticated;
GRANT EXECUTE ON FUNCTION update_typing_status TO service_role;

-- Add RLS policies for typing_status
ALTER TABLE public.typing_status ENABLE ROW LEVEL SECURITY;

-- Allow users to see typing status for conversations they're in
CREATE POLICY "Users can view typing status for their conversations" ON public.typing_status
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_participants.conversation_id = typing_status.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Allow users to update their own typing status
CREATE POLICY "Users can update their own typing status" ON public.typing_status
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow users to insert their own typing status
CREATE POLICY "Users can insert their own typing status" ON public.typing_status
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_participants.conversation_id = typing_status.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );
