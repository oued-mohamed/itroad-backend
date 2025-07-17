// infrastructure/scripts/migrate.sh
#!/bin/bash

# Set script to exit on any error
set -e

echo "🔄 Starting database migration..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Default database connection variables
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-adherant_real_estate}
DB_USER=${DB_USER:-postgres}

echo "📡 Connecting to database: $DB_HOST:$DB_PORT/$DB_NAME"

# Check if database exists, create if not
echo "🗄️  Checking if database exists..."
DB_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "")

if [ -z "$DB_EXISTS" ]; then
    echo "📊 Creating database '$DB_NAME'..."
    PGPASSWORD=$DB_PASSWORD createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
    echo "✅ Database created successfully!"
else
    echo "✅ Database already exists!"
fi

# Run migrations in order
echo "🏗️  Running migrations..."

for migration in database/migrations/*.sql; do
    if [ -f "$migration" ]; then
        echo "📝 Applying migration: $(basename $migration)"
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$migration"
    fi
done

echo "✅ All migrations completed successfully!"

