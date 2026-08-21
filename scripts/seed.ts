import { config } from 'dotenv';
import Event, { IEvent } from '@/database/event.model';
import { fallbackEvents } from '@/lib/constants';
import connectDB from '@/lib/mongodb';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

async function seedDatabase() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in environment variables');
    console.log('Please check your .env.local or .env file');
    process.exit(1);
  }

  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Clear existing events (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing events...');
    await Event.deleteMany({});
    console.log('✅ Cleared existing events');

    // Transform fallbackEvents to match the database schema (remove createdAt/updatedAt as they're auto-generated)
    const eventsToSeed = fallbackEvents.map(({ createdAt, updatedAt, ...event }) => event) as Omit<IEvent, 'createdAt' | 'updatedAt'>[];

    console.log(`🌱 Seeding ${eventsToSeed.length} events...`);

    const insertedEvents = await Event.insertMany(eventsToSeed);

    console.log(`✅ Successfully seeded ${insertedEvents.length} events:`);
    insertedEvents.forEach((event) => {
      console.log(`   - ${event.title} (${event.slug})`);
    });

    console.log('\n🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the seeder
seedDatabase();