/*
  # Appointments System Migration

  1. New Tables
    - appointment_types: Different types of sessions offered
    - appointments: Scheduled appointments
    - availability: Creator availability slots
    
  2. New Functions
    - get_appointments_overview: Get appointment stats
    - get_upcoming_appointments: Get upcoming appointments
    - get_appointment_history: Get past appointments
    
  3. Security
    - Enable RLS on all tables
    - Add policies for creators and clients
*/

-- Appointment Types Table
CREATE TABLE IF NOT EXISTS appointment_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  duration interval NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  max_participants int DEFAULT 1 CHECK (max_participants > 0),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Availability Table
CREATE TABLE IF NOT EXISTS availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  is_recurring boolean DEFAULT false,
  recurrence_rule text, -- iCal RRULE format
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_id uuid REFERENCES appointment_types(id) ON DELETE RESTRICT NOT NULL,
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
  notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_appointment_time CHECK (end_time > start_time)
);

-- Enable RLS
ALTER TABLE appointment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Appointment Types Policies
CREATE POLICY "Creators can manage their appointment types"
  ON appointment_types
  FOR ALL
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Anyone can view active appointment types"
  ON appointment_types
  FOR SELECT
  USING (is_active = true);

-- Availability Policies
CREATE POLICY "Creators can manage their availability"
  ON availability
  FOR ALL
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Anyone can view availability"
  ON availability
  FOR SELECT
  USING (true);

-- Appointments Policies
CREATE POLICY "Creators can view and manage their appointments"
  ON appointments
  FOR ALL
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Clients can view their appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Clients can book appointments"
  ON appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

-- Function to get appointments overview
CREATE OR REPLACE FUNCTION get_appointments_overview(creator_id uuid)
RETURNS TABLE (
  total_appointments bigint,
  upcoming_appointments bigint,
  completed_appointments bigint,
  cancelled_appointments bigint,
  total_earnings numeric,
  upcoming_earnings numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_appointments,
    COUNT(*) FILTER (WHERE status = 'scheduled' AND start_time > now()) as upcoming_appointments,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_appointments,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_appointments,
    COALESCE(SUM(at.price) FILTER (WHERE a.status = 'completed'), 0) as total_earnings,
    COALESCE(SUM(at.price) FILTER (WHERE a.status = 'scheduled' AND a.start_time > now()), 0) as upcoming_earnings
  FROM appointments a
  JOIN appointment_types at ON at.id = a.type_id
  WHERE a.creator_id = get_appointments_overview.creator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get upcoming appointments
CREATE OR REPLACE FUNCTION get_upcoming_appointments(
  creator_id uuid,
  page_size int DEFAULT 10,
  page_number int DEFAULT 1
)
RETURNS TABLE (
  id uuid,
  type_id uuid,
  client_id uuid,
  start_time timestamptz,
  end_time timestamptz,
  status text,
  notes text,
  session_type jsonb,
  client jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.type_id,
    a.client_id,
    a.start_time,
    a.end_time,
    a.status,
    a.notes,
    jsonb_build_object(
      'title', at.title,
      'description', at.description,
      'duration', at.duration,
      'price', at.price,
      'max_participants', at.max_participants
    ) as session_type,
    jsonb_build_object(
      'username', p.username,
      'name', p.name,
      'avatar_url', p.avatar_url
    ) as client
  FROM appointments a
  JOIN appointment_types at ON at.id = a.type_id
  JOIN profiles p ON p.id = a.client_id
  WHERE a.creator_id = get_upcoming_appointments.creator_id
  AND a.status = 'scheduled'
  AND a.start_time > now()
  ORDER BY a.start_time ASC
  LIMIT page_size
  OFFSET (page_number - 1) * page_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get appointment history
CREATE OR REPLACE FUNCTION get_appointment_history(
  creator_id uuid,
  page_size int DEFAULT 10,
  page_number int DEFAULT 1
)
RETURNS TABLE (
  id uuid,
  type_id uuid,
  client_id uuid,
  start_time timestamptz,
  end_time timestamptz,
  status text,
  notes text,
  session_type jsonb,
  client jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.type_id,
    a.client_id,
    a.start_time,
    a.end_time,
    a.status,
    a.notes,
    jsonb_build_object(
      'title', at.title,
      'description', at.description,
      'duration', at.duration,
      'price', at.price,
      'max_participants', at.max_participants
    ) as session_type,
    jsonb_build_object(
      'username', p.username,
      'name', p.name,
      'avatar_url', p.avatar_url
    ) as client
  FROM appointments a
  JOIN appointment_types at ON at.id = a.type_id
  JOIN profiles p ON p.id = a.client_id
  WHERE a.creator_id = get_appointment_history.creator_id
  AND (a.status = 'completed' OR (a.status = 'scheduled' AND a.start_time <= now()))
  ORDER BY a.start_time DESC
  LIMIT page_size
  OFFSET (page_number - 1) * page_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;