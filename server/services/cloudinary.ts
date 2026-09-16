import { v2 as cloudinary } from 'cloudinary';

let isCloudinaryConfigured = false;

// Configured securely with lazy validation on startup
const CLOUDINARY_URL = process.env.CLOUDINARY_URL;
if (CLOUDINARY_URL) {
  try {
    cloudinary.config({
      secure: true
    });
    isCloudinaryConfigured = true;
  } catch (err) {
    console.error("⚠️ Failed to initialize Cloudinary SDK configuration:", err);
  }
}

/**
 * Uploads shopkeeper invoices or company logo assets safely.
 * Returns public secure CDN url paths.
 */
export async function uploadAsset(base64Data: string, folder: string = 'leadgerx'): Promise<string> {
  if (!isCloudinaryConfigured) {
    // If Cloudinary is not configured, preserve the image data URL directly so assets display properly in the UI
    if (base64Data.startsWith('data:image/')) {
      return base64Data;
    }
    return `data:image/png;base64,${base64Data}`;
  }

  try {
    const uploadResult = await cloudinary.uploader.upload(base64Data, {
      folder,
      resource_type: 'auto',
      overwrite: true,
      quality: 'auto:eco'
    });
    return uploadResult.secure_url;
  } catch (error) {
    console.error('💥 Cloudinary upload failure:', error);
    throw new Error('Asset registration failed at hosting provider.');
  }
}
