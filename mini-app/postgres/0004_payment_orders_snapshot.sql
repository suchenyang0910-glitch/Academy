ALTER TABLE payment_orders
ADD COLUMN IF NOT EXISTS pricing_snapshot_id text;

CREATE UNIQUE INDEX IF NOT EXISTS payment_orders_pricing_snapshot_unique
ON payment_orders (pricing_snapshot_id);

