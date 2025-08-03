# Installing pgvector for Local PostgreSQL

## macOS (Homebrew)
```bash
# Install pgvector
brew install pgvector

# Or if you have PostgreSQL from Homebrew:
brew install postgresql@14 pgvector
```

## Ubuntu/Debian
```bash
# Install dependencies
sudo apt update
sudo apt install postgresql-server-dev-14 build-essential git

# Clone and install pgvector
git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
```

## Docker
```dockerfile
# Use official PostgreSQL image with pgvector
FROM pgvector/pgvector:pg15

# Or add to existing PostgreSQL container
RUN apt-get update && apt-get install -y postgresql-15-pgvector
```

## Enable in Database
```sql
-- Connect to your database and run:
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';
```

## Test Installation
```sql
-- Create test table with vector column
CREATE TABLE test_vectors (
    id SERIAL PRIMARY KEY,
    embedding vector(3)
);

-- Insert test data
INSERT INTO test_vectors (embedding) VALUES 
    ('[1,2,3]'),
    ('[4,5,6]');

-- Test similarity search
SELECT id, embedding, embedding <-> '[1,2,3]' as distance 
FROM test_vectors 
ORDER BY distance;
```