-- Seedling sponsorship (SRS 4.9): a public user becomes an adopter once they have paid for mangroves.
-- There is no separate role; "adopter" simply means a user with at least one paid adoption.

CREATE TABLE adoptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  quantity    int  NOT NULL CHECK (quantity > 0),
  amount_pkr  int  NOT NULL CHECK (amount_pkr >= 0),
  plot_code   text, -- assigned by a coordinator once the saplings go into a plot
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded')),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX adoptions_user_idx ON adoptions (user_id);
