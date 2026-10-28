-- TiDB/MySQL migration for reservations made from the public catalog.
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS customer_name VARCHAR(150) NULL;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(30) NULL;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS payment_preference VARCHAR(20) NULL;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS reservation_notes TEXT NULL;
