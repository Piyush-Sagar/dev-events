import {NextRequest, NextResponse} from "next/server";
import { v2 as cloudinary } from 'cloudinary';
import { revalidatePath, revalidateTag } from 'next/cache';

import connectDB from "@/lib/mongodb";
import Event from '@/database/event.model';

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const formData = await req.formData();

        const event = Object.fromEntries(formData.entries());

        const file = formData.get('image') as File;

        if(!file) return NextResponse.json({ message: 'Image file is required'}, { status: 400 })

        let tags: string[];
        let agenda: string[];

        try {
            tags = JSON.parse(formData.get('tags') as string);
            agenda = JSON.parse(formData.get('agenda') as string);

            if (!Array.isArray(tags) || !Array.isArray(agenda)) throw new Error();
        } catch {
            return NextResponse.json({ message: "Invalid JSON format for 'tags' or 'agenda' field"}, { status: 400 })
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({ resource_type: 'image', folder: 'DevEvent' }, (error, results) => {
                if(error) return reject(error);

                resolve(results);
            }).end(buffer);
        });

        event.image = (uploadResult as { secure_url: string }).secure_url;

        const createdEvent = await Event.create({
            ...event,
            tags: tags,
            agenda: agenda,
        });

        revalidatePath('/', 'layout');
        revalidateTag('events', 'max');

        return NextResponse.json({ message: 'Event created successfully', event: createdEvent }, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Event Creation Failed', error: e instanceof Error ? e.message : 'Unknown'}, { status: 500 })
    }
}

export async function GET() {
    try {
        await connectDB();

        const events = await Event.find().sort({ createdAt: -1 });

        return NextResponse.json({ message: 'Events fetched successfully', events }, { status: 200 });
    } catch (error) {
        console.error('Error fetching events:', error);

        // Handle specific database connection errors
        if (error instanceof Error) {
          if (error.message.includes('Unable to connect to MongoDB') || error.message.includes('ECONNREFUSED') || error.message.includes('querySrv')) {
            return NextResponse.json(
              { message: 'Database connection failed. Please check your MongoDB Atlas connection.', error: error.message },
              { status: 503 }
            );
          }
          if (error.message.includes('authentication failed') || error.message.includes('auth failed')) {
            return NextResponse.json(
              { message: 'Database authentication failed. Please check your credentials.', error: error.message },
              { status: 503 }
            );
          }
        }

        return NextResponse.json({ message: 'Event fetching failed', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}