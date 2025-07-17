-- // database/seeds/demo-users.sql
-- Insert demo users with different roles
INSERT INTO users (id, email, password, first_name, last_name, role) VALUES
-- Admin user
('550e8400-e29b-41d4-a716-446655440001', 'admin@adherant.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiw.F7.F7.F7', 'Admin', 'User', 'admin'),

-- Agent users
('550e8400-e29b-41d4-a716-446655440002', 'agent1@adherant.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiw.F7.F7.F7', 'John', 'Smith', 'agent'),
('550e8400-e29b-41d4-a716-446655440003', 'agent2@adherant.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiw.F7.F7.F7', 'Sarah', 'Johnson', 'agent'),

-- Client users
('550e8400-e29b-41d4-a716-446655440004', 'client1@adherant.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiw.F7.F7.F7', 'Michael', 'Brown', 'client'),
('550e8400-e29b-41d4-a716-446655440005', 'client2@adherant.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiw.F7.F7.F7', 'Emily', 'Davis', 'client')

ON CONFLICT (email) DO NOTHING;

-- Insert demo profiles
INSERT INTO profiles (user_id, phone, address, city, state, country, license_number, agency_name, specializations, experience, preferred_contact_method, budget) VALUES
-- Admin profile
('550e8400-e29b-41d4-a716-446655440001', '+1234567890', '123 Admin St', 'New York', 'NY', 'USA', NULL, NULL, NULL, NULL, 'email', NULL),

-- Agent profiles
('550e8400-e29b-41d4-a716-446655440002', '+1555123456', '456 Real Estate Ave', 'Miami', 'FL', 'USA', 'FL123456', 'Premier Realty', ARRAY['luxury', 'waterfront'], 8, 'phone', NULL),
('550e8400-e29b-41d4-a716-446655440003', '+1555654321', '789 Property Blvd', 'Los Angeles', 'CA', 'USA', 'CA789012', 'Sunset Properties', ARRAY['residential', 'commercial'], 5, 'email', NULL),

-- Client profiles
('550e8400-e29b-41d4-a716-446655440004', '+1555987654', '321 Buyer St', 'Chicago', 'IL', 'USA', NULL, NULL, NULL, NULL, 'phone', 750000),
('550e8400-e29b-41d4-a716-446655440005', '+1555456789', '654 Client Ave', 'Houston', 'TX', 'USA', NULL, NULL, NULL, NULL, 'email', 500000)

ON CONFLICT (user_id) DO NOTHING;

-- database/seeds/demo-properties.sql
-- Insert demo properties
INSERT INTO properties (id, agent_id, title, description, type, status, price, currency, address, city, state, country, postal_code, latitude, longitude, bedrooms, bathrooms, area, area_unit, year_built, features, is_featured) VALUES

-- Luxury Miami Beach Condo
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Luxury Miami Beach Oceanfront Condo', 'Stunning 3-bedroom oceanfront condo with panoramic views of the Atlantic Ocean. This modern unit features floor-to-ceiling windows, marble floors, and a private balcony.', 'condo', 'available', 1250000, 'USD', '1001 Ocean Drive', 'Miami Beach', 'FL', 'USA', '33139', 25.7617, -80.1918, 3, 2.5, 2100, 'sqft', 2020, ARRAY['ocean_view', 'balcony', 'parking', 'gym', 'pool', 'concierge'], true),

-- Modern LA House
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'Modern Beverly Hills House', 'Contemporary 4-bedroom house in prestigious Beverly Hills. Features include a gourmet kitchen, home theater, infinity pool, and three-car garage.', 'house', 'available', 3500000, 'USD', '456 Sunset Blvd', 'Beverly Hills', 'CA', 'USA', '90210', 34.0736, -118.4004, 4, 3.5, 4200, 'sqft', 2019, ARRAY['pool', 'garage', 'home_theater', 'gourmet_kitchen', 'security_system'], true),

-- Chicago Downtown Apartment
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Downtown Chicago High-Rise Apartment', 'Elegant 2-bedroom apartment on the 35th floor with city skyline views. Modern amenities include in-unit laundry, stainless steel appliances, and access to building gym.', 'apartment', 'available', 485000, 'USD', '123 Michigan Ave', 'Chicago', 'IL', 'USA', '60601', 41.8781, -87.6298, 2, 2, 1350, 'sqft', 2018, ARRAY['city_view', 'gym', 'laundry', 'doorman'], false),

-- Houston Suburban House
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'Spacious Houston Family Home', 'Beautiful 5-bedroom family home in quiet suburban neighborhood. Features large backyard, two-car garage, and excellent schools nearby.', 'house', 'available', 420000, 'USD', '789 Oak Tree Lane', 'Houston', 'TX', 'USA', '77056', 29.7604, -95.3698, 5, 3, 3200, 'sqft', 2015, ARRAY['garage', 'backyard', 'fireplace', 'hardwood_floors'], false),

-- NYC Studio
('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Manhattan Studio Apartment', 'Cozy studio apartment in the heart of Manhattan. Perfect for young professionals. Features modern kitchen and bathroom, hardwood floors, and great natural light.', 'studio', 'available', 285000, 'USD', '567 Broadway', 'New York', 'NY', 'USA', '10012', 40.7589, -73.9851, 0, 1, 650, 'sqft', 2017, ARRAY['hardwood_floors', 'natural_light', 'modern_kitchen'], false)

ON CONFLICT (id) DO NOTHING;

-- Insert demo property images
INSERT INTO property_images (property_id, filename, original_name, url, caption, is_primary, order_index) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'miami_condo_main.jpg', 'ocean_view_living_room.jpg', 'http://localhost:3003/uploads/property-images/miami_condo_main.jpg', 'Living room with ocean view', true, 0),
('650e8400-e29b-41d4-a716-446655440001', 'miami_condo_bedroom.jpg', 'master_bedroom.jpg', 'http://localhost:3003/uploads/property-images/miami_condo_bedroom.jpg', 'Master bedroom', false, 1),
('650e8400-e29b-41d4-a716-446655440002', 'la_house_exterior.jpg', 'front_exterior.jpg', 'http://localhost:3003/uploads/property-images/la_house_exterior.jpg', 'Front exterior view', true, 0),
('650e8400-e29b-41d4-a716-446655440003', 'chicago_apt_living.jpg', 'living_room_city_view.jpg', 'http://localhost:3003/uploads/property-images/chicago_apt_living.jpg', 'Living room with city view', true, 0)

ON CONFLICT DO NOTHING;

-- database/seeds/demo-transactions.sql
-- Insert demo transactions
INSERT INTO transactions (id, property_id, agent_id, client_id, buyer_id, type, status, price, currency, commission, commission_type, commission_amount, notes, contract_date, closing_date) VALUES

-- Active transaction for Miami condo
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'sale', 'under_contract', 1250000, 'USD', 6.0, 'percentage', 75000, 'Client very motivated, quick closing requested', '2024-01-15', '2024-02-28'),

-- Inquiry for LA house
('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'sale', 'viewing_scheduled', 3500000, 'USD', 5.5, 'percentage', 192500, 'High-end client, showing scheduled for this weekend', NULL, NULL),

-- Closed transaction for Chicago apartment
('750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'sale', 'closed', 485000, 'USD', 6.0, 'percentage', 29100, 'Smooth transaction, first-time buyer', '2023-12-01', '2023-12-30')

ON CONFLICT (id) DO NOTHING;

-- database/init.sql
-- Create database initialization script
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable row level security
ALTER DATABASE adherant_real_estate SET row_security = on;

-- Create custom types
DO $ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'agent', 'client');
EXCEPTION
    WHEN duplicate_object THEN null;
END $;

DO $ BEGIN
    CREATE TYPE property_type AS ENUM ('house', 'apartment', 'condo', 'townhouse', 'villa', 'studio', 'duplex', 'penthouse', 'commercial', 'office', 'retail', 'warehouse', 'land', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $;

DO $ BEGIN
    CREATE TYPE property_status AS ENUM ('available', 'under_contract', 'sold', 'rented', 'off_market', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $;

DO $ BEGIN
    CREATE TYPE transaction_type AS ENUM ('sale', 'rental', 'lease');
EXCEPTION
    WHEN duplicate_object THEN null;
END $;

DO $ BEGIN
    CREATE TYPE transaction_status AS ENUM ('inquiry', 'viewing_scheduled', 'offer_made', 'offer_accepted', 'under_contract', 'inspection_pending', 'inspection_completed', 'financing_pending', 'financing_approved', 'appraisal_pending', 'appraisal_completed', 'closing_scheduled', 'closed', 'cancelled', 'on_hold');
EXCEPTION
    WHEN duplicate_object THEN null;
END $;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$ language 'plpgsql';

-- Create upload directories if they don't exist (This would be handled by the application)
-- The application will create these directories when needed