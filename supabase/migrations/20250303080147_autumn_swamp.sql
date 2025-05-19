-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  type text NOT NULL CHECK (type IN ('text', 'image')),
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own messages"
  ON messages
  FOR SELECT
  USING (auth.uid() IN (sender_id, recipient_id));

CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark their received messages as read"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Create indexes
CREATE INDEX messages_sender_recipient_idx ON messages(sender_id, recipient_id);
CREATE INDEX messages_created_at_idx ON messages(created_at DESC);

-- Create storage bucket for message images
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-images', 'message-images', true)
ON CONFLICT DO NOTHING;

-- Create storage policies with unique names
CREATE POLICY "Message images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'message-images');

CREATE POLICY "Authenticated users can upload message images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'message-images');

-- Function to get conversations
CREATE OR REPLACE FUNCTION get_conversations(user_id uuid)
RETURNS TABLE (
  id uuid,
  recipient jsonb,
  last_message jsonb,
  unread_count bigint
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH conversations AS (
    SELECT DISTINCT
      CASE 
        WHEN sender_id = user_id THEN recipient_id
        ELSE sender_id
      END as other_user_id
    FROM messages
    WHERE sender_id = user_id OR recipient_id = user_id
  ),
  last_messages AS (
    SELECT DISTINCT ON (
      CASE 
        WHEN sender_id = user_id THEN recipient_id
        ELSE sender_id
      END
    )
      id,
      CASE 
        WHEN sender_id = user_id THEN recipient_id
        ELSE sender_id
      END as other_user_id,
      content,
      type,
      created_at
    FROM messages
    WHERE sender_id = user_id OR recipient_id = user_id
    ORDER BY other_user_id, created_at DESC
  )
  SELECT
    c.other_user_id as id,
    jsonb_build_object(
      'id', p.id,
      'name', COALESCE(p.name, p.username),
      'username', p.username,
      'avatar_url', p.avatar_url
    ) as recipient,
    jsonb_build_object(
      'content', lm.content,
      'type', lm.type,
      'created_at', lm.created_at
    ) as last_message,
    COUNT(m.id) FILTER (
      WHERE m.recipient_id = user_id 
      AND NOT m.read
    ) as unread_count
  FROM conversations c
  JOIN profiles p ON p.id = c.other_user_id
  JOIN last_messages lm ON lm.other_user_id = c.other_user_id
  LEFT JOIN messages m ON (
    m.sender_id = c.other_user_id AND
    m.recipient_id = user_id AND
    NOT m.read
  )
  GROUP BY
    c.other_user_id,
    p.id,
    p.name,
    p.username,
    p.avatar_url,
    lm.content,
    lm.type,
    lm.created_at
  ORDER BY lm.created_at DESC;
END;
$$;