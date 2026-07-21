import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary (only runs on server)
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

// Upload image to Cloudinary
export async function uploadImage(
  file: Buffer | string,
  options?: {
    folder?: string;
    publicId?: string;
    mediaType?: string;
    transformation?: object;
    deliveryType?: "upload" | "authenticated";
  }
): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(
    typeof file === "string" ? file : `data:${options?.mediaType || "image/jpeg"};base64,${file.toString("base64")}`,
    {
      folder: options?.folder || "xilar/products",
      public_id: options?.publicId,
      transformation: options?.transformation,
      resource_type: "image",
      type: options?.deliveryType || "upload",
    }
  );

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

export function getAuthenticatedImageUrl(publicId: string) {
  return cloudinary.url(publicId, {
    type: "authenticated",
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 10 * 60,
    secure: true,
  });
}

// Delete image from Cloudinary
export async function deleteImage(publicId: string, deliveryType: "upload" | "authenticated" = "upload"): Promise<boolean> {
  const result = await cloudinary.uploader.destroy(publicId, { type: deliveryType });
  return result.result === "ok";
}

// Generate optimized URL with transformations
export function getOptimizedUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
    format?: string;
  }
): string {
  return cloudinary.url(publicId, {
    transformation: [
      {
        width: options?.width,
        height: options?.height,
        crop: options?.crop || "fill",
        quality: options?.quality || "auto",
        format: options?.format || "auto",
      },
    ],
  });
}

// Get image URL - handles both local (dev) and Cloudinary (prod)
export function getImageUrl(imagePath: string): string {
  // If it's already a full URL (Cloudinary), return as-is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // In development, use local images
  if (process.env.NODE_ENV === "development") {
    return imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  }

  // In production, construct Cloudinary URL
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    // Fallback to local if Cloudinary not configured
    return imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  }

  // Extract filename without extension for public_id
  const publicId = `xilar/products/${imagePath.replace(/^\/?(clothes\/)?/, "").replace(/\.[^.]+$/, "")}`;
  
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${publicId}`;
}
