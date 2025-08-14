import mongoose from "mongoose";
import { asynchandler } from "../utils/asynchandler";
import {Video} from "../models/video.models"
import { User } from "../models/user.models";
import { ApiError } from "../utils/ApiError";
import { ApiResponse} from "../utils/ApiResponse";
import { fileupload } from "../utils/cloudinary";

const getallvideos = asynchandler(async(req,res)=>{
    const {userid , page = 1 , limit = 10 , sortBy = "createdAt" , sortType = "desc"} = req.query

    try {
        let filter = {}

        if(!query){throw new ApiError(401 , "Query is Required")}
    
        if(query){
            filter.$or[
                {title:{$regex: query , $options : 'i'}},{discription :{$regex: query , $options : 'i'}}
            ]
        }
    
        if(!userid){throw new ApiError(400 , "Unable to Fetch User Id")}
        filter.owner = userid
    
        const skip = (parseInt(page)-1)*parseInt(limit)
    
        const sortOrder = sortType === 'asc'?1:-1
    
        const video = await Video.find(filter).sort({sortBy : sortOrder}).skip(skip).limit(parseInt(limit))
    
        return res.status(200)
        .json(new ApiResponse(200 , {page:parseInt(page) , limit:parseInt(limit) , totalvideo , totalpage : Math.ceil(totalvideo/limit) , video} , "All The Videos Are Here as Requested"))
    
    } catch (error) {
        throw new ApiError(401 , error.message || "Videos Cannot Be Fetched")
    }
    
})

const publishAVideo = asynchandler(async (req, res) => {
    const { title, description} = req.body
    
    if([title , description].some((field)=>{!field?.trim()})){throw new ApiError(400 , "Please Fill the Required Fields")}

    if(!req.files)throw new ApiError(401 , "Files are not Uploaded")    
    
    const videopath = req.files?.path

    if(!videopath) throw new ApiError(400 , "Uploading Video is Required")

    const video = await fileupload(videopath)

    if(!video) throw new ApiError(400 , "Uploading Video File is Required")

    return res.status(201)
    .json(new ApiResponse(201 , {video , title , description} , "Video Is Published Successfully"))

})

const getVideoById = asynchandler(async (req, res) => {
    const { videoId } = req.params
    
    if(!mongoose.isValidObjectId(videoId)) throw new ApiError(400 , "VideoId is Invalid")

    const video = await Video.findById({videoId})

    if(!video) throw new ApiError(404 , "Video Not Found")

    return res.status(201)
    .json(new ApiResponse(201 , {video} , "Video Fetched Successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if(!mongoose.isValidObjectId(videoId)) throw new ApiError(400 , "Video Id is Invalid")


})

export {getallvideos , publishAVideo , getVideoById}