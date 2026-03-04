# MySQL to PostgreSQL Migration Plan (with Supabase)

## Summary
The backend has been migrated from MySQL to PostgreSQL using Supabase.

## Your Supabase Project:
- **Project Ref:** `ynqyvtqrstziyhklhcvo`
- **Connection URL:** `postgresql://postgres:[YOUR-PASSWORD]@db.ynqyvtqrstziyhklhcvo.supabase.co:5432/postgres`

## Files Modified (10 files):

1. **backend/package.json** - Replaced `mysql2` with `pg`
2. **backend/src/config/db.js** - Updated to use Supabase with SSL
3. **backend/src/models/Device.js** - Updated SQL queries ($1, $2 syntax)
4. **backend/src/models/OTP.js** - Updated SQL queries
5. **backend/src/server.js** - Updated inline SQL queries
6. **backend/src/controllers/deviceController.js** - Updated queries and error code
7. **backend/src/controllers/userController.js** - Updated SQL queries
8. **backend/showAllRecords.js** - Updated for PostgreSQL
9. **backend/add_column.js** - Updated for PostgreSQL
10. **backend/deleteUser.js** - Updated for PostgreSQL

## Environment Variables (.env):

Add these to your `.env` file:
```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.ynqyvtqrstziyhklhcvo.supabase.co:5432/postgres
```

## Create Tables in Supabase:

Run this SQL in your Supabase SQL Editor:

```
sql
-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  esp_id VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'OFF',
  speed INTEGER DEFAULT 0,
  last_heartbeat TIMESTAMP DEFAULT NULL
);

-- Create otps table
CREATE TABLE IF NOT EXISTS otps (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  otp VARCHAR(10),
  expires_at TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_devices_esp_id ON devices(esp_id);
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_otps_user_id ON otps(user_id);
```

## Key Changes:

| MySQL | PostgreSQL (Supabase) |
|-------|----------------------|
| `mysql2` | `pg` |
| `[rows]` | `result.rows` |
| `?` placeholders | `$1, $2...` |
| `AUTO_INCREMENT` | `SERIAL` |
| `ER_DUP_ENTRY` | `23505` |

The migration is complete! The pg package is installed and configured for your Supabase project.
