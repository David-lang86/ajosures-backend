-- ===========================================================
-- AJOSURES — Database Schema + Row Level Security (RLS) Policies
-- Run these in your Supabase SQL Editor
-- ===========================================================


-- ===========================================================
-- SECTION 1: MISSING TABLE DEFINITIONS
-- ===========================================================

-- Withdrawal requests (submitted by users, approved by admin)
CREATE TABLE IF NOT EXISTS withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  bank_details jsonb,
  status text DEFAULT 'pending', -- pending | approved | rejected
  created_at timestamptz DEFAULT now()
);

-- Payout rotation tracking per group
CREATE TABLE IF NOT EXISTS payout_rotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  position int,
  paid_out boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Payout queue (automated group payouts)
CREATE TABLE IF NOT EXISTS payout_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric,
  paid boolean DEFAULT false,
  status text DEFAULT 'queued', -- queued | paid
  scheduled_for timestamptz,
  created_at timestamptz DEFAULT now()
);


-- ===========================================================
-- SECTION 2: ROW LEVEL SECURITY — wallets
-- ===========================================================

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Users can view their own wallet
CREATE POLICY "Users can view own wallet"
  ON wallets FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own wallet
CREATE POLICY "Users can update own wallet"
  ON wallets FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can create their own wallet (signup)
CREATE POLICY "Users can insert own wallet"
  ON wallets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);


-- ===========================================================
-- SECTION 3: ROW LEVEL SECURITY — transactions
-- ===========================================================

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own transactions
CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);


-- ===========================================================
-- SECTION 4: ROW LEVEL SECURITY — withdrawals
-- ===========================================================

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Users can view their own withdrawal requests
CREATE POLICY "Users can view own withdrawals"
  ON withdrawals FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can submit their own withdrawal requests
CREATE POLICY "Users can insert own withdrawals"
  ON withdrawals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);


-- ===========================================================
-- SECTION 5: ROW LEVEL SECURITY — profiles
-- ===========================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);


-- ===========================================================
-- SECTION 6: ROW LEVEL SECURITY — notifications
-- ===========================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);


-- ===========================================================
-- SECTION 7: ROW LEVEL SECURITY — payout_rotations
-- ===========================================================

ALTER TABLE payout_rotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rotations"
  ON payout_rotations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);


-- ===========================================================
-- SECTION 8: ROW LEVEL SECURITY — payout_queue
-- ===========================================================

ALTER TABLE payout_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payout queue entries"
  ON payout_queue FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
