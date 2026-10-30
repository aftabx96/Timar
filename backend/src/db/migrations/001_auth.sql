-- Accounts, verification codes, sessions and the audit log (SRS 4.1 Sign Up, 4.2 Sign In).

CREATE TABLE users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       text NOT NULL,
  email           text NOT NULL,
  phone           text NOT NULL,
  password_hash   text NOT NULL,
  -- SU: every new account starts as a visitor. Volunteer is granted on approval.
  role            text NOT NULL DEFAULT 'visitor'
                  CHECK (role IN ('visitor', 'volunteer', 'company', 'coordinator', 'admin')),
  email_verified_at timestamptz,
  profile_complete boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_key ON users (lower(email));

CREATE TABLE profiles (
  user_id     uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  bio         text NOT NULL DEFAULT '',
  photo       text,
  -- role specific answers from profile setup (area, days, company name and so on)
  details     jsonb NOT NULL DEFAULT '{}'::jsonb,
  notify      jsonb NOT NULL DEFAULT '{"surveys": true, "trips": true, "news": false}'::jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE volunteer_applications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  area        text,
  days        text[] NOT NULL DEFAULT '{}',
  boat        text,
  emergency_phone text,
  reviewed_by uuid REFERENCES users (id),
  reviewed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX volunteer_applications_user_idx ON volunteer_applications (user_id);

CREATE TABLE otp_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  purpose     text NOT NULL CHECK (purpose IN ('verify', 'login', 'reset')),
  code_hash   text NOT NULL,
  attempts    int  NOT NULL DEFAULT 0,
  expires_at  timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX otp_codes_lookup_idx ON otp_codes (user_id, purpose, created_at DESC);

CREATE TABLE sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  user_agent  text,
  ip          text,
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_idx ON sessions (user_id);

CREATE TABLE audit_log (
  id          bigserial PRIMARY KEY,
  user_id     uuid REFERENCES users (id) ON DELETE SET NULL,
  action      text NOT NULL,
  meta        jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip          text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_created_idx ON audit_log (created_at DESC);
