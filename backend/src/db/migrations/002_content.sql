-- Drives (past plantation trips) and articles (awareness content) for the public Journal page.
-- Saltwater Marina admins and coordinators create, edit and remove them (SRS 4.13 Awareness Content).

CREATE TABLE drives (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  drive_date  date NOT NULL,
  start_time  text,
  end_time    text,
  site        text NOT NULL,
  departed_from text NOT NULL DEFAULT 'Rehri Goth',
  people      int  CHECK (people IS NULL OR people >= 0),
  saplings    int  CHECK (saplings IS NULL OR saplings >= 0),
  summary     text NOT NULL DEFAULT '',
  -- [{ src, caption, time }] ; the first photo is the cover
  photos      jsonb NOT NULL DEFAULT '[]'::jsonb,
  published   boolean NOT NULL DEFAULT false,
  created_by  uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX drives_date_idx ON drives (drive_date DESC);

CREATE TABLE articles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL,
  kind        text NOT NULL DEFAULT 'article' CHECK (kind IN ('article', 'awareness')),
  title       text NOT NULL,
  summary     text NOT NULL DEFAULT '',
  -- plain text; blank lines separate paragraphs, lines starting with "## " are subheadings
  body        text NOT NULL DEFAULT '',
  cover       text,
  published   boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_by  uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX articles_slug_key ON articles (lower(slug));
CREATE INDEX articles_published_idx ON articles (published, published_at DESC);
