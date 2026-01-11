import dotenv from 'dotenv';
import { connectToDatabase, getBucketsCollection, getImagesCollection, closeDatabase } from './db';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config();

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to database
    await connectToDatabase();

    const bucketsCollection = getBucketsCollection();

    // Clear existing buckets (optional - comment out if you want to keep existing data)
    await bucketsCollection.deleteMany({});
    console.log('🧹 Cleared existing buckets');

    // Seed buckets
    const buckets = [
      {
        id: 'travel',
        name: 'Travel',
        description: 'Extracts locations and provides travel recommendations',
        createdAt: new Date()
      },
      {
        id: 'products',
        name: 'Products',
        description: 'Analyzes products and finds similar items with reviews',
        createdAt: new Date()
      },
      {
        id: 'twitter',
        name: 'Twitter Screenshots',
        description: 'Crafts engaging replies to tweets',
        createdAt: new Date()
      },
    ];

    const result = await bucketsCollection.insertMany(buckets);
    console.log(`✅ Inserted ${result.insertedCount} buckets`);

    // Seed travel data for demo
    const imagesCollection = getImagesCollection();
    await imagesCollection.deleteMany({ bucketId: 'travel' });
    console.log('🧹 Cleared existing travel images');

    // Helper function to read screenshots as base64
    const readScreenshot = (filename: string): string => {
      const path = join(__dirname, '../test-data/screenshots', filename);
      const buffer = readFileSync(path);
      return buffer.toString('base64');
    };

    // 4 actual screenshots with image data
    const actualScreenshots = [
      {
        id: 'screenshot-1-motoring-coffee',
        bucketId: 'travel',
        url: '',
        imageBase64: readScreenshot('screenshot_1.png'),
        metadata: {
          filename: 'screenshot_1.png',
          size: readFileSync(join(__dirname, '../test-data/screenshots/screenshot_1.png')).length,
          contentType: 'image/png',
          uploadedAt: new Date()
        },
        intent: {
          primary_bucket: 'travel',
          bucket_candidates: [{ bucket: 'travel', confidence: 0.95 }],
          confidence: 0.95,
          rationale: 'Instagram post about Motoring Coffee in West Los Angeles'
        },
        extractedData: {
          places: ['Motoring Coffee', 'West Los Angeles'],
          entities: ['Motoring Coffee', 'West Los Angeles', 'allygranmin'],
          ocrText: 'MOTORING COFFEE | West Los Angeles. Whether you\'re into cars, or not, this space is undeniably cool.',
          location: {
            name: 'Motoring Coffee',
            address: '11728 W Olympic Blvd, Los Angeles, CA 90064',
            coordinates: { lat: 34.0336194, lng: -118.4483459 },
            placeId: 'ChIJxxx_MotorCoffee_Demo',
            googleMapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJxxx_MotorCoffee_Demo'
          }
        },
        status: 'completed',
        processedAt: new Date()
      },
      {
        id: 'screenshot-2-yellow-vase',
        bucketId: 'travel',
        url: '',
        imageBase64: readScreenshot('screenshot_2.png'),
        metadata: {
          filename: 'screenshot_2.png',
          size: readFileSync(join(__dirname, '../test-data/screenshots/screenshot_2.png')).length,
          contentType: 'image/png',
          uploadedAt: new Date()
        },
        intent: {
          primary_bucket: 'travel',
          bucket_candidates: [{ bucket: 'travel', confidence: 0.93 }],
          confidence: 0.93,
          rationale: 'Instagram post about Yellow Vase in Palos Verdes, part of unique LA places list'
        },
        extractedData: {
          places: ['Yellow Vase', 'Palos Verdes', 'Los Angeles'],
          entities: ['Yellow Vase', 'Palos Verdes', 'sitsolanges'],
          ocrText: '9 free and most unique places to visit in Los Angeles! 2025 list! 2. Yellow Vase Palos Verdes',
          location: {
            name: 'Yellow Vase Palos Verdes',
            address: 'Palos Verdes, CA 90274',
            coordinates: { lat: 33.7444, lng: -118.3870 },
            placeId: 'ChIJxxx_YellowVase_Demo',
            googleMapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJxxx_YellowVase_Demo'
          }
        },
        status: 'completed',
        processedAt: new Date()
      },
      {
        id: 'screenshot-3-comet-over-delphi',
        bucketId: 'travel',
        url: '',
        imageBase64: readScreenshot('screenshot_3.png'),
        metadata: {
          filename: 'screenshot_3.png',
          size: readFileSync(join(__dirname, '../test-data/screenshots/screenshot_3.png')).length,
          contentType: 'image/png',
          uploadedAt: new Date()
        },
        intent: {
          primary_bucket: 'travel',
          bucket_candidates: [{ bucket: 'travel', confidence: 0.94 }],
          confidence: 0.94,
          rationale: 'Instagram post about Comet Over Delphi cafe in Highland Park'
        },
        extractedData: {
          places: ['Comet Over Delphi', 'Highland Park', 'Los Angeles'],
          entities: ['Comet Over Delphi', 'Highland Park', 'lilyestherxo'],
          ocrText: 'Comet Over Delphi. The most aesthetic cafe in Highland Park with cool vibes, hang outs.',
          location: {
            name: 'Comet Over Delphi',
            address: '5626 N Figueroa St, Los Angeles, CA 90042',
            coordinates: { lat: 34.1191, lng: -118.1873 },
            placeId: 'ChIJxxx_CometOverDelphi_Demo',
            googleMapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJxxx_CometOverDelphi_Demo'
          }
        },
        status: 'completed',
        processedAt: new Date()
      },
      {
        id: 'screenshot-4-la-attractions',
        bucketId: 'travel',
        url: '',
        imageBase64: readScreenshot('screenshot_4.png'),
        metadata: {
          filename: 'screenshot_4.png',
          size: readFileSync(join(__dirname, '../test-data/screenshots/screenshot_4.png')).length,
          contentType: 'image/png',
          uploadedAt: new Date()
        },
        intent: {
          primary_bucket: 'travel',
          bucket_candidates: [{ bucket: 'travel', confidence: 0.96 }],
          confidence: 0.96,
          rationale: 'Instagram post listing 10 places to visit in Los Angeles area'
        },
        extractedData: {
          places: [
            'Griffith Observatory',
            'Point Dume',
            'Greystone Mansion',
            'Rancho Palos Verdes',
            'Santa Monica Pier',
            'Elysian Park',
            'Dana Point',
            'Laguna Beach',
            'The Queen Mary Long Beach',
            'Corona Del Mar'
          ],
          entities: ['Los Angeles', 'Malibu', 'Long Beach', 'Laguna Beach', 'olinaways'],
          ocrText: 'Where would you go first? The Los Angeles area is vast, and I included some incredible spots in Malibu, Long Beach, Laguna Beach and Beverly Hills — cities within an hour\'s drive.',
          location: {
            name: 'Elysian Park',
            address: 'Elysian Park, Los Angeles, CA 90012',
            coordinates: { lat: 34.0780, lng: -118.2398 },
            placeId: 'ChIJxxx_ElysianPark_Demo',
            googleMapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJxxx_ElysianPark_Demo'
          }
        },
        status: 'completed',
        processedAt: new Date()
      }
    ];

    // 15 coffee shops as filler data for map view (no image data)
    const fillerLocations = [
      {
        id: 'motoring-coffee',
        bucketId: 'travel',
        url: '',
        metadata: {
          filename: 'motoring_coffee.jpg',
          size: 0,
          contentType: 'image/jpeg',
          uploadedAt: new Date()
        },
        intent: {
          primary_bucket: 'travel',
          bucket_candidates: [{ bucket: 'travel', confidence: 0.95 }],
          confidence: 0.95,
          rationale: 'Coffee shop location in Los Angeles'
        },
        extractedData: {
          places: ['Motoring Coffee'],
          entities: ['Motoring Coffee', 'Los Angeles', 'Sawtelle'],
          location: {
            name: 'Motoring Coffee',
            address: '11728 W Olympic Blvd, Los Angeles, CA 90064',
            coordinates: { lat: 34.0336194, lng: -118.4483459 },
            placeId: 'ChIJxxx_MotorCoffee_Demo',
            googleMapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJxxx_MotorCoffee_Demo'
          }
        },
        status: 'completed',
        processedAt: new Date()
      },
      {
        id: 'coffee-tomo',
        bucketId: 'travel',
        url: '',
        metadata: {
          filename: 'coffee_tomo.jpg',
          size: 0,
          contentType: 'image/jpeg',
          uploadedAt: new Date()
        },
        intent: {
          primary_bucket: 'travel',
          bucket_candidates: [{ bucket: 'travel', confidence: 0.93 }],
          confidence: 0.93,
          rationale: 'Coffee shop location in Los Angeles'
        },
        extractedData: {
          places: ['Coffee Tomo'],
          entities: ['Coffee Tomo', 'Sawtelle', 'Los Angeles'],
          location: {
            name: 'Coffee Tomo',
            address: '11309 Mississippi Ave, Los Angeles, CA 90025',
            coordinates: { lat: 34.0343, lng: -118.4472 },
            placeId: 'ChIJxxx_CoffeeTomo_Demo',
            googleMapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJxxx_CoffeeTomo_Demo'
          }
        },
        status: 'completed',
        processedAt: new Date()
      },
      {
        id: '10-speed-coffee',
        bucketId: 'travel',
        url: '',
        metadata: {
          filename: '10_speed_coffee.jpg',
          size: 0,
          contentType: 'image/jpeg',
          uploadedAt: new Date()
        },
        intent: {
          primary_bucket: 'travel',
          bucket_candidates: [{ bucket: 'travel', confidence: 0.92 }],
          confidence: 0.92,
          rationale: 'Coffee shop location in Los Angeles'
        },
        extractedData: {
          places: ['10 Speed Coffee'],
          entities: ['10 Speed Coffee', 'Sawtelle', 'Los Angeles'],
          location: {
            name: '10 Speed Coffee',
            address: '1947 Sawtelle Blvd, Los Angeles, CA 90025',
            coordinates: { lat: 34.0454, lng: -118.4481 },
            placeId: 'ChIJxxx_10SpeedCoffee_Demo',
            googleMapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJxxx_10SpeedCoffee_Demo'
          }
        },
        status: 'completed',
        processedAt: new Date()
      },
      {
        id: 'chitchat-coffee',
        bucketId: 'travel',
        url: '',
        metadata: {
          filename: 'chitchat_coffee.jpg',
          size: 0,
          contentType: 'image/jpeg',
          uploadedAt: new Date()
        },
        intent: {
          primary_bucket: 'travel',
          bucket_candidates: [{ bucket: 'travel', confidence: 0.91 }],
          confidence: 0.91,
          rationale: 'Coffee shop location in Los Angeles'
        },
        extractedData: {
          places: ['ChitChat Coffee and Matcha'],
          entities: ['ChitChat Coffee', 'Matcha', 'Sawtelle', 'Los Angeles'],
          location: {
            name: 'ChitChat Coffee and Matcha',
            address: '1854 Sawtelle Blvd, Los Angeles, CA 90025',
            coordinates: { lat: 34.0468, lng: -118.4479 },
            placeId: 'ChIJxxx_ChitChatCoffee_Demo',
            googleMapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJxxx_ChitChatCoffee_Demo'
          }
        },
        status: 'completed',
        processedAt: new Date()
      },
      {
        id: 'caffe-luxxe-brentwood',
        bucketId: 'travel',
        url: '',
        metadata: {
          filename: 'caffe_luxxe.jpg',
          size: 0,
          contentType: 'image/jpeg',
          uploadedAt: new Date()
        },
        intent: {
          primary_bucket: 'travel',
          bucket_candidates: [{ bucket: 'travel', confidence: 0.94 }],
          confidence: 0.94,
          rationale: 'Coffee shop location in Los Angeles'
        },
        extractedData: {
          places: ['Caffe Luxxe'],
          entities: ['Caffe Luxxe', 'Brentwood', 'Los Angeles'],
          location: {
            name: 'Caffe Luxxe - Brentwood',
            address: '11640 San Vicente Blvd, Los Angeles, CA 90049',
            coordinates: { lat: 34.0519, lng: -118.4626 },
            placeId: 'ChIJxxx_CaffeLuxxe_Demo',
            googleMapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJxxx_CaffeLuxxe_Demo'
          }
        },
        status: 'completed',
        processedAt: new Date()
      },
      {
        id: 'coral-tree-cafe',
        bucketId: 'travel',
        url: '',
        metadata: {
          filename: 'coral_tree_cafe.jpg',
          size: 0,
          contentType: 'image/jpeg',
          uploadedAt: new Date()
        },
        intent: {
          primary_bucket: 'travel',
          bucket_candidates: [{ bucket: 'travel', confidence: 0.90 }],
          confidence: 0.90,
          rationale: 'Coffee shop location in Los Angeles'
        },
        extractedData: {
          places: ['Coral Tree Cafe'],
          entities: ['Coral Tree Cafe', 'Brentwood', 'Los Angeles'],
          location: {
            name: 'Coral Tree Cafe',
            address: '11645 San Vicente Blvd, Los Angeles, CA 90049',
            coordinates: { lat: 34.0518, lng: -118.4628 },
            placeId: 'ChIJxxx_CoralTreeCafe_Demo',
            googleMapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJxxx_CoralTreeCafe_Demo'
          }
        },
        status: 'completed',
        processedAt: new Date()
      },
      {
        id: 'literati-cafe',
        bucketId: 'travel',
        url: '',
        metadata: {
          filename: 'literati_cafe.jpg',
          size: 0,
          contentType: 'image/jpeg',
          uploadedAt: new Date()
        },
        intent: {
          primary_bucket: 'travel',
          bucket_candidates: [{ bucket: 'travel', confidence: 0.89 }],
          confidence: 0.89,
          rationale: 'Coffee shop location in Los Angeles'
        },
        extractedData: {
          places: ['Literati Cafe'],
          entities: ['Literati Cafe', 'West LA', 'Los Angeles'],
          location: {
            name: 'Literati Cafe',
            address: '12081 Wilshire Blvd, Los Angeles, CA 90025',
            coordinates: { lat: 34.0489, lng: -118.4511 },
            placeId: 'ChIJxxx_LiteratiCafe_Demo',
            googleMapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJxxx_LiteratiCafe_Demo'
          }
        },
        status: 'completed',
        processedAt: new Date()
      },
      {
        id: 'alfred-coffee',
        bucketId: 'travel',
        url: '',
        metadata: {
          filename: 'alfred_coffee.jpg',
          size: 0,
          contentType: 'image/jpeg',
          uploadedAt: new Date()
        },
        intent: {
          primary_bucket: 'travel',
          bucket_candidates: [{ bucket: 'travel', confidence: 0.93 }],
          confidence: 0.93,
          rationale: 'Coffee shop location in Los Angeles'
        },
        extractedData: {
          places: ['Alfred Coffee'],
          entities: ['Alfred Coffee', 'West LA', 'Los Angeles'],
          location: {
            name: 'Alfred Coffee - Sawtelle',
            address: '2011 Sawtelle Blvd, Los Angeles, CA 90025',
            coordinates: { lat: 34.0441, lng: -118.4476 },
            placeId: 'ChIJxxx_AlfredCoffee_Demo',
            googleMapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJxxx_AlfredCoffee_Demo'
          }
        },
        status: 'completed',
        processedAt: new Date()
      },
      {
        id: 'bluebottle-coffee',
        bucketId: 'travel',
        url: '',
        metadata: {
          filename: 'bluebottle_coffee.jpg',
          size: 0,
          contentType: 'image/jpeg',
          uploadedAt: new Date()
        },
        intent: {
          primary_bucket: 'travel',
          bucket_candidates: [{ bucket: 'travel', confidence: 0.95 }],
          confidence: 0.95,
          rationale: 'Coffee shop location in Los Angeles'
        },
        extractedData: {
          places: ['Blue Bottle Coffee'],
          entities: ['Blue Bottle Coffee', 'Santa Monica', 'Los Angeles'],
          location: {
            name: 'Blue Bottle Coffee - Santa Monica',
            address: '1416 Montana Ave, Santa Monica, CA 90403',
            coordinates: { lat: 34.0357, lng: -118.4959 },
            placeId: 'ChIJxxx_BlueBottle_Demo',
            googleMapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJxxx_BlueBottle_Demo'
          }
        },
        status: 'completed',
        processedAt: new Date()
      },
      {
        id: 'verve-coffee',
        bucketId: 'travel',
        url: '',
        metadata: {
          filename: 'verve_coffee.jpg',
          size: 0,
          contentType: 'image/jpeg',
          uploadedAt: new Date()
        },
        intent: {
          primary_bucket: 'travel',
          bucket_candidates: [{ bucket: 'travel', confidence: 0.92 }],
          confidence: 0.92,
          rationale: 'Coffee shop location in Los Angeles'
        },
        extractedData: {
          places: ['Verve Coffee Roasters'],
          entities: ['Verve Coffee', 'Santa Monica', 'Los Angeles'],
          location: {
            name: 'Verve Coffee Roasters - Santa Monica',
            address: '1407 Montana Ave, Santa Monica, CA 90403',
            coordinates: { lat: 34.0356, lng: -118.4957 },
            placeId: 'ChIJxxx_VerveCoffee_Demo',
            googleMapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJxxx_VerveCoffee_Demo'
          }
        },
        status: 'completed',
        processedAt: new Date()
      },
      {
        id: 'republique',
        bucketId: 'travel',
        url: '',
        metadata: {
          filename: 'republique.jpg',
          size: 0,
          contentType: 'image/jpeg',
          uploadedAt: new Date()
        },
        intent: {
          primary_bucket: 'travel',
          bucket_candidates: [{ bucket: 'travel', confidence: 0.88 }],
          confidence: 0.88,
          rationale: 'Coffee shop location in Los Angeles'
        },
        extractedData: {
          places: ['République'],
          entities: ['République', 'La Brea', 'Los Angeles'],
          location: {
            name: 'République',
            address: '624 S La Brea Ave, Los Angeles, CA 90036',
            coordinates: { lat: 34.0716, lng: -118.3445 },
            placeId: 'ChIJxxx_Republique_Demo',
            googleMapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJxxx_Republique_Demo'
          }
        },
        status: 'completed',
        processedAt: new Date()
      },
      {
        id: 'intelligentsia-coffee',
        bucketId: 'travel',
        url: '',
        metadata: {
          filename: 'intelligentsia_coffee.jpg',
          size: 0,
          contentType: 'image/jpeg',
          uploadedAt: new Date()
        },
        intent: {
          primary_bucket: 'travel',
          bucket_candidates: [{ bucket: 'travel', confidence: 0.94 }],
          confidence: 0.94,
          rationale: 'Coffee shop location in Los Angeles'
        },
        extractedData: {
          places: ['Intelligentsia Coffee'],
          entities: ['Intelligentsia Coffee', 'Venice', 'Los Angeles'],
          location: {
            name: 'Intelligentsia Coffee - Venice',
            address: '1331 Abbot Kinney Blvd, Venice, CA 90291',
            coordinates: { lat: 33.9951, lng: -118.4659 },
            placeId: 'ChIJxxx_Intelligentsia_Demo',
            googleMapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJxxx_Intelligentsia_Demo'
          }
        },
        status: 'completed',
        processedAt: new Date()
      },
      {
        id: 'menotti-coffee-stop',
        bucketId: 'travel',
        url: '',
        metadata: {
          filename: 'menotti_coffee.jpg',
          size: 0,
          contentType: 'image/jpeg',
          uploadedAt: new Date()
        },
        intent: {
          primary_bucket: 'travel',
          bucket_candidates: [{ bucket: 'travel', confidence: 0.91 }],
          confidence: 0.91,
          rationale: 'Coffee shop location in Los Angeles'
        },
        extractedData: {
          places: ['Menotti\'s Coffee Stop'],
          entities: ['Menotti\'s Coffee', 'Venice', 'Los Angeles'],
          location: {
            name: 'Menotti\'s Coffee Stop',
            address: '56 Windward Ave, Venice, CA 90291',
            coordinates: { lat: 33.9829, lng: -118.4732 },
            placeId: 'ChIJxxx_MenottiCoffee_Demo',
            googleMapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJxxx_MenottiCoffee_Demo'
          }
        },
        status: 'completed',
        processedAt: new Date()
      },
      {
        id: 'groundwork-coffee',
        bucketId: 'travel',
        url: '',
        metadata: {
          filename: 'groundwork_coffee.jpg',
          size: 0,
          contentType: 'image/jpeg',
          uploadedAt: new Date()
        },
        intent: {
          primary_bucket: 'travel',
          bucket_candidates: [{ bucket: 'travel', confidence: 0.90 }],
          confidence: 0.90,
          rationale: 'Coffee shop location in Los Angeles'
        },
        extractedData: {
          places: ['Groundwork Coffee'],
          entities: ['Groundwork Coffee', 'Venice', 'Los Angeles'],
          location: {
            name: 'Groundwork Coffee - Venice',
            address: '671 Rose Ave, Venice, CA 90291',
            coordinates: { lat: 33.9909, lng: -118.4731 },
            placeId: 'ChIJxxx_GroundworkCoffee_Demo',
            googleMapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJxxx_GroundworkCoffee_Demo'
          }
        },
        status: 'completed',
        processedAt: new Date()
      },
      {
        id: 'go-get-em-tiger',
        bucketId: 'travel',
        url: '',
        metadata: {
          filename: 'go_get_em_tiger.jpg',
          size: 0,
          contentType: 'image/jpeg',
          uploadedAt: new Date()
        },
        intent: {
          primary_bucket: 'travel',
          bucket_candidates: [{ bucket: 'travel', confidence: 0.93 }],
          confidence: 0.93,
          rationale: 'Coffee shop location in Los Angeles'
        },
        extractedData: {
          places: ['Go Get Em Tiger'],
          entities: ['Go Get Em Tiger', 'Larchmont', 'Los Angeles'],
          location: {
            name: 'Go Get Em Tiger - Larchmont',
            address: '230 N Larchmont Blvd, Los Angeles, CA 90004',
            coordinates: { lat: 34.0753, lng: -118.3234 },
            placeId: 'ChIJxxx_GoGetEmTiger_Demo',
            googleMapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJxxx_GoGetEmTiger_Demo'
          }
        },
        status: 'completed',
        processedAt: new Date()
      }
    ];

    // Insert actual screenshots first
    const screenshotResult = await imagesCollection.insertMany(actualScreenshots);
    console.log(`✅ Inserted ${screenshotResult.insertedCount} actual screenshots with images`);

    // Insert filler locations for map
    const fillerResult = await imagesCollection.insertMany(fillerLocations);
    console.log(`✅ Inserted ${fillerResult.insertedCount} filler locations for map view`);

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

seedDatabase();
