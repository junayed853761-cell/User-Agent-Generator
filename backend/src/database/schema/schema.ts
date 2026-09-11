export const DDL_STATEMENTS = [
  // 1. Users table
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    jwt_secret VARCHAR(128),
    api_key VARCHAR(128) UNIQUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,

  // 2. Sources table
  `CREATE TABLE IF NOT EXISTS sources (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    provider_type VARCHAR(50) NOT NULL,
    base_url TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    status VARCHAR(30) DEFAULT 'ONLINE',
    last_successful_sync TIMESTAMP WITH TIME ZONE,
    last_attempted_sync TIMESTAMP WITH TIME ZONE,
    record_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,

  // 3. User Agents table
  `CREATE TABLE IF NOT EXISTS user_agents (
    id SERIAL PRIMARY KEY,
    user_agent TEXT NOT NULL,
    normalized_hash VARCHAR(64) UNIQUE NOT NULL,
    browser VARCHAR(100),
    browser_version VARCHAR(50),
    browser_major_version VARCHAR(20),
    operating_system VARCHAR(100),
    operating_system_version VARCHAR(50),
    device_type VARCHAR(50),
    device_brand VARCHAR(100),
    device_model VARCHAR(100),
    country_code VARCHAR(10) DEFAULT 'US',
    country_name VARCHAR(100) DEFAULT 'United States',
    is_mobile BOOLEAN DEFAULT false,
    is_tablet BOOLEAN DEFAULT false,
    is_desktop BOOLEAN DEFAULT false,
    confidence_score INTEGER DEFAULT 0,
    validation_status VARCHAR(50) DEFAULT 'Pending',
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,

  // User Agents Indexes
  `CREATE INDEX IF NOT EXISTS idx_user_agents_hash ON user_agents(normalized_hash);`,
  `CREATE INDEX IF NOT EXISTS idx_user_agents_os ON user_agents(operating_system);`,
  `CREATE INDEX IF NOT EXISTS idx_user_agents_browser ON user_agents(browser);`,
  `CREATE INDEX IF NOT EXISTS idx_user_agents_device_type ON user_agents(device_type);`,
  `CREATE INDEX IF NOT EXISTS idx_user_agents_confidence ON user_agents(confidence_score);`,
  `CREATE INDEX IF NOT EXISTS idx_user_agents_mobile ON user_agents(is_mobile);`,
  `CREATE INDEX IF NOT EXISTS idx_user_agents_desktop ON user_agents(is_desktop);`,

  // 4. User Agent Sources table
  `CREATE TABLE IF NOT EXISTS user_agent_sources (
    id SERIAL PRIMARY KEY,
    user_agent_id INTEGER REFERENCES user_agents(id) ON DELETE CASCADE,
    source_id VARCHAR(50) REFERENCES sources(id) ON DELETE CASCADE,
    source_record_id VARCHAR(100),
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    matched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_ua_source UNIQUE (user_agent_id, source_id)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_ua_sources_ua_id ON user_agent_sources(user_agent_id);`,
  `CREATE INDEX IF NOT EXISTS idx_ua_sources_source_id ON user_agent_sources(source_id);`,

  // 5. Validation Results table
  `CREATE TABLE IF NOT EXISTS validation_results (
    id SERIAL PRIMARY KEY,
    user_agent_id INTEGER REFERENCES user_agents(id) ON DELETE CASCADE,
    is_valid BOOLEAN NOT NULL,
    compatibility_status VARCHAR(50) NOT NULL,
    checks_passed TEXT[],
    checks_failed TEXT[],
    details JSONB,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,

  // 6. Sync Runs table
  `CREATE TABLE IF NOT EXISTS sync_runs (
    id SERIAL PRIMARY KEY,
    source_id VARCHAR(50) REFERENCES sources(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL,
    records_fetched INTEGER DEFAULT 0,
    records_inserted INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    error_message TEXT,
    duration_ms INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
  );`,

  // 7. Generation History table
  `CREATE TABLE IF NOT EXISTS generation_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    platform VARCHAR(50),
    device_type VARCHAR(50),
    browser VARCHAR(50),
    min_confidence INTEGER,
    quantity INTEGER,
    result_count INTEGER,
    exported_format VARCHAR(20),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,

  // 8. System Logs table
  `CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    request_id VARCHAR(64),
    endpoint VARCHAR(255),
    method VARCHAR(10),
    status INTEGER,
    duration_ms INTEGER,
    message TEXT,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,

  // 9. JWT Sessions & API Tokens table (Database JWT itself)
  `CREATE TABLE IF NOT EXISTS jwt_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token_id VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(100) DEFAULT 'API Session',
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE INDEX IF NOT EXISTS idx_jwt_tokens_token_id ON jwt_tokens(token_id);`,
  `CREATE INDEX IF NOT EXISTS idx_jwt_tokens_user_id ON jwt_tokens(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_jwt_tokens_revoked ON jwt_tokens(revoked);`,

  // 10. Served User Agents table (Enforces Zero Duplication per user/client)
  `CREATE TABLE IF NOT EXISTS served_user_agents (
    id SERIAL PRIMARY KEY,
    client_id VARCHAR(128) NOT NULL,
    user_agent_id INTEGER REFERENCES user_agents(id) ON DELETE CASCADE,
    served_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_client_ua UNIQUE (client_id, user_agent_id)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_served_client_id ON served_user_agents(client_id);`,
  `CREATE INDEX IF NOT EXISTS idx_served_ua_id ON served_user_agents(user_agent_id);`,
];

