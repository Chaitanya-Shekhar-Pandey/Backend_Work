import { asynchandler } from "../utils/asynchandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import { fileupload } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose, { mongo } from "mongoose";

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

const changepassword = asynchandler(async(req,res)=>{
    const {oldpassword , newpassword , confirmpassword} = req.body

    if(newpassword !== confirmpassword){ throw new ApiError(401 , "Passwords Didn't Match")}

    const user = await User.findById(user?._id)

    const validate = await user.isPasswordCorrect(oldpassword)

    if(!validate) {throw new ApiError(401 , "Old Password Didn't Match")}

    user.password = newpassword
    await user.save({validateBeforeSave : false})

    return res.status(201)
    .json(new ApiResponse(201 , {} , "Password Changed Successfully")) 
})

const getUser = asynchandler(async (req,res) => {
    
    return res.status(200)
    .json(new ApiResponse(200 , req.user , "User Fetched Successfully"))
})

const updateuserdetails = asynchandler(async(req,res)=>{
    const {fullname , email} = req.body

    if(!fullname || !email){throw new ApiError(402 , "Invalid User Details")}

    const user = User.findByIdAndUpdate(user?._id,{$set:{fullname , email}},{new : true})

    return res.status(201).json(new ApiResponse(201 , user , "User Details are Updated Successfully"))
})

const updateavatar = asynchandler(async(req,res)=>{
    const avatarlocalpath = req.file?.path

    if(!avatarlocalpath){throw new ApiError(402 , "Invalid Avatar File")}

    const avatar = await fileupload(avatarlocalpath)

    if(!avatar){throw new ApiError(402 , "Invalid Avatar File")}

    const user = await User.findByIdAndUpdate(req.user?._id , {$set:{avatar : avatar.url}} , {new : true})

    return res.status(201).json(new ApiResponse(201, user, "Avatar Updated Successfully"))
})

const updatecoverimage = asynchandler(async(req,res)=>{
    const coverimagelocalpath = req.file?.path

    if(!coverimagelocalpath){throw new ApiError(402 , "Invalid Cover Image File")}

    const coverimage = await fileupload(coverimagelocalpath)

    if(!coverimage){throw new ApiError(402 , "Invalid Avatar File")}

    const user = await User.findByIdAndUpdate(req.user?._id, {$set:{coverimage : coverimage.url}} , {new : true})

    return res.status(201).json(new ApiResponse(201 , user , "Cover Imagae Updated Successfully"))
})

const getchannelprofile = asynchandler(async(req,res)=>{
    const {username} = req.params

    if(!username?.trim()){throw new ApiError(401 , "Username Not Found")}

    const channelinfo = await User.aggregate([
        {
            $match:{
                username : username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from : "subscriptions",
                localField : "_id",
                foriegnField : "channel",
                as : "subscribers"
            }
        },
        {
            $lookup:{
                from : "subscriptions",
                localField : "_id",
                foriegnField : "subscriber",
                as : "subscribed"
            }
        },
        {
            $addFields:{
                subscriberscount:{
                    $size: "$subscribers"
                },
                subscribedcount:{
                    $size: "$subscribed"
                },
                isSubscribed:{
                    if: {$in : [req.user?._id , "$subscribers.subscriber"]},
                    then: true,
                    else: false
                }
            }
        },
        {
            $project : {
                fullname:1,
                username:1,
                subscriberscount:1,
                subscribedcount:1,
                avatar:1,
                coverimage:1,
                email:1
            }
        }
    ])

    if(!channelinfo?.length){throw new ApiError(401 , "Channel Does Not Found")}

    return res.status(200).json(new ApiResponse(200 , channelinfo[0] , "User's Channel Fetched Successfully"))
})

const getwatchHistory = asynchandler(async(req,res)=>{
    const watchHistory = await User.aggregate([
        {
            $match:{
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                form : "videos",
                localField : "watchHistory",
                foriegnField : "_id",
                as : "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from : "users",
                            localField: "owner",
                            foriegnField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project:{
                                        username:1,
                                        fullname:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            $first : "$owner"
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200 , watchHistory[0] , "WatchHistory Fetched Successfully"))
})

export {
    register_user ,
    loginuser ,
    logoutuser , 
    refreshaccesstoken ,
    changepassword , 
    getUser ,
    updateuserdetails ,
    updateavatar ,
    updatecoverimage,
    getchannelprofile,
    getwatchHistory
}