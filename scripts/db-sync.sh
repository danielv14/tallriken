#!/bin/bash
set -euo pipefail

DB_NAME="tallriken-db"
LOCAL_DB=".wrangler/state/v3/d1/miniflare-D1DatabaseObject/591bbc95322edaa17f4342b951103c98b0577bdd26c4cda6730c3c0980ca9aa3.sqlite"
DUMP_FILE="/tmp/tallriken-d1-dump.sql"
TABLES="tags recipes recipe_tags shopping_lists weekly_menu_items"

usage() {
  echo "Usage: $0 <local-to-prod|prod-to-local>"
  echo ""
  echo "  local-to-prod   Export local D1 data and import into remote prod"
  echo "  prod-to-local   Export remote prod data and import into local D1"
  exit 1
}

dump_local() {
  echo "Exporting local D1..."
  rm -f "$DUMP_FILE"
  for table in $TABLES; do
    sqlite3 "$LOCAL_DB" ".dump $table" >> "$DUMP_FILE"
  done
  echo "Exported to $DUMP_FILE"
}

dump_remote() {
  echo "Exporting remote D1..."
  npx wrangler d1 export "$DB_NAME" --remote --output="$DUMP_FILE" --no-schema
  echo "Exported to $DUMP_FILE"
}

import_local() {
  echo "Clearing local tables..."
  for table in $(echo "$TABLES" | tr ' ' '\n' | tac); do
    sqlite3 "$LOCAL_DB" "DELETE FROM $table;"
  done
  echo "Importing into local D1..."
  sqlite3 "$LOCAL_DB" < "$DUMP_FILE"
  echo "Done"
}

import_remote() {
  echo "Clearing remote tables..."
  for table in $(echo "$TABLES" | tr ' ' '\n' | tac); do
    npx wrangler d1 execute "$DB_NAME" --remote --command="DELETE FROM $table;"
  done
  echo "Importing into remote D1..."
  npx wrangler d1 execute "$DB_NAME" --remote --file="$DUMP_FILE"
  echo "Done"
}

case "${1:-}" in
  local-to-prod)
    dump_local
    import_remote
    ;;
  prod-to-local)
    dump_remote
    import_local
    ;;
  *)
    usage
    ;;
esac

rm -f "$DUMP_FILE"
echo "Sync complete"
