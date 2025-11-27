#!/bin/bash

# Cloudinary Setup Script for Toko Bunga
echo "🌸 Cloudinary Setup for Toko Bunga"
echo "=================================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created!"
    echo ""
else
    echo "📁 .env file already exists"
    echo ""
fi

echo "📋 Please follow these steps:"
echo ""
echo "1. Go to https://cloudinary.com/users/register/free"
echo "2. Create a free account"
echo "3. After registration, you'll see your dashboard"
echo "4. Copy these credentials from your Cloudinary dashboard:"
echo ""
echo "   🌐 Cloud Name: abc123xyz"
echo "   🔑 API Key: 123456789012345"
echo "   🔐 API Secret: abc123def456"
echo ""
echo "5. Edit your .env file and add these credentials:"
echo ""
echo "   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name"
echo "   CLOUDINARY_API_KEY=your_cloudinary_api_key"
echo "   CLOUDINARY_API_SECRET=your_cloudinary_api_secret"
echo ""
echo "6. Test the connection:"
echo "   npm run test-cloudinary"
echo ""
echo "7. Upload images:"
echo "   npm run seed-cloudinary"
echo ""

# Check if credentials are already set
if [ -f ".env" ]; then
    if grep -q "CLOUDINARY_CLOUD_NAME=" .env && grep -q "CLOUDINARY_API_KEY=" .env && grep -q "CLOUDINARY_API_SECRET=" .env; then
        echo "✅ Cloudinary credentials found in .env"
        echo ""
        echo "🧪 Testing connection..."
        npm run test-cloudinary
    else
        echo "⚠️  Please add Cloudinary credentials to .env file"
        echo ""
        echo "📖 Open .env file and add:"
        echo "   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name"
        echo "   CLOUDINARY_API_KEY=your_cloudinary_api_key"
        echo "   CLOUDINARY_API_SECRET=your_cloudinary_api_secret"
    fi
fi

echo ""
echo "📖 For detailed instructions, see: CLOUDINARY_SETUP.md"
