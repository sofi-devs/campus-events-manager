-- =====================================================================
-- Campus Events — database schema
-- Run with:  psql -U postgres -d campus_events -f db/schema.sql
-- =====================================================================

DROP TABLE IF EXISTS rsvps;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;

-- ----------  Users ----------
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(160)  UNIQUE NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  role          VARCHAR(20)   NOT NULL DEFAULT 'student', -- 'student' or 'admin'
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ----------  Events ----------
CREATE TABLE events (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200)  NOT NULL,
  description TEXT,
  location    VARCHAR(200),
  event_date  TIMESTAMPTZ   NOT NULL,
  capacity    INTEGER,                       -- NULL = unlimited
  created_by  INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ----------  RSVPs (join table: a user attends an event) ----------
CREATE TABLE rsvps (
  id         SERIAL PRIMARY KEY,
  event_id   INTEGER     NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, user_id)                 -- one RSVP per user per event
);

CREATE INDEX idx_events_date  ON events(event_date);
CREATE INDEX idx_rsvps_event  ON rsvps(event_id);
