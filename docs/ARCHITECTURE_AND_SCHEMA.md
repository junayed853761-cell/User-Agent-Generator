# UAForge System Architecture & Database Schema Documentation

## 1. System Overview

UAForge is a production-grade User-Agent research, validation, analysis, and generation platform powered by verified real-world public datasets and APIs.

### Design Principles
1. **Layered Separation of Concerns**: `API Routes` -> `Services` -> `Repositories` -> `Database Client`.
2. **Never Fabricate User-Agents**: Generation queries only authentic, verified records existing in the database.
3. **Resilient Synchronization**: Periodic background synchronization with degraded fallback caches so the system never fails when external sources suffer downtime.
4. **Transparent Scoring**: Modular confidence engine evaluating source presence, multi-source agreement, OS/browser compatibility, and structural integrity.

---

## 2. Database Schema Breakdown

UAForge operates on a relational PostgreSQL database schema consisting of 8 purpose-built tables:

```
+----------------+       1:N       +---------------------+       N:1       +---------------+
|  user_agents   | <-------------> | user_agent_sources  | <-------------> |    sources    |
+----------------+                 +---------------------+                 +---------------+
        |                                                                          |
        | 1:N                                                                      | 1:N
        v                                                                          v
+---------------------+                                                    +---------------+
| validation_results  |                                                    |   sync_runs   |
+---------------------+                                                    +---------------+

+----------------+                 +---------------------+                 +---------------+
|     users      | <-------------+ | generation_history  |                 |  system_logs  |
+----------------+       1:N       +---------------------+                 +---------------+
```

### Table 1: `user_agents`
Stores canonical, normalized User-Agent records deduplicated via cryptographic SHA-256 hashes.
- `id` (SERIAL PRIMARY KEY): Unique auto-incrementing identifier.
- `user_agent` (TEXT NOT NULL): The full User-Agent string.
- `normalized_hash` (VARCHAR(64) UNIQUE NOT NULL): SHA-256 hash of the normalized UA string.
- `browser` (VARCHAR(100)): Normalized browser name (e.g., "Chrome", "Safari", "Firefox", "Edge").
- `browser_version` (VARCHAR(50)): Full browser version string (e.g., "131.0.6778.135").
- `browser_major_version` (VARCHAR(20)): Major browser release (e.g., "131").
- `operating_system` (VARCHAR(100)): Operating system name (e.g., "Android", "iOS", "Windows", "macOS", "Linux").
- `operating_system_version` (VARCHAR(50)): Operating system version (e.g., "15", "18.1", "10.0").
- `device_type` (VARCHAR(50)): Hardware classification ("mobile", "tablet", "desktop").
- `device_brand` (VARCHAR(100)): Hardware manufacturer (e.g., "Google", "Samsung", "Apple").
- `device_model` (VARCHAR(100)): Hardware model (e.g., "Pixel 9 Pro", "SM-S928B", "iPhone").
- `is_mobile` (BOOLEAN): Flag indicating mobile smartphone.
- `is_tablet` (BOOLEAN): Flag indicating tablet hardware.
- `is_desktop` (BOOLEAN): Flag indicating laptop/desktop hardware.
- `confidence_score` (INTEGER): Calculated confidence score (0-100).
- `validation_status` (VARCHAR(50)): Status flag ("Validated", "Incompatible", "Suspicious", "Pending").
- `first_seen` (TIMESTAMP WITH TIME ZONE): First observation timestamp.
- `last_seen` (TIMESTAMP WITH TIME ZONE): Most recent verification timestamp.
- `created_at` / `updated_at`: Audit timestamps.

**Indexes**:
- `idx_user_agents_hash` ON (`normalized_hash`) [UNIQUE]
- `idx_user_agents_os` ON (`operating_system`)
- `idx_user_agents_browser` ON (`browser`)
- `idx_user_agents_device_type` ON (`device_type`)
- `idx_user_agents_confidence` ON (`confidence_score`)

---

### Table 2: `sources`
Registers external data providers and tracks operational health.
- `id` (VARCHAR(50) PRIMARY KEY): Provider key ("microlink", "intoli", "whatismybrowser", "local").
- `name` (VARCHAR(100)): Human-readable provider title.
- `provider_type` (VARCHAR(50)): Connector type.
- `base_url` (TEXT): Primary API or repository endpoint URL.
- `enabled` (BOOLEAN): Administrator toggle switch.
- `status` (VARCHAR(30)): Health status ("ONLINE", "DEGRADED", "OFFLINE").
- `last_successful_sync` (TIMESTAMP WITH TIME ZONE): Timestamp of last error-free sync.
- `last_attempted_sync` (TIMESTAMP WITH TIME ZONE): Timestamp of most recent sync trigger.
- `record_count` (INTEGER): Total records supplied by this source.
- `created_at` / `updated_at`: Audit timestamps.

---

### Table 3: `user_agent_sources`
Join table establishing many-to-many relationships between User-Agents and verified data sources.
- `id` (SERIAL PRIMARY KEY): Unique join ID.
- `user_agent_id` (INTEGER REFERENCES `user_agents(id)` ON DELETE CASCADE): User agent reference.
- `source_id` (VARCHAR(50) REFERENCES `sources(id)` ON DELETE CASCADE): Source reference.
- `source_record_id` (VARCHAR(100)): Remote identifier or index.
- `first_seen` / `last_seen` / `matched_at`: Provenance verification timestamps.
- **Unique Constraint**: `(user_agent_id, source_id)` ensures idempotent tracking.

---

### Table 4: `validation_results`
Detailed audit log of synthetic or analyzed User-Agent compatibility checks.
- `id` (SERIAL PRIMARY KEY): Evaluation ID.
- `user_agent_id` (INTEGER REFERENCES `user_agents(id)` ON DELETE CASCADE): Target UA.
- `is_valid` (BOOLEAN): Compatibility pass/fail outcome.
- `compatibility_status` (VARCHAR(50)): Status outcome ("COMPATIBLE", "SUSPICIOUS", "INCOMPATIBLE", "OBSOLETE", "MALFORMED").
- `checks_passed` (TEXT[]): List of verified architectural rules.
- `checks_failed` (TEXT[]): List of violated architectural rules.
- `details` (JSONB): Structured diagnostic payload.
- `evaluated_at`: Timestamp of check execution.

---

### Table 5: `sync_runs`
Execution logs for periodic and on-demand synchronization tasks.
- `id` (SERIAL PRIMARY KEY): Run identifier.
- `source_id` (VARCHAR(50) REFERENCES `sources(id)` ON DELETE CASCADE): Provider synchronized.
- `status` (VARCHAR(30)): Execution status ("RUNNING", "SUCCESS", "DEGRADED", "FAILED").
- `records_fetched` (INTEGER): Total records received from upstream.
- `records_inserted` (INTEGER): New unique records added to the database.
- `records_updated` (INTEGER): Existing records verified with updated timestamp.
- `error_message` (TEXT): Diagnostic error details if status is degraded or failed.
- `duration_ms` (INTEGER): Execution duration in milliseconds.
- `started_at` / `completed_at`: Execution lifecycle timestamps.

---

### Table 6: `generation_history`
Audit trail of generation queries and exports.
- `id` (SERIAL PRIMARY KEY): History identifier.
- `user_id` (INTEGER REFERENCES `users(id)` ON DELETE SET NULL): Optional user reference.
- `platform` (VARCHAR(50)): Requested platform filter.
- `device_type` (VARCHAR(50)): Requested device category.
- `browser` (VARCHAR(50)): Requested browser engine.
- `min_confidence` (INTEGER): Applied confidence threshold.
- `quantity` (INTEGER): Requested quantity.
- `result_count` (INTEGER): Number of returned records.
- `exported_format` (VARCHAR(20)): Export file format ("json", "csv", "txt", or null).
- `generated_at`: Timestamp.

---

### Table 7: `users`
Account and access management for optional multi-tier rate limiting.
- `id` (SERIAL PRIMARY KEY): User identifier.
- `email` (VARCHAR(255) UNIQUE NOT NULL): User email.
- `role` (VARCHAR(50) DEFAULT 'user'): Role identifier ('user', 'admin').
- `api_key` (VARCHAR(128) UNIQUE): API secret key for programmatic consumption.
- `created_at` / `updated_at`: Timestamps.

---

### Table 8: `system_logs`
Structured request metrics and operational telemetry.
- `id` (SERIAL PRIMARY KEY): Log identifier.
- `level` (VARCHAR(20)): 'info', 'warn', 'error', 'debug'.
- `request_id` (VARCHAR(64)): Distributed trace UUID.
- `endpoint` (VARCHAR(255)): Request path.
- `method` (VARCHAR(10)): HTTP verb.
- `status` (INTEGER): HTTP response status code.
- `duration_ms` (INTEGER): Latency in milliseconds.
- `message` (TEXT): Summary log message.
- `metadata` (JSONB): Structured request parameters and diagnostics.
- `timestamp`: Timestamp.

---

## 3. Confidence Engine Architecture

Confidence scoring operates via `ConfidenceService` utilizing configurable rules in `confidenceRules.ts`:

$$\text{Confidence Score} = \text{Base Source} + \text{Multi-Source Bonus} + \text{Compatibility Modifier} + \text{Parser Completeness} + \text{Device Consistency} + \text{Recency}$$

- **Base Source Presence**: +45 points if present in at least 1 verified source.
- **Multi-Source Bonus**: +18 points per additional source (max +36 points).
- **Compatibility Bonus**: +15 points if 100% architecturally compatible.
- **Penalties**:
  - Suspicious token pairing: -25 points.
  - Obsolete version mismatch: -20 points.
  - Impossible OS/Browser combination: -50 points.
  - Malformed syntax: -60 points.
- **Scale**:
  - 90–100: **Very High Confidence**
  - 75–89: **High Confidence**
  - 60–74: **Medium Confidence**
  - 40–59: **Low Confidence**
  - 0–39: **Suspicious**

---

## 4. API Endpoints Reference

All endpoints return uniform envelope responses:
```json
{
  "data": { ... },
  "meta": {
    "requestId": "4f8a12e2-...",
    "timestamp": "2026-09-11T..."
  }
}
```

- `GET /api/v1/health`: Cluster health, DB status, and provider health checks.
- `GET /api/v1/stats`: Dashboard summary counts (total records, Android, iOS, Desktop, high-confidence counts).
- `GET /api/v1/user-agents`: Filtered query and pagination with search token matching.
- `GET /api/v1/user-agents/:id`: Individual User-Agent details and provenance sources.
- `GET /api/v1/user-agents/export`: Streaming export in TXT, CSV, or JSON format.
- `POST /api/v1/generate`: Random generation from verified database records matching platform, browser, device, and minimum confidence.
- `POST /api/v1/analyze`: Full diagnostic breakdown, compatibility check, and confidence breakdown of any arbitrary User-Agent string.
- `GET /api/v1/sources`: Source list with sync status, record counts, and API key configuration states.
- `POST /api/v1/sources/:id/sync`: Trigger manual synchronization (`:id` or `all`).
- `PATCH /api/v1/sources/:id/toggle`: Enable/disable source.
- `GET /api/v1/sources/runs`: Execution history of source synchronizations.
- `GET /api/v1/history`: Audit log of previous generation runs.
