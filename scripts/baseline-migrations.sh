#!/bin/bash
# One-time script to baseline D1 migrations tracking for an existing database.
# Run this once against production before enabling CI migrations.
#
# Usage: ./scripts/baseline-migrations.sh

set -euo pipefail

DB_NAME="tallriken-db"

echo "Creating d1_migrations table and marking existing migrations as applied..."

wrangler d1 execute "$DB_NAME" --remote --command "
  CREATE TABLE IF NOT EXISTS d1_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );
  INSERT INTO d1_migrations (name) VALUES ('0000_hard_mephisto.sql');
  INSERT INTO d1_migrations (name) VALUES ('0001_shallow_tomas.sql');
  INSERT INTO d1_migrations (name) VALUES ('0002_aspiring_gideon.sql');
  INSERT INTO d1_migrations (name) VALUES ('0003_careless_lizard.sql');
  INSERT INTO d1_migrations (name) VALUES ('0004_bent_shadowcat.sql');
"

echo "Done! Verify with: wrangler d1 migrations list $DB_NAME --remote"
