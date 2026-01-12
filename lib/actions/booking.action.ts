'use server';

import { Booking } from "@/database";
import connectDB from "@/lib/mongodb";

const createBooking = async ({eventId,slug,email}:{eventId: string, slug: string, email: string}) => {
    try {
        await connectDB();
        await Booking.create({ eventId, slug, email })
        return { success: true, message: 'Booking created successfully' };
    } catch (error) {
        console.error("Error creating booking:", error);
        return { success: false, message: 'Failed to create booking'};
    }
}

export default createBooking;