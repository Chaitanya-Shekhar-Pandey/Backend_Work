import { v2 as cloudinary } from "cloudinary";
import fs from FileSystem

cloudinary.config({ 
        cloud_name: process.env.CLOUD_NAME, 
        api_key: process.env.CLOUD_API_KEY, 
        api_secret: process.env.CLOUD_API_SECRET,
    });

const fileupload = async(localpath)=>{
    try {
        if(!localpath) return null
        const filedata = await cloudinary.uploader.upload(localpath , {
            resource_type : "auto"
        })

        // console.log("File Uploaded Successfully" , filedata.url) --> FOR TESTING PURPOSES
        fs.unlinkSync(localpath)
        return filedata
        
    } catch (error) {
        fs.unlinkSync(localpath)
        return null
    }
}

export {fileupload}