import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret:process.env.CLOUDINARY_API_SECRET
});


const uplodOnCloudinary = async (localFilePath) => {
    try {

        if(!localFilePath) return;

        //uplod the file in cloudinary 
        const reponse = await cloudinary.uploader.upload(localFilePath,{
            resource_type : "auto",
        })

        //file has been uploded successfully
        //console.log("File Is Uploded On Cloudinary : ",reponse.url);

        fs.unlinkSync(localFilePath);
        return reponse ;
    } catch (error) {
        fs.unlinkSync(localFilePath); // remoce the localy saved temp file as the uploded got failed
        return null;
    }
};


export {uplodOnCloudinary}