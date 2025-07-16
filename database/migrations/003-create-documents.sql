-- database/migrations/003-create-documents.sql
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    adherant_id UUID NOT NULL REFERENCES adherants(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size INTEGER NOT NULL,
    path TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('identity', 'medical', 'education', 'employment', 'financial', 'other')),
    is_public BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_adherant_id ON documents(adherant_id);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_created_at ON documents(created_at);

-- Create refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT NOT NULL UNIQUE,
    adherant_id UUID NOT NULL REFERENCES adherants(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_adherant_id ON refresh_tokens(adherant_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- database/seeds/demo-data.sql
-- Insert demo adherant
INSERT INTO adherants (id, email, password, first_name, last_name) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'demo@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiw.F7.F7.F7', 'Demo', 'User')
ON CONFLICT (email) DO NOTHING;

-- Insert demo profile
INSERT INTO profiles (adherant_id, phone, city, country, bio) VALUES
('550e8400-e29b-41d4-a716-446655440000', '+1234567890', 'Demo City', 'Demo Country', 'This is a demo user profile')
ON CONFLICT (adherant_id) DO NOTHING;