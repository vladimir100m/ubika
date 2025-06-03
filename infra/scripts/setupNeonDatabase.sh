#!/bin/bash

# Neon Database Setup Script for Ubika
echo "🚀 Setting up Neon Database for Ubika..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found! Please create it with your Neon database credentials."
    exit 1
fi

# Test database connection
echo "1️⃣ Testing database connection..."
node infra/scripts/testConnection.js

if [ $? -ne 0 ]; then
    echo "❌ Database connection failed. Please check your .env configuration."
    exit 1
fi

# Run database setup
echo "2️⃣ Setting up advanced database schema..."
node infra/scripts/setupAdvancedDatabase.js

if [ $? -ne 0 ]; then
    echo "❌ Database schema setup failed."
    exit 1
fi

# Populate initial data
echo "3️⃣ Setting up initial property data..."
node infra/scripts/setupDatabase.js

if [ $? -ne 0 ]; then
    echo "❌ Initial data setup failed."
    exit 1
fi

# Populate property features
echo "4️⃣ Populating property features..."
node infra/scripts/populatePropertyFeatures.js

if [ $? -ne 0 ]; then
    echo "❌ Property features setup failed."
    exit 1
fi

echo "✅ Neon database setup completed successfully!"
echo "🎉 Your Ubika app is now ready to use with Neon database!"
