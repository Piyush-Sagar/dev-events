import { v2 as cloudinary } from 'cloudinary';
import { RequestError } from '@/lib/api-errors';

export async function uploadEventImage(file: File): Promise<string> {
    const config = cloudinary.config();
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
        throw new RequestError('Image uploads are unavailable until Cloudinary is configured.', 503);
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            { resource_type: 'image', folder: 'DevEvent' },
            (error, result) => {
                if (error || !result?.secure_url) {
                    console.error('Image upload failed:', error);
                    reject(new RequestError('Image upload failed. Please try again.', 502));
                    return;
                }
                resolve(result.secure_url);
            },
        ).end(buffer);
    });
}
