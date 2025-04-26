import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from '@env';
import CryptoJS from 'crypto-js';

// Cloudinary configuration object
export const cloudinaryConfig = {
  cloudName: CLOUDINARY_CLOUD_NAME,
  apiKey: CLOUDINARY_API_KEY,
  apiSecret: CLOUDINARY_API_SECRET,
  secure: true
};

// Function to generate signature for upload
export const generateSignature = (params) => {
  const timestamp = Math.round((new Date).getTime() / 1000);
  
  // Create the string to sign
  const toSign = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  // Generate the signature using crypto-js (you'll need to install this package)
  const signature = CryptoJS.SHA1(toSign + CLOUDINARY_API_SECRET).toString();
  
  return {
    signature,
    timestamp
  };
};

// Function to upload media to Cloudinary
export const uploadToCloudinary = async (uri, type = 'image') => {
  try {
    // Handle empty URI case for text-only posts
    if (!uri || uri === '') {
      return {
        url: '',
        publicId: '',
        resourceType: 'text'
      };
    }

    const formData = new FormData();
    
    // Prepare the file
    const filename = uri.split('/').pop();
    const match = /\.([\w\d]+)$/.exec(filename);
    const ext = match?.[1] || 'jpg'; // Default to jpg if extension can't be determined
    
    formData.append('file', {
      uri,
      name: `${Date.now()}.${ext}`,
      type: `${type}/${ext}`
    });
    
    // Add upload preset (create this in your Cloudinary dashboard)
    formData.append('upload_preset', 'connect_app_preset');
    
    // Set timeout for fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    // Upload to Cloudinary with retry logic
    let retries = 3;
    let response;
    
    while (retries > 0) {
      try {
        response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${type}/upload`,
          {
            method: 'POST',
            body: formData,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'multipart/form-data'
            },
            signal: controller.signal
          }
        );
        break; // If successful, exit the retry loop
      } catch (fetchError) {
        retries--;
        if (retries === 0) throw fetchError;
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, (3 - retries) * 1000));
      }
    }
    
    clearTimeout(timeoutId);
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    return {
      url: data.secure_url,
      publicId: data.public_id,
      resourceType: data.resource_type
    };
    
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

// Function to delete media from Cloudinary
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const timestamp = Math.round((new Date).getTime() / 1000);
    const signature = generateSignature({
      public_id: publicId,
      timestamp
    }).signature;
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/destroy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          public_id: publicId,
          signature,
          api_key: CLOUDINARY_API_KEY,
          timestamp
        })
      }
    );
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    return data;
    
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};