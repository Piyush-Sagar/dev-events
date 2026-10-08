'use server';

import { Booking } from "@/database";
import connectDB from "@/lib/mongodb";
import { Error as MongooseError, isObjectIdOrHexString } from 'mongoose';
import { revalidatePath, updateTag } from 'next/cache';

const createBooking = async ({eventId,slug,email}:{eventId: string, slug: string, email: string}) => {
    try {
        if (!isObjectIdOrHexString(eventId)) {
            return { success: false, message: 'This event is not available for booking.' };
        }
        if (typeof email !== 'string' || !email.trim()) {
            return { success: false, message: 'Please provide a valid email address.' };
        }
        await connectDB();
        await Booking.create({ eventId, email: email.trim().toLowerCase() });
        updateTag('events');
        revalidatePath(`/events/${slug}`);
        return { success: true, message: 'Booking created successfully' };
    } catch (error) {
        if (error instanceof MongooseError.ValidationError) {
            return { success: false, message: 'Please check your email address and event.' };
        }
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
            return { success: false, message: 'You have already booked this event with that email address.' };
        }
        console.error('Error creating booking:', error);
        return { success: false, message: 'Booking is currently unavailable. Please try again later.' };
    }
}

export default createBooking;
