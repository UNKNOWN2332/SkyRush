CREATE TABLE IF NOT EXISTS users
(
    id         SERIAL PRIMARY KEY,
    username   VARCHAR(50) UNIQUE  NOT NULL,
    password   TEXT                NOT NULL,
    email      VARCHAR(100) UNIQUE NOT NULL,
    role       VARCHAR(20) DEFAULT 'ROLE_USER',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

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

CREATE TABLE IF NOT EXISTS categories (
                                          id SERIAL PRIMARY KEY,
                                          name VARCHAR(100) NOT NULL,
                                          logo_url TEXT,
                                          has_zone_id BOOLEAN DEFAULT FALSE,
                                          status VARCHAR(20) DEFAULT 'ACTIVE',
                                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
                                        id SERIAL PRIMARY KEY,
                                        category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
                                        name VARCHAR(255) NOT NULL,
                                        price DECIMAL(15, 2) NOT NULL,
                                        provider_price DECIMAL(15, 2),
                                        provider_product_id VARCHAR(100),
                                        status VARCHAR(20) DEFAULT 'ACTIVE',
                                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);