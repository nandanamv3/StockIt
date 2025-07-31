# Deployment Guide

This guide will help you deploy your Inventory Management System to production.

## Prerequisites

- Supabase account and project set up
- Node.js and npm installed
- Domain name (optional)

## Environment Setup

1. **Create Production Environment File**
   ```bash
   cp .env.example .env.production.local
   ```

2. **Update Production Environment Variables**
   ```
   REACT_APP_SUPABASE_URL=your_production_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_production_supabase_anon_key
   ```

## Database Setup

1. **Run Database Schema**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `database-schema.sql`
   - Execute the SQL

2. **Add Sample Data (Optional)**
   - Copy and paste the contents of `sample-data.sql`
   - Execute to populate with test data

3. **Configure Row Level Security**
   - Ensure RLS is enabled (should be done by the schema)
   - Test with different user roles

## Build for Production

```bash
npm run build
```

## Deployment Options

### Option 1: Netlify (Recommended)

1. **Connect Repository**
   - Go to [Netlify](https://netlify.com)
   - Connect your GitHub repository
   - Choose the `inventory-management` folder as the base directory

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `build`

3. **Environment Variables**
   - Add your environment variables in Netlify dashboard
   - Settings > Environment variables

4. **Deploy**
   - Netlify will automatically deploy on each push to main branch

### Option 2: Vercel

1. **Connect Repository**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository

2. **Build Settings**
   - Framework: Create React App
   - Build command: `npm run build`
   - Output directory: `build`

3. **Environment Variables**
   - Add your Supabase credentials in Vercel dashboard

### Option 3: Traditional Hosting

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Upload Build Folder**
   - Upload the contents of the `build` folder to your web server
   - Ensure your server supports Single Page Applications (SPA)

3. **Configure Server**
   - Set up URL rewriting to serve `index.html` for all routes
   - Example Nginx configuration:
   ```nginx
   location / {
     try_files $uri $uri/ /index.html;
   }
   ```

## Post-Deployment Setup

1. **Create Admin User**
   - Sign up for the first account on your deployed app
   - This user will automatically become an admin

2. **Add Products**
   - Use the admin account to add your product catalog
   - Set appropriate low stock thresholds

3. **Test System**
   - Create test orders
   - Verify inventory updates
   - Check dashboard metrics

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files to version control
   - Use secure environment variable management in production

2. **Supabase Configuration**
   - Enable Row Level Security
   - Configure appropriate authentication settings
   - Set up proper CORS origins

3. **Regular Updates**
   - Keep dependencies updated
   - Monitor for security vulnerabilities
   - Regular database backups

## Performance Optimization

1. **Image Optimization**
   - Use CDN for product images
   - Optimize image sizes and formats

2. **Caching**
   - Enable browser caching for static assets
   - Consider implementing service workers

3. **Monitoring**
   - Set up error tracking (e.g., Sentry)
   - Monitor application performance
   - Track user analytics

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check for TypeScript errors
   - Verify all dependencies are installed
   - Check for missing environment variables

2. **Authentication Issues**
   - Verify Supabase URLs and keys
   - Check CORS settings in Supabase dashboard
   - Ensure proper redirect URLs are configured

3. **Database Connection Issues**
   - Verify database is accessible
   - Check Row Level Security policies
   - Ensure proper permissions are set

### Support

For deployment issues:
1. Check the browser console for errors
2. Review Supabase logs
3. Check your hosting provider's logs
4. Refer to the main README.md for additional troubleshooting

## Maintenance

1. **Regular Backups**
   - Set up automated database backups
   - Test backup restoration procedures

2. **Updates**
   - Regularly update dependencies
   - Test updates in staging before production

3. **Monitoring**
   - Monitor application performance
   - Track user feedback and bug reports
   - Monitor database usage and performance