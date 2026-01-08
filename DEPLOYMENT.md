# Deployment Guide for Clinical Trial Taxonomy Finder

This guide covers multiple deployment options for your application.

## Prerequisites

- Node.js (v18 or later)
- A Gemini API key (set in `.env.local`)

## Deployment Options

### Option 1: Simple Build Deployment (Using deploy.sh)

The easiest way to deploy is using the `deploy.sh` script:

```bash
# Make sure deploy.sh is executable
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
```

This script will:
1. Check for required environment variables
2. Install dependencies
3. Build the production bundle
4. Output built files to the `dist` directory

After running, you can serve the `dist` directory using any static file server.

### Option 2: Docker Deployment

#### Using docker-compose (Recommended)

1. Make sure your `.env.local` file has `GEMINI_API_KEY` set
2. Run:
```bash
docker-compose up -d
```

The app will be available at `http://localhost`

#### Using Docker manually

Build the image:
```bash
docker build --build-arg API_KEY=your_api_key_here -t trial-map .
```

Run the container:
```bash
docker run -d -p 80:80 trial-map
```

### Option 3: Traditional Server Deployment with Nginx

1. Build the application:
```bash
npm install
export API_KEY=your_gemini_api_key
npm run build
```

2. Copy the `dist` folder to your web server:
```bash
sudo mkdir -p /var/www/html/trial-map
sudo cp -r dist/* /var/www/html/trial-map/
```

3. Copy the nginx configuration:
```bash
sudo cp nginx.conf /etc/nginx/sites-available/trial-map
sudo ln -s /etc/nginx/sites-available/trial-map /etc/nginx/sites-enabled/
```

4. Update the `root` path in nginx.conf to match your deployment directory

5. Test and reload nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Option 4: Cloud Platform Deployments

#### Vercel
```bash
npm install -g vercel
vercel
```
Make sure to add `GEMINI_API_KEY` in your Vercel project settings.

#### Netlify
```bash
npm install -g netlify-cli
netlify deploy
```
Add `GEMINI_API_KEY` in Netlify environment variables.

#### AWS S3 + CloudFront
1. Build the app: `npm run build`
2. Upload `dist` folder to S3
3. Configure CloudFront distribution
4. Set environment variable in build process

## Environment Variables

The application requires:
- `GEMINI_API_KEY`: Your Google Gemini API key (stored in `.env.local` for local development)

For production deployments, ensure this is set as an environment variable or build argument.

## Security Considerations

⚠️ **Important**: Never commit your `.env.local` file or expose your API keys in the frontend code.

The current setup injects the API key during build time. For production:
1. Consider using a backend proxy to protect your API key
2. Implement rate limiting
3. Use environment-specific API keys
4. Monitor API usage

## Troubleshooting

### Build fails with API key error
- Ensure `GEMINI_API_KEY` is set in `.env.local`
- For Docker: Make sure environment variable is passed correctly

### Nginx 404 errors on refresh
- Ensure the nginx configuration includes `try_files $uri $uri/ /index.html;`
- This handles client-side routing for the SPA

### Docker build is slow
- Ensure `.dockerignore` is present and properly configured
- Use Docker layer caching

## Support

For issues specific to Google AI Studio, visit: https://ai.studio/apps/drive/1MhrJoRv7b-tuNUXHa-e7SSpl3txe3b5z
