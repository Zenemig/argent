-- Add admin flag to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Analytics events table (fire-once per user per event)
CREATE TABLE IF NOT EXISTS analytics_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Fire-once deduplication: one event per user per event_name
CREATE UNIQUE INDEX IF NOT EXISTS analytics_events_user_event_uniq
  ON analytics_events (user_id, event_name);

-- Query indexes for admin dashboard
CREATE INDEX IF NOT EXISTS analytics_events_event_created
  ON analytics_events (event_name, created_at);

CREATE INDEX IF NOT EXISTS analytics_events_user_created
  ON analytics_events (user_id, created_at);

-- Cross-user query indexes on rolls and frames
CREATE INDEX IF NOT EXISTS rolls_user_status_idx
  ON rolls (user_id, status);

CREATE INDEX IF NOT EXISTS rolls_created_at_idx
  ON rolls (created_at);

CREATE INDEX IF NOT EXISTS frames_created_at_idx
  ON frames (created_at);

-- RLS: users can insert their own events, no SELECT (admin reads via service role)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own analytics events"
  ON analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
