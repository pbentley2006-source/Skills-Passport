-- Initialize Skills Passport Database
-- This script sets up the initial database structure and sample data

-- Create database if it doesn't exist (handled by docker-compose)
-- CREATE DATABASE IF NOT EXISTS skills_passport;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance (these will be created by Prisma migrations)
-- But we can add some initial setup here if needed

-- Insert sample data for development/testing
-- This will be handled by the application seeding process

-- Log the initialization
DO $$
BEGIN
    RAISE NOTICE 'Skills Passport database initialized successfully';
END $$;
