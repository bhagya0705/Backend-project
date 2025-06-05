import {v2 as cloudinary} from 'cloudinary';
import dotenv from "dotenv";
dotenv.config();
import fs from 'fs';

cloudinary.config({ 
        cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
        api_key:process.env.CLOUDINARY_API_KEY,
        api_secret:process.env.CLOUDINARY_API_SECRET
    });

const uploadonCloudinary = async (filePath) => {
     try {
        const response = await cloudinary.uploader.upload(filePath, {
            resource_type: 'auto'
        });
        console.log('File uploaded successfully :', response.url);
        return response;
        
    } catch (error) {
        fs.unlinkSync(filePath);
        console.error('Error uploading to Cloudinary:', error);
        throw error;
        return null;
    }
}

export { uploadonCloudinary };