# 🌸 Cloudinary Setup Complete Guide

## 🚀 Quick Setup (Recommended)

Run the automated setup script:

```bash
npm run setup-cloudinary
```

## 📋 Manual Setup Steps

### 1. Create Cloudinary Account
1. Go to https://cloudinary.com/users/register/free
2. Sign up for free account
3. Verify your email

### 2. Get Your Credentials
From Cloudinary dashboard:
- **Cloud Name**: Dashboard > Account Details
- **API Key**: Dashboard > Settings > API Keys  
- **API Secret**: Dashboard > Settings > API Keys

### 3. Configure Environment Variables
Edit `.env` file and add:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

### 4. Test Connection
```bash
npm run test-cloudinary
```

### 5. Upload Images
```bash
npm run seed-cloudinary
```

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `npm run setup-cloudinary` | Automated setup script |
| `npm run test-cloudinary` | Test Cloudinary connection |
| `npm run seed-cloudinary` | Upload product images to Cloudinary |
| `npm run seed` | Use placeholder images (for testing) |

## 📁 Image Organization

Images will be organized in Cloudinary as:
```
toko-bunga/
├── produk/
│   ├── 1/ (product ID 1)
│   │   ├── buket.jpg
│   │   └── buket2.jpg
│   ├── 2/ (product ID 2)
│   └── ...
└── test/ (for connection testing)
```

## 🔧 Troubleshooting

### Error: "Must supply api_key"
**Solution**: Check `CLOUDINARY_API_KEY` in `.env`

### Error: "Cloud name required"  
**Solution**: Check `CLOUDINARY_CLOUD_NAME` in `.env`

### Images not uploading
**Solution**: 
1. Verify all credentials are correct
2. Check internet connection
3. Ensure image files exist in project root

### Connection timeout
**Solution**: Check firewall or proxy settings

## 🎯 Next Steps After Setup

1. **Verify images in dashboard**: Check Cloudinary dashboard
2. **Test website**: Refresh products page
3. **Check API response**: `http://localhost:3002/api/products`
4. **Monitor usage**: Check Cloudinary usage stats

## 📊 Cloudinary Free Tier Limits

- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month  
- **Transformations**: 25 credits/month
- **Requests**: 50,000/month

Perfect for small to medium flower shops! 🌺

## 🚀 Production Deployment

For Vercel deployment, add environment variables in Vercel dashboard:

1. Go to Vercel project > Settings > Environment Variables
2. Add the three Cloudinary variables
3. Redeploy project

---

**Need help?** Check the detailed setup guide: `CLOUDINARY_SETUP.md`
