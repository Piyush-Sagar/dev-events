import { existsSync } from 'node:fs';
import mongoose from 'mongoose';
import Event from '@/database/event.model';
import { fallbackEvents } from '@/lib/constants';
import connectDB from '@/lib/mongodb';

// Keep externally supplied variables; local settings take precedence over .env.
for (const path of ['.env.local', '.env']) {
    if (existsSync(path)) process.loadEnvFile(path);
}

async function seedDatabase() {
    try {
        await connectDB();
        let inserted = 0;
        for (const sample of fallbackEvents) {
            const result = await Event.updateOne(
                { slug: sample.slug },
                { $setOnInsert: { ...sample, createdAt: new Date(), updatedAt: new Date() } },
                { upsert: true, runValidators: true, timestamps: false },
            );
            inserted += result.upsertedCount;
        }
        console.log(`Added ${inserted} sample events. Existing events and bookings were preserved.`);
    } catch (error) {
        console.error('Unable to seed the database:', error instanceof Error ? error.message : error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

void seedDatabase();
