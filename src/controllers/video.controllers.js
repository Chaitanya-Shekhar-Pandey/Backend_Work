import mongoose from "mongoose";
import { asynchandler } from "../utils/asynchandler.js";
import {Video} from "../models/video.models.js"
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse} from "../utils/ApiResponse.js";
import { fileupload } from "../utils/cloudinary.js";

const getallvideos = asynchandler(async(req,res)=>{
    const {userid ,query , page = 1 , limit = 10 , sortBy = "createdAt" , sortType = "desc"} = req.query

    try {
        let filter = {}

        if(!query){throw new ApiError(401 , "Query is Required")}
    
        if(query){
            filter.$or=[
                {title:{$regex: query , $options : 'i'}},{description :{$regex: query , $options : 'i'}}
            ]
        }
    
        if(!userid){throw new ApiError(400 , "Unable to Fetch User Id")}
        filter.owner = userid
    
        const skip = (parseInt(page)-1)*parseInt(limit)
    
        const sortOrder = sortType === 'asc'?1:-1

        const totalvideo = Video.countDocuments(filter)
    
        const video = await Video.find(filter).sort({sortBy : sortOrder}).skip(skip).limit(parseInt(limit))
    
        return res.status(200)
        .json(new ApiResponse(200 , {page:parseInt(page) , limit:parseInt(limit) , totalvideo , totalpage : Math.ceil(totalvideo/limit) , video} , "All The Videos Are Here as Requested"))
    
    } catch (error) {
        throw new ApiError(401 , error.message || "Videos Cannot Be Fetched")
    }
    
})

const publishAVideo = asynchandler(async (req, res) => {
    const { title, description} = req.body
    
    if([title , description].some((field)=>!field?.trim())){throw new ApiError(400 , "Please Fill the Required Fields")}

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

    const video = await Video.findById(videoId)

    if(!video) throw new ApiError(404 , "Video Not Found")

    return res.status(201)
    .json(new ApiResponse(201 , {video} , "Video Fetched Successfully"))
})

const updateVideo = asynchandler(async (req, res) => {
    const { videoId } = req.params
    
    if(!mongoose.isValidObjectId(videoId)) throw new ApiError(400 , "Video Id is Invalid")

    const videopath = req.files?.video?.path

    if(!videopath) throw new ApiError(404 , "Please Upload the Video")

    const videoloc = await fileupload(videopath)

    const video = await Video.findByIdAndUpdate(videoId , {$set:{videoloc:videoloc.url}},{new:true})

    if(!video) throw new ApiError(404 , "Video Not Found")

    return res.status(201).json(new ApiResponse(201 , {} , "Video File is Uploaded Successfully"))
})

const deleteVideo = asynchandler(async (req, res) => {
    const { videoId } = req.params
    if(!mongoose.isValidObjectId(videoId)) throw new ApiError(400 , "Video Id is Invalid")

    const video = await Video.findById(videoId)
    if(!video) throw new ApiError(404 , "Video Not Found")

    try {
        await cloudinary.uploader.destroy(video.public_id , {rescource_type : "video"});
    } catch (error) {
        throw new ApiError(404 , "Video not found")
    }

    try {
        await Video.findByIdAndDelete(videoId)
    } catch (error) {
        throw new ApiError(404 , "Video not Found in Database")
    }

    return res.status(200)
    .json(new ApiResponse(200 ,{}, "Video Successfully Deleted"))
})

const togglePublishStatus = asynchandler(async (req, res) => {
    const { videoId } = req.params
    if(!mongoose.isValidObjectId(videoId)) throw new ApiError(400 , "Video Id is Invalid")

    const video = await Video.findById(videoId)
    if(!video) throw new ApiError(404 , "Video Not Found")

    video.isPublished = !video.isPublished

    try {
        await video.save()
    } catch (error) {
        throw new ApiError(500 , "Error Saving the Video")
    }

    return res.status(200)
    .json(new ApiResponse(200 , {video} , "Video Publsihed status is Updated"))
})

export {getallvideos , publishAVideo , getVideoById , updateVideo , deleteVideo , togglePublishStatus}