# Deployment Guide

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

## Local Preview

```bash
npm run preview
```

Preview the production build locally.

## Deployment Options

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Deploy (auto-detects Vite)

### Netlify

1. Build command: `npm run build`
2. Publish directory: `dist`
3. Netlify will auto-deploy from GitHub

### GitHub Pages

Add to `vite.config.js`:

```js
export default defineConfig({
  base: '/your-repo-name/',
  plugins: [react()],
})
```

Then deploy:
```bash
npm run build
# Push dist folder to gh-pages branch
```

### Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build -t talentflow .
docker run -p 80:80 talentflow
```

## Environment Variables

Currently, no environment variables are needed as all data is stored locally.

## Important Notes

- IndexedDB is browser-specific (won't sync across devices)
- MSW is disabled in production builds by default
- For real backend integration, create `.env` file with API endpoints







