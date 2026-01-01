-- Autoship Subscriptions Schema
-- Recurring order system with pet-based product suggestions

-- Subscription frequencies
CREATE TYPE subscription_frequency AS ENUM (
  'weekly',
  'biweekly',
  'monthly',
  'bimonthly',
  'quarterly'
);

-- Subscription status
CREATE TYPE subscription_status AS ENUM (
  'active',
  'paused',
  'cancelled'
);

-- User subscriptions (autoship programs)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Autoship',
  frequency subscription_frequency NOT NULL DEFAULT 'monthly',
  status subscription_status NOT NULL DEFAULT 'active',
  next_order_date DATE NOT NULL,
  last_order_date DATE,
  shipping_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscription items (products in an autoship)
CREATE TABLE subscription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(subscription_id, product_id)
);

-- Subscription order history (linking subscriptions to generated orders)
CREATE TABLE subscription_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(subscription_id, order_id)
);

-- Pet-based product suggestions for subscriptions
CREATE TABLE subscription_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES user_pets(id) ON DELETE SET NULL,
  reason TEXT,
  is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(subscription_id, product_id)
);

-- Indexes for performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_next_order ON subscriptions(next_order_date) WHERE status = 'active';
CREATE INDEX idx_subscription_items_subscription ON subscription_items(subscription_id);
CREATE INDEX idx_subscription_items_product ON subscription_items(product_id);
CREATE INDEX idx_subscription_suggestions_subscription ON subscription_suggestions(subscription_id);

-- RLS Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_suggestions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Subscription items policies
CREATE POLICY "Users can view own subscription items"
  ON subscription_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.id = subscription_items.subscription_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own subscription items"
  ON subscription_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.id = subscription_items.subscription_id
      AND s.user_id = auth.uid()
    )
  );

-- Subscription orders policies
CREATE POLICY "Users can view own subscription orders"
  ON subscription_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.id = subscription_orders.subscription_id
      AND s.user_id = auth.uid()
    )
  );

-- Subscription suggestions policies
CREATE POLICY "Users can view own suggestions"
  ON subscription_suggestions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.id = subscription_suggestions.subscription_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can dismiss suggestions"
  ON subscription_suggestions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.id = subscription_suggestions.subscription_id
      AND s.user_id = auth.uid()
    )
  );

-- Function to calculate next order date based on frequency
CREATE OR REPLACE FUNCTION calculate_next_order_date(
  current_date DATE,
  freq subscription_frequency
)
RETURNS DATE AS $$
BEGIN
  RETURN CASE freq
    WHEN 'weekly' THEN current_date + INTERVAL '1 week'
    WHEN 'biweekly' THEN current_date + INTERVAL '2 weeks'
    WHEN 'monthly' THEN current_date + INTERVAL '1 month'
    WHEN 'bimonthly' THEN current_date + INTERVAL '2 months'
    WHEN 'quarterly' THEN current_date + INTERVAL '3 months'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate pet-based suggestions for a subscription
CREATE OR REPLACE FUNCTION generate_subscription_suggestions(
  p_subscription_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_user_id UUID;
  v_count INTEGER := 0;
BEGIN
  SELECT user_id INTO v_user_id
  FROM subscriptions WHERE id = p_subscription_id;

  IF v_user_id IS NULL THEN
    RETURN 0;
  END IF;

  INSERT INTO subscription_suggestions (subscription_id, product_id, pet_id, reason)
  SELECT DISTINCT ON (ppt.product_id)
    p_subscription_id,
    ppt.product_id,
    up.id,
    'Recommended for your ' || pt.name
  FROM user_pets up
  JOIN pet_types pt ON pt.id = up.pet_type_id
  JOIN product_pet_types ppt ON ppt.pet_type_id = up.pet_type_id
  JOIN products p ON p.id = ppt.product_id
  WHERE up.user_id = v_user_id
  AND p.stock_status = 'in_stock'
  AND NOT EXISTS (
    SELECT 1 FROM subscription_items si
    WHERE si.subscription_id = p_subscription_id
    AND si.product_id = ppt.product_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM subscription_suggestions ss
    WHERE ss.subscription_id = p_subscription_id
    AND ss.product_id = ppt.product_id
  )
  ORDER BY ppt.product_id, ppt.confidence DESC
  LIMIT 10
  ON CONFLICT (subscription_id, product_id) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at on subscriptions
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();
