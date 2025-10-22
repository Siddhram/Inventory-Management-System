// Server-side Cloudinary SDK configuration
import { v2 as cloudinary } from "cloudinary";

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  // Don't throw at import time in case client-only pages import types; API route will validate before use
  // But we still configure with empty strings to avoid runtime undefineds
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME || "",
  api_key: CLOUDINARY_API_KEY || "",
  api_secret: CLOUDINARY_API_SECRET || "",
  secure: true,
});

export { cloudinary };
