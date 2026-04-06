CREATE TABLE IF NOT EXISTS users
(
    id         SERIAL PRIMARY KEY,
    username   VARCHAR(50) UNIQUE  NOT NULL,
    password   TEXT                NOT NULL,
    email      VARCHAR(100) UNIQUE NOT NULL,
    role       VARCHAR(20) DEFAULT 'ROLE_USER',
    google_sub VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub VARCHAR(64);

CREATE TABLE IF NOT EXISTS wallets
(
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER UNIQUE NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    gold_coins BIGINT      DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS transactions
(
    id          SERIAL PRIMARY KEY,
    wallet_id   INTEGER     NOT NULL REFERENCES wallets (id) ON DELETE CASCADE,
    amount      BIGINT      NOT NULL,
    trx_type    VARCHAR(20) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by  VARCHAR(100),
    updated_by  VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS categories
(
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    logo_url    TEXT,
    has_zone_id BOOLEAN     DEFAULT FALSE,
    status      VARCHAR(20) DEFAULT 'ACTIVE',
    created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    region varchar default 'UZ'
);

CREATE TABLE IF NOT EXISTS products
(
    id                  BIGSERIAL PRIMARY KEY,
    category_id         INTEGER REFERENCES categories (id) ON DELETE CASCADE,
    name                VARCHAR(255)   NOT NULL,
    price               DECIMAL(15, 2) NOT NULL,
    product_logo        TEXT,
    original_price      DECIMAL(15, 2),
    provider_product_id VARCHAR(100),
    status              VARCHAR(20) DEFAULT 'ACTIVE',
    created_at          TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX IF NOT EXISTS idx_products_category_id ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories (status);

CREATE TABLE IF NOT EXISTS promo_banners
(
    id          BIGSERIAL PRIMARY KEY,
    image_url   TEXT        NOT NULL,
    link_url    TEXT        NOT NULL,
    sort_order  INTEGER     DEFAULT 0,
    status      VARCHAR(20) DEFAULT 'ACTIVE',
    region      VARCHAR(10) DEFAULT 'ALL'
);

CREATE INDEX IF NOT EXISTS idx_promo_banners_status_region ON promo_banners (status, region);

INSERT INTO promo_banners (image_url, link_url, sort_order, status, region)
SELECT v.image_url, v.link_url, v.sort_order, v.status, v.region
FROM (VALUES
          ('https://picsum.photos/seed/skyrush_a/1400/480', 'https://vk.com', 0, 'ACTIVE', 'ALL'),
          ('https://picsum.photos/seed/skyrush_b/1400/480', 'https://t.me', 1, 'ACTIVE', 'ALL'),
          ('https://picsum.photos/seed/skyrush_c/1400/480', 'https://example.com', 2, 'ACTIVE', 'UZ')
     ) AS v(image_url, link_url, sort_order, status, region)
WHERE NOT EXISTS (SELECT 1 FROM promo_banners LIMIT 1);