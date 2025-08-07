import { asynchandler } from "../utils/asynchandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import { fileupload } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const register_user = asynchandler(async(req,res)=>{
    // Get all the user details 
    // Validate if the details are proper or not (All Values are inserted as required and if the values are valid)
    // Check if the user already exist :-> username , email
    // Check for images and avatars
    // Upload the image on Cloudinary :-> Cover_image , Avatar
    // Create a user object - Creates its entry in database
    // Remove the password and the refresh token from the user response (They need to be hidden)
    // Create/Check new user creation
    // Return response

    const {username , fullname , email , password} = req.body
    console.log("Email : ",email)

    if([fullname,username,email,password].some((field)=>{field?.trim === ""})){
        throw new ApiError(400 , "All the Required Fields are necessary to Fill");
    }

    const existeduser = await User.findOne({
        $or: [{username}, {email}]
    })
    
    if(existeduser){
        throw new ApiError(400 , "This Username or Email Adress already exists")
    }

    const avatarpath = req.files?.avatar[0]?.path
    const coverimagepath = req.files?.coverimage[0]?. path

    if(!avatarpath){
        throw new ApiError(400 , "Uploading Avatar is Required")
    }

    const avatar = await fileupload(avatarpath)
    const coverimage = await fileupload(coverimagepath)

    if(!avatar){
        throw new ApiError(400 , "Uploading Avatar is Required")
    }

    const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverimage : coverimage.url || "",
        email,
        username : username.toLowercase(),
        password
    })

    const createduser = await User.findById(user._id).select("-password -refreshToken")

    if(!createduser){
        throw new ApiError(500 , "Something Went Wrong While Creating a User")
    }

    return res.status(201).json(new ApiResponse(200 , createduser , "User Created Successfully"))

})

export {register_user}