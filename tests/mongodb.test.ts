import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';

test('connection reads configuration at call time and shares concurrent attempts', async () => {
    const previousUri = process.env.MONGODB_URI;
    const connect = mock.method(mongoose, 'connect', async () => mongoose);
    try {
        delete process.env.MONGODB_URI;
        await assert.rejects(connectDB(), /MONGODB_URI is not configured/);
        process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/regression';
        await Promise.all([connectDB(), connectDB()]);
        assert.equal(connect.mock.callCount(), 1);
        assert.equal(connect.mock.calls[0].arguments[0], process.env.MONGODB_URI);
        // A disconnected connection must not reuse a previously settled promise.
        await connectDB();
        assert.equal(connect.mock.callCount(), 2);
    } finally {
        connect.mock.restore();
        if (previousUri === undefined) delete process.env.MONGODB_URI;
        else process.env.MONGODB_URI = previousUri;
    }
});

test('a failed connection attempt can be retried', async () => {
    const previousUri = process.env.MONGODB_URI;
    let attempts = 0;
    const connect = mock.method(mongoose, 'connect', async () => {
        if (++attempts === 1) throw new Error('unavailable');
        return mongoose;
    });
    try {
        process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/regression';
        await assert.rejects(connectDB(), /unavailable/);
        await connectDB();
        assert.equal(connect.mock.callCount(), 2);
    } finally {
        connect.mock.restore();
        if (previousUri === undefined) delete process.env.MONGODB_URI;
        else process.env.MONGODB_URI = previousUri;
    }
});
