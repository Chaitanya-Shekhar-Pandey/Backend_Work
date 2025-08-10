import { asynchandler } from "../utils/asynchandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import { fileupload } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessTokenandRefreshToken = async(userid)=>{

    try {
        const user = await User.findById(userid)
        if (!user) throw new ApiError(404, "User not found for token generation");

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        console.log("Access token : ",accessToken)
        console.log("Refresh token : ",refreshToken)
    
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})
    
        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(501 , "Something Went Wrong , Token Not Generated")
    }
}

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
    console.log("Username : ",username)

    if([fullname,username,email,password].some((field) => !field || field.trim() === "")){
        throw new ApiError(400 , "All the Required Fields are necessary to Fill");
    }

    const existeduser = await User.findOne({
        $or: [{username}, {email}]
    })
    
    if(existeduser){
        throw new ApiError(400 , "This Username or Email Address already exists")
    }

    const avatarpath = req.files?.avatar[0]?.path
    // const coverimagepath = req.files?.coverimage[0]?. path

    let coverimagepath

    if(req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.length > 0){
        coverimagepath = req.files.coverimage[0].path
    }

    console.log("Cover_image Path : ",coverimagepath)

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
        coverimage : coverimage?.url || " ",
        email,
        username : username.toLowerCase(),
        password
    })

    const createduser = await User.findById(user._id).select("-password -refreshToken")

    if(!createduser){
        throw new ApiError(500 , "Something Went Wrong While Creating a User")
    }

    return res.status(201).json(new ApiResponse(200 , createduser , "User Created Successfully"))

})

const loginuser = asynchandler(async(req,res)=>{
    // Take data from REQ->BODY
    // Take usernme / email
    // Check if the username/email exist int he database
    // Check if password is valid
    // Generate access token andd refresh token
    // Send Cookie to user that stores access token and refresh token

    const {username , email , password} = req.body

    if([username , email , password].some((field)=>{field?.trim === ""})){
        throw new ApiError(400 , "Please Enter Valid Details")
    }

    if(!username && !email) throw new ApiError(400 , "Username or Email is Required")
    const finduser = await User.findOne({$or : [{username} , {email}]})

    if(!finduser) throw new ApiError(404 , "User Not Found")

    const validatepassword = await finduser.isPasswordCorrect(password)
    if(!validatepassword) throw new ApiError(402 ,"Please Enter a Valid Password")

    const {accessToken,refreshToken} = await generateAccessTokenandRefreshToken(finduser._id)

    const loggedin = await User.findById(finduser._id).select("-password -refreshToken")

    const option = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(201)
    .cookie("accessToken" , accessToken , option)
    .cookie("refreshToken" , refreshToken , option)
    .json(new ApiResponse(200 ,{
        user : loggedin , accessToken , refreshToken
    } , "User LoggedIn Successfully"))
})

const logoutuser = asynchandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken : 1
            }
        },
        {
            new : true
        }
    )

    const option = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(201)
    .clearCookie("accessToken",option)
    .clearCookie("refreshToken",option)
    .json(new ApiResponse(200 , {},"User Logged Out"))
})

const refreshaccesstoken = asynchandler(async(req,res)=>{
    const token = req.cookie.refreshToken || req.body.refreshToken

    if(!token){ throw new ApiError(400 , "Unauthorized Access Request")}

    try {
        const decodeaccesstoken = jwt.verify(token , process.env.REFRESH_TOKEN_VAL)
        
        const user = await User.findById(decodeaccesstoken?._id)
        if(!user){ throw new ApiError(400 , "Invalid Refresh Token")}
    
        if(token !== user?.refreshToken){
            throw new ApiError(401 , "Invalid Token Entry")
        }
    
        const option = {
            httpOnly : true,
            secure : true
        }
    
        const {accessToken , newrefreshToken} = generateAccessTokenandRefreshToken(user._id)
    
        return res.status(200)
        .cookie("accessToken" , accessToken , option)
        .cookie("refreshToken" , newrefreshToken , option)
        .json(new ApiResponse(200 , {accessToken , refreshToken : newrefreshToken} , "Access Token Refresh Successfully"))
    } catch (error) {
        throw new ApiError(400 , error.message || "Invalid Refresh Token Entry")
    }
})

export {register_user , loginuser , logoutuser , refreshaccesstoken}