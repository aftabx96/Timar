-- Timar database: six tables.
-- Runs every time the server starts. IF NOT EXISTS means existing tables and data are left alone.

-- Everyone who signs up. Profile answers from the setup screen live here too.
CREATE TABLE IF NOT EXISTS users (
  id              serial PRIMARY KEY,
  full_name       text NOT NULL,
  email           text NOT NULL UNIQUE,  -- always saved in lowercase
  phone           text NOT NULL,
  password_hash   text NOT NULL,
  role            text NOT NULL DEFAULT 'visitor', -- visitor, volunteer, company, coordinator or admin
  email_verified  boolean NOT NULL DEFAULT false,
  profile_complete boolean NOT NULL DEFAULT false,
  bio             text NOT NULL DEFAULT '',
  photo           text,
  city            text,      -- visitors
  interests       text[] NOT NULL DEFAULT '{}',
  company_name    text,      -- company accounts
  designation     text,
  industry        text,
  company_size    text,
  notify_surveys  boolean NOT NULL DEFAULT true,
  notify_trips    boolean NOT NULL DEFAULT true,
  notify_news     boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- The 6 digit codes sent by email for sign up, sign in and password reset.
-- Only a hash of the code is stored.
CREATE TABLE IF NOT EXISTS otp_codes (
  id          serial PRIMARY KEY,
  user_id     int NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  purpose     text NOT NULL,  -- verify, login or reset
  code_hash   text NOT NULL,
  attempts    int  NOT NULL DEFAULT 0,
  expires_at  timestamptz NOT NULL,
  used        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- People who asked to volunteer. Saltwater Marina approves or declines them.
CREATE TABLE IF NOT EXISTS volunteer_applications (
  id              serial PRIMARY KEY,
  user_id         int NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status          text NOT NULL DEFAULT 'pending', -- pending, approved or declined
  area            text,
  days            text[] NOT NULL DEFAULT '{}',
  boat            text,
  emergency_phone text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Past plantation drives shown in the Journal.
CREATE TABLE IF NOT EXISTS drives (
  id            serial PRIMARY KEY,
  title         text NOT NULL,
  drive_date    date NOT NULL,
  start_time    text,
  end_time      text,
  site          text NOT NULL,
  departed_from text NOT NULL DEFAULT 'Rehri Goth',
  people        int,
  saplings      int,
  summary       text NOT NULL DEFAULT '',
  photos        jsonb NOT NULL DEFAULT '[]', -- list of { src, caption, time }; the first one is the cover
  published     boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Articles and awareness posts shown in the Journal.
CREATE TABLE IF NOT EXISTS articles (
  id           serial PRIMARY KEY,
  slug         text NOT NULL UNIQUE, -- the part of the address after /journal/
  kind         text NOT NULL DEFAULT 'article', -- article or awareness
  title        text NOT NULL,
  summary      text NOT NULL DEFAULT '',
  body         text NOT NULL DEFAULT '',
  cover        text,
  published    boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Mangroves a user has paid for. A visitor with at least one paid row is an adopter.
CREATE TABLE IF NOT EXISTS adoptions (
  id          serial PRIMARY KEY,
  user_id     int NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  quantity    int NOT NULL,
  amount_pkr  int NOT NULL,
  plot_code   text, -- filled in once the saplings are planted in a plot
  status      text NOT NULL DEFAULT 'pending', -- pending, paid or refunded
  created_at  timestamptz NOT NULL DEFAULT now()
);
