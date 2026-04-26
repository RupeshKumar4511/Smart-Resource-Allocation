-- ─────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- auto updated_at trigger
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  city            TEXT DEFAULT '',
  otp_hash        TEXT,
  otp_expiry      TIMESTAMPTZ,
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  refresh_token   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ✅ FIX: anon can INSERT only (signup) — cannot read ANY user row
CREATE POLICY "anon_insert_signup" ON users
  FOR INSERT TO anon
  WITH CHECK (true);

-- ✅ FIX: anon UPDATE only for OTP/verification columns — scoped by email+otp
-- Your backend (service_role) handles this — anon gets nothing else
CREATE POLICY "service_role_all_users" ON users
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ✅ FIX: authenticated users can only read/update their OWN row
CREATE POLICY "authenticated_select_own" ON users
  FOR SELECT TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "authenticated_update_own" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- ─────────────────────────────────────────────────────────────
-- WORKSPACES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspaces (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ngo_name      TEXT NOT NULL,
  description   TEXT NOT NULL,
  ngo_type      TEXT NOT NULL,
  city          TEXT NOT NULL,
  address       TEXT DEFAULT '',
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  website_url   TEXT DEFAULT '',
  -- ✅ FIX: added CHECK constraint
  founded_year  INTEGER CHECK (founded_year BETWEEN 1800 AND 2100),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- ✅ FIX: all workspace policies check created_by = current user
CREATE POLICY "workspace_select_own" ON workspaces
  FOR SELECT TO authenticated
  USING (created_by::text = auth.uid()::text);

CREATE POLICY "workspace_insert_own" ON workspaces
  FOR INSERT TO authenticated
  WITH CHECK (created_by::text = auth.uid()::text);

CREATE POLICY "workspace_update_own" ON workspaces
  FOR UPDATE TO authenticated
  USING (created_by::text = auth.uid()::text)
  WITH CHECK (created_by::text = auth.uid()::text);

CREATE POLICY "workspace_delete_own" ON workspaces
  FOR DELETE TO authenticated
  USING (created_by::text = auth.uid()::text);

CREATE POLICY "service_role_all_workspaces" ON workspaces
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- PROBLEMS (no volunteer FK yet — circular dep)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS problems (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ✅ FIX: NOT NULL on workspace_id
  workspace_id              UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title                     TEXT NOT NULL,
  description               TEXT NOT NULL,
  category                  TEXT NOT NULL,
  priority                  TEXT NOT NULL DEFAULT 'Medium'
                              CHECK (priority IN ('Low','Medium','High','Critical')),
  status                    TEXT NOT NULL DEFAULT 'Open'
                              CHECK (status IN ('Open','Assigned','In Progress','Resolved')),
  city                      TEXT NOT NULL,
  landmark                  TEXT DEFAULT '',
  address                   TEXT DEFAULT '',
  latitude                  NUMERIC,
  longitude                 NUMERIC,
  resolved_address          TEXT DEFAULT '',
  coordinates_source        TEXT DEFAULT 'manual'
                              CHECK (coordinates_source IN ('auto','manual')),
  estimated_people_affected INTEGER DEFAULT 0 CHECK (estimated_people_affected >= 0),
  contact_person_name       TEXT DEFAULT '',
  contact_person_phone      TEXT DEFAULT '',
  assigned_volunteer_id     UUID,           -- FK added after volunteers table
  distance_km               NUMERIC CHECK (distance_km >= 0),
  notes                     TEXT DEFAULT '',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER problems_updated_at
  BEFORE UPDATE ON problems
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE problems ENABLE ROW LEVEL SECURITY;

-- ✅ FIX: all problem policies verify workspace ownership
CREATE POLICY "problems_select_own_workspace" ON problems
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = problems.workspace_id
        AND w.created_by::text = auth.uid()::text
    )
  );

CREATE POLICY "problems_insert_own_workspace" ON problems
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = problems.workspace_id
        AND w.created_by::text = auth.uid()::text
    )
  );

CREATE POLICY "problems_update_own_workspace" ON problems
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = problems.workspace_id
        AND w.created_by::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = problems.workspace_id
        AND w.created_by::text = auth.uid()::text
    )
  );

CREATE POLICY "problems_delete_own_workspace" ON problems
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = problems.workspace_id
        AND w.created_by::text = auth.uid()::text
    )
  );

CREATE POLICY "service_role_all_problems" ON problems
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- VOLUNTEERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS volunteers (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ✅ FIX: NOT NULL on workspace_id
  workspace_id            UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  full_name               TEXT NOT NULL,
  email                   TEXT NOT NULL,
  phone                   TEXT NOT NULL,
  age                     INTEGER CHECK (age BETWEEN 18 AND 65),
  gender                  TEXT DEFAULT '',
  city                    TEXT NOT NULL,
  landmark                TEXT DEFAULT '',
  address                 TEXT DEFAULT '',
  latitude                NUMERIC,
  longitude               NUMERIC,
  resolved_address        TEXT DEFAULT '',
  coordinates_source      TEXT DEFAULT 'manual'
                            CHECK (coordinates_source IN ('auto','manual')),
  -- ✅ FIX: NOT NULL with default
  skills                  TEXT[] NOT NULL DEFAULT '{}',
  availability            TEXT DEFAULT '',
  experience_years        INTEGER DEFAULT 0 CHECK (experience_years BETWEEN 0 AND 40),
  has_vehicle             BOOLEAN NOT NULL DEFAULT FALSE,
  emergency_contact_name  TEXT DEFAULT '',
  emergency_contact_phone TEXT DEFAULT '',
  status                  TEXT NOT NULL DEFAULT 'Available'
                            CHECK (status IN ('Available','Busy','Inactive')),
  -- FK added after this table is created (circular dep with problems)
  current_assignment_id   UUID,
  notes                   TEXT DEFAULT '',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER volunteers_updated_at
  BEFORE UPDATE ON volunteers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;

-- ✅ FIX: same ownership pattern as problems
CREATE POLICY "volunteers_select_own_workspace" ON volunteers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = volunteers.workspace_id
        AND w.created_by::text = auth.uid()::text
    )
  );

CREATE POLICY "volunteers_insert_own_workspace" ON volunteers
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = volunteers.workspace_id
        AND w.created_by::text = auth.uid()::text
    )
  );

CREATE POLICY "volunteers_update_own_workspace" ON volunteers
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = volunteers.workspace_id
        AND w.created_by::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = volunteers.workspace_id
        AND w.created_by::text = auth.uid()::text
    )
  );

CREATE POLICY "volunteers_delete_own_workspace" ON volunteers
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = volunteers.workspace_id
        AND w.created_by::text = auth.uid()::text
    )
  );

CREATE POLICY "service_role_all_volunteers" ON volunteers
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- ✅ FIX: Add circular FKs now that both tables exist
-- ─────────────────────────────────────────────────────────────
ALTER TABLE problems
  ADD CONSTRAINT fk_problems_assigned_volunteer
  FOREIGN KEY (assigned_volunteer_id)
  REFERENCES volunteers(id)
  ON DELETE SET NULL;

ALTER TABLE volunteers
  ADD CONSTRAINT fk_volunteers_current_assignment
  FOREIGN KEY (current_assignment_id)
  REFERENCES problems(id)
  ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_workspaces_created_by
  ON workspaces(created_by);

CREATE INDEX IF NOT EXISTS idx_problems_workspace_id
  ON problems(workspace_id);

CREATE INDEX IF NOT EXISTS idx_problems_assigned_volunteer
  ON problems(assigned_volunteer_id);

-- ✅ FIX: composite index — matches notify query filter exactly
CREATE INDEX IF NOT EXISTS idx_problems_workspace_status
  ON problems(workspace_id, status);

CREATE INDEX IF NOT EXISTS idx_volunteers_workspace_id
  ON volunteers(workspace_id);

CREATE INDEX IF NOT EXISTS idx_volunteers_status
  ON volunteers(status);

-- ✅ FIX: composite index — used by notify endpoint
CREATE INDEX IF NOT EXISTS idx_volunteers_workspace_status
  ON volunteers(workspace_id, status);

-- ✅ FIX: city indexes for geo fallback queries
CREATE INDEX IF NOT EXISTS idx_problems_city
  ON problems(city);

CREATE INDEX IF NOT EXISTS idx_volunteers_city
  ON volunteers(city);