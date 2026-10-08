import { NextResponse } from 'next/server';
import { Error as MongooseError } from 'mongoose';

export class RequestError extends Error {
    constructor(message: string, public status = 400) {
        super(message);
    }
}

export function apiError(error: unknown, fallbackMessage: string) {
    if (error instanceof RequestError) {
        return NextResponse.json({ message: error.message }, { status: error.status });
    }
    if (error instanceof MongooseError.ValidationError) {
        const message = Object.values(error.errors).map((issue) => issue.message).join(' ');
        return NextResponse.json({ message }, { status: 400 });
    }
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
        return NextResponse.json({ message: 'An event with this title already exists.' }, { status: 409 });
    }
    if (error instanceof Error && error.message.startsWith('MONGODB_URI is not configured')) {
        return NextResponse.json({ message: 'Saving is unavailable until MongoDB is configured.' }, { status: 503 });
    }
    if (error instanceof Error && (error.name === 'MongooseServerSelectionError' || error.name === 'MongoServerSelectionError')) {
        return NextResponse.json({ message: 'The database is currently unavailable. Please try again later.' }, { status: 503 });
    }
    console.error(fallbackMessage, error);
    return NextResponse.json({ message: fallbackMessage }, { status: 500 });
}
