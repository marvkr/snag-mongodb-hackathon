# Test Data for Phase 1 Core Pipeline

## Screenshot Seed Data

Place your 4 LA travel location screenshots in this directory:

```
test-data/screenshots/
├── la-location-1.jpg
├── la-location-2.jpg
├── la-location-3.jpg
└── la-location-4.jpg
```

## How to Test

Once you've added your screenshots here, run the batch test:

```bash
# From apps/api directory
npm run dev

# In another terminal
npx tsx test-all-screenshots.ts
```

Or test individual screenshots:

```bash
npx tsx test-screenshot.ts test-data/screenshots/la-location-1.jpg
```

## Expected Results

For LA travel screenshots, you should see:
- `primary_bucket: "travel"`
- High confidence (>0.7)
- Places extracted (e.g., "Silver Lake", "Venice Beach", "Malibu")
- OCR text if present
- Vector embeddings (1024 dimensions)

## Test Scenarios

### Screenshot 1: Restaurant/Cafe
- Expected: travel bucket
- Places: Restaurant name, neighborhood
- Entities: Cuisine type, location

### Screenshot 2: Beach/Outdoor
- Expected: travel bucket
- Places: Beach name, city
- Entities: Activities, landmarks

### Screenshot 3: Map/Navigation
- Expected: travel bucket
- Places: Multiple locations
- Entities: Directions, addresses

### Screenshot 4: Hotel/Accommodation
- Expected: travel bucket
- Places: Hotel name, area
- Entities: Amenities, pricing
