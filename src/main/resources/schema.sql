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

CREATE TABLE IF NOT EXISTS shop_reviews
(
    id               BIGSERIAL PRIMARY KEY,
    user_id          INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    author_username  VARCHAR(50) NOT NULL,
    category_id      INTEGER REFERENCES categories (id) ON DELETE SET NULL,
    product_id       BIGINT REFERENCES products (id) ON DELETE SET NULL,
    rating           SMALLINT    NOT NULL CHECK (rating >= 1 AND rating <= 5),
    body             TEXT        NOT NULL,
    created_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shop_reviews_created ON shop_reviews (created_at DESC);

INSERT INTO promo_banners (image_url, link_url, sort_order, status, region)
SELECT v.image_url, v.link_url, v.sort_order, v.status, v.region
FROM (VALUES
          ('https://picsum.photos/seed/skyrush_a/1400/480', 'https://vk.com', 0, 'ACTIVE', 'ALL'),
          ('https://picsum.photos/seed/skyrush_b/1400/480', 'https://t.me', 1, 'ACTIVE', 'ALL'),
          ('https://picsum.photos/seed/skyrush_c/1400/480', 'https://example.com', 2, 'ACTIVE', 'UZ')
     ) AS v(image_url, link_url, sort_order, status, region)
WHERE NOT EXISTS (SELECT 1 FROM promo_banners LIMIT 1);

CREATE TABLE IF NOT EXISTS tournaments
(
    id              BIGSERIAL PRIMARY KEY,
    organizer_id    INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    status          VARCHAR(32) NOT NULL DEFAULT 'REGISTRATION_OPEN',
    max_teams       INTEGER     NOT NULL,
    best_of         SMALLINT    NOT NULL,
    roster_size     INTEGER     NOT NULL DEFAULT 5 CHECK (roster_size >= 5 AND roster_size <= 20),
    game_code       VARCHAR(32) NOT NULL DEFAULT 'ML',
    draw_at         TIMESTAMPTZ,
    start_at        TIMESTAMPTZ,
    phased_format     BOOLEAN     NOT NULL DEFAULT FALSE,
    has_custom_stages BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tournaments_max_teams_check CHECK (max_teams >= 2 AND max_teams <= 2147483647),
    CONSTRAINT tournaments_best_of_check CHECK (best_of IN (1, 2, 3, 5, 7, 9))
);

CREATE INDEX IF NOT EXISTS idx_tournaments_created ON tournaments (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments (status);

CREATE TABLE IF NOT EXISTS tournament_format_rules
(
    id             BIGSERIAL PRIMARY KEY,
    tournament_id  BIGINT      NOT NULL REFERENCES tournaments (id) ON DELETE CASCADE,
    min_teams      INTEGER     NOT NULL CHECK (min_teams >= 1),
    best_of        SMALLINT    NOT NULL CHECK (best_of IN (1, 2, 3, 5, 7, 9)),
    UNIQUE (tournament_id, min_teams)
);

CREATE INDEX IF NOT EXISTS idx_tournament_format_rules_tournament ON tournament_format_rules (tournament_id);

CREATE TABLE IF NOT EXISTS tournament_stages
(
    id                  BIGSERIAL PRIMARY KEY,
    tournament_id       BIGINT      NOT NULL REFERENCES tournaments (id) ON DELETE CASCADE,
    sort_order          INTEGER     NOT NULL CHECK (sort_order >= 1),
    bracket_track       VARCHAR(24) NOT NULL DEFAULT 'MAIN',
    phase_kind          VARCHAR(40) NOT NULL,
    label               VARCHAR(160) NOT NULL DEFAULT '',
    best_of             SMALLINT    NOT NULL CHECK (best_of IN (1, 2, 3, 5, 7, 9)),
    teams_at_start      INTEGER     NOT NULL CHECK (teams_at_start >= 2),
    group_count         INTEGER     CHECK (group_count IS NULL OR group_count >= 1),
    teams_per_group     INTEGER     CHECK (teams_per_group IS NULL OR teams_per_group >= 2),
    advance_per_group   INTEGER     CHECK (advance_per_group IS NULL OR advance_per_group >= 1),
    UNIQUE (tournament_id, sort_order, bracket_track)
);

CREATE INDEX IF NOT EXISTS idx_tournament_stages_tournament ON tournament_stages (tournament_id);

-- Eski jadval (128 / faqat toq BO): Spring schema.sql ni ; bo‘yicha bo‘laklaydi — DO $$...$$ ishonchsiz.
-- Har ishga tushirishda DROP + ADD: constraint yo‘q bo‘lsa ADD, bor bo‘lsa DROP dan keyin qayta yaratiladi.
ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_max_teams_check;
ALTER TABLE tournaments ADD CONSTRAINT tournaments_max_teams_check CHECK (max_teams >= 2 AND max_teams <= 2147483647);
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS tournament_scale VARCHAR(16) NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_best_of_check;
ALTER TABLE tournaments ADD CONSTRAINT tournaments_best_of_check CHECK (best_of IN (1, 2, 3, 5, 7, 9));
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS phased_format BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS has_custom_stages BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS registration_open_at TIMESTAMPTZ;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS registration_close_at TIMESTAMPTZ;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS draw_at TIMESTAMPTZ;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ;
ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_roster_size_check;
UPDATE tournaments SET roster_size = 5 WHERE roster_size IS NOT NULL AND roster_size < 5;
ALTER TABLE tournaments ADD CONSTRAINT tournaments_roster_size_check CHECK (roster_size >= 5 AND roster_size <= 20);

CREATE TABLE IF NOT EXISTS tournament_teams
(
    id               BIGSERIAL PRIMARY KEY,
    tournament_id    BIGINT      NOT NULL REFERENCES tournaments (id) ON DELETE CASCADE,
    team_name        VARCHAR(120) NOT NULL,
    captain_user_id  INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    logo_url         TEXT,
    is_invited       BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tournament_id, team_name)
);

CREATE INDEX IF NOT EXISTS idx_tournament_teams_tournament ON tournament_teams (tournament_id);

CREATE TABLE IF NOT EXISTS tournament_team_members
(
    id              BIGSERIAL PRIMARY KEY,
    team_id         BIGINT      NOT NULL REFERENCES tournament_teams (id) ON DELETE CASCADE,
    nickname        VARCHAR(100) NOT NULL,
    game_player_id  VARCHAR(64) NOT NULL,
    is_captain      BOOLEAN     NOT NULL DEFAULT FALSE,
    UNIQUE (team_id, game_player_id)
);

CREATE INDEX IF NOT EXISTS idx_tournament_members_team ON tournament_team_members (team_id);

ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS big_tournament BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE tournaments SET tournament_scale = 'BIG' WHERE big_tournament = TRUE;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS big_phase VARCHAR(32);
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS big_qualifier_round INTEGER NOT NULL DEFAULT -1;

ALTER TABLE tournament_teams ADD COLUMN IF NOT EXISTS is_golden BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tournament_teams ADD COLUMN IF NOT EXISTS is_invited BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS tournament_matches
(
    id                       BIGSERIAL PRIMARY KEY,
    tournament_id            BIGINT       NOT NULL REFERENCES tournaments (id) ON DELETE CASCADE,
    bracket_key              VARCHAR(96)  NOT NULL DEFAULT '',
    phase                    VARCHAR(24)  NOT NULL,
    bracket_track            VARCHAR(24),
    group_index              INTEGER      NOT NULL DEFAULT -1,
    round_index              INTEGER      NOT NULL DEFAULT 0,
    match_index              INTEGER      NOT NULL DEFAULT 0,
    team_a_id                BIGINT REFERENCES tournament_teams (id) ON DELETE SET NULL,
    team_b_id                BIGINT REFERENCES tournament_teams (id) ON DELETE SET NULL,
    best_of                  SMALLINT     NOT NULL CHECK (best_of IN (1, 2, 3, 5, 7, 9)),
    winner_team_id           BIGINT REFERENCES tournament_teams (id) ON DELETE SET NULL,
    status                   VARCHAR(24)  NOT NULL DEFAULT 'SCHEDULED',
    feeds_winner_to_match_id BIGINT REFERENCES tournament_matches (id) ON DELETE SET NULL,
    feeds_winner_slot        CHAR(1)      CHECK (feeds_winner_slot IS NULL OR feeds_winner_slot IN ('A', 'B')),
    feeds_loser_to_match_id  BIGINT REFERENCES tournament_matches (id) ON DELETE SET NULL,
    feeds_loser_slot         CHAR(1)      CHECK (feeds_loser_slot IS NULL OR feeds_loser_slot IN ('A', 'B')),
    is_grand_final           BOOLEAN      NOT NULL DEFAULT FALSE,
    grand_final_set          SMALLINT     NOT NULL DEFAULT 1 CHECK (grand_final_set >= 1 AND grand_final_set <= 2),
    closes_qualifier_phase   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at               TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tournament_matches_bracket_key
    ON tournament_matches (tournament_id, bracket_key)
    WHERE bracket_key <> '';

CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament_phase
    ON tournament_matches (tournament_id, phase);

CREATE TABLE IF NOT EXISTS tournament_match_games
(
    id              BIGSERIAL PRIMARY KEY,
    match_id        BIGINT      NOT NULL REFERENCES tournament_matches (id) ON DELETE CASCADE,
    game_number     SMALLINT    NOT NULL CHECK (game_number >= 1),
    winner_team_id  BIGINT      NOT NULL REFERENCES tournament_teams (id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (match_id, game_number)
);

CREATE INDEX IF NOT EXISTS idx_tournament_match_games_match ON tournament_match_games (match_id);

CREATE TABLE IF NOT EXISTS tournament_group_assignments
(
    id             BIGSERIAL PRIMARY KEY,
    tournament_id  BIGINT      NOT NULL REFERENCES tournaments (id) ON DELETE CASCADE,
    team_id        BIGINT      NOT NULL REFERENCES tournament_teams (id) ON DELETE CASCADE,
    group_index    INTEGER     NOT NULL CHECK (group_index >= 0),
    UNIQUE (tournament_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_tournament_group_assignments_tournament
    ON tournament_group_assignments (tournament_id);