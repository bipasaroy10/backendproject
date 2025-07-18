import {v2 as cloudinary} from "cloudinary" 
import { log } from "console";
import fs, { unlinkSync } from "fs"

 cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret:process.env.CLOUDINARY_API_SECRET 
    });


   const uploadOnCloudinary = async(localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload
        (localFilePath,{
            resource_type: "auto"
        })
        // console.log("file is uploaded on cloudinary", response.url);
        
        fs.unlinkSync(localFilePath)
        return response; //we have to return the response otherwise it so null

    }catch(error){
        fs.unlinkSync(localFilePath)//removed the locally saved temporary file as the upload operation failed
        return null;

       }
   }

   export{uploadOnCloudinary}