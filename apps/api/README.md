# API Server

Express.js API server with Fireworks AI integration for the React Native app.

## Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your Fireworks AI API key to `.env`:
   ```
   FIREWORKS_API_KEY=your_api_key_here
   ```

3. Install dependencies (from root):
   ```bash
   pnpm install
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

   Or from the root of the monorepo:
   ```bash
   pnpm --filter @repo/api dev
   ```

## API Endpoints

### Health Check
```
GET /health
```

Returns the health status of the API.

### Generate Text with Fireworks AI
```
POST /api/generate
```

**Request Body:**
```json
{
  "prompt": "Your prompt here",
  "model": "accounts/fireworks/models/llama-v3p1-8b-instruct" // optional
}
```

**Response:**
```json
{
  "success": true,
  "text": "Generated text response",
  "model": "accounts/fireworks/models/llama-v3p1-8b-instruct"
}
```

## Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm clean` - Clean build artifacts
