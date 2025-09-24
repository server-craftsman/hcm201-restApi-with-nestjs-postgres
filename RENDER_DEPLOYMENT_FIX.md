# Render Deployment Fix

## Issues Fixed

### 1. **Port Listening Issue** ✅
**Problem**: App wasn't listening on the correct port for Render
**Solution**: Updated `src/main.ts` to use `process.env.PORT` first:
```typescript
const port = process.env.PORT || configService.get('app.port') || 51213;
```

### 2. **Memory Limit Issue** ✅
**Problem**: Node.js running out of memory (heap limit exceeded)
**Solution**: Added memory limits in multiple places:

#### Package.json
```json
{
  "start:prod:memory": "NODE_OPTIONS='--max-old-space-size=512' node dist/main"
}
```

#### Render.yaml
```yaml
envVars:
  - key: NODE_OPTIONS
    value: "--max-old-space-size=512"
```

### 3. **Deployment Configuration** ✅
**Problem**: Using Docker deployment which was causing memory issues
**Solution**: Switched to Node.js deployment:

```yaml
services:
  - type: web
    name: debate-system-api
    env: node  # Changed from docker
    plan: free
    buildCommand: pnpm install --frozen-lockfile && pnpm build
    startCommand: pnpm run start:prod:memory
```

## Key Changes Made

### `src/main.ts`
- ✅ Fixed port listening to use `process.env.PORT` first
- ✅ Maintains existing functionality and Swagger UI

### `package.json`
- ✅ Added `start:prod:memory` script with 512MB memory limit
- ✅ Existing scripts remain unchanged

### `render.yaml`
- ✅ Switched from Docker to Node.js deployment
- ✅ Added `NODE_OPTIONS` environment variable
- ✅ Set PORT to 10000 (Render's standard)
- ✅ Removed Prisma post-deploy commands (using MongoDB)

## Memory Optimization

- **Memory Limit**: 512MB (suitable for Render free tier)
- **Build Process**: Uses `--frozen-lockfile` for faster, consistent builds
- **Start Process**: Runs compiled JavaScript directly (not TypeScript)

## Deployment Commands

### For Render (Production)
```bash
pnpm run start:prod:memory
```

### For Local Development
```bash
pnpm run start:dev
```

## Environment Variables Set

- `NODE_ENV=production`
- `NODE_OPTIONS=--max-old-space-size=512`
- `PORT=10000`
- `APP_HOST=0.0.0.0`

## Expected Results

✅ **Port Listening**: App will listen on Render's assigned port
✅ **Memory Usage**: Stays within 512MB limit
✅ **Build Success**: Faster builds with frozen lockfile
✅ **Start Success**: Direct JS execution without TypeScript compilation

## Testing Locally

```bash
# Test with memory limit
NODE_OPTIONS="--max-old-space-size=512" pnpm run start:prod

# Test with Render's port
PORT=10000 pnpm run start:prod
```

## Fallback Options

If 512MB is still too much:
1. Reduce to 256MB: `--max-old-space-size=256`
2. Reduce to 128MB: `--max-old-space-size=128`
3. Upgrade Render plan for more memory

## Success Indicators

- ✅ No "No open ports detected" error
- ✅ No "JavaScript heap out of memory" error
- ✅ App responds to health checks at `/health`
- ✅ Swagger UI accessible at `/swagger-ui`
