-- Create identity database alongside default travelai DB
SELECT 'CREATE DATABASE travelai_identity'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'travelai_identity')\gexec

GRANT ALL PRIVILEGES ON DATABASE travelai TO travelai;
GRANT ALL PRIVILEGES ON DATABASE travelai_identity TO travelai;
