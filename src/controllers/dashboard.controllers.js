import mongoose , {isValidObjectId} from "mongoose";
import { Video } from "../models/video.models.js";
import {Subscription} from "../models/subscription.models.js"
import { Like } from "../models/likes.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asynchandler } from "../utils/asynchandler.js";

const getChannelStats = asynchandler(async (req, res) => {
    const {channelId} = req.user._id
    if(!isValidObjectId(channelId)) throw new ApiError(404 , "Channel Id not Found")

    try {
        const totalvideo = await Video.countDocuments({owner :channelId})
        if(!totalvideo) throw new ApiError(404 , "Total Videos Count Not Found")
    
        const views = await Video.aggregate([
            {
                $match : {
                    owner : channelId
                }
            },
            {
                $group : {
                    _id : null,
                    totalviews : {
                        $sum : "$views"
                    }
                }
            }
        ])
        if(!views) throw new ApiError(404 , "Views Count not Found")
    
        const subscription = await Subscription.countDocuments({channel : channelId})
        if(!subscription) throw new ApiError(404 , "Subscription Count not Found")
    
        const totalLikes = await Like.aggregate([
            {
                $lookup:{
                    from : "videos",
                    localField : "video",
                    foreignField : "_id",
                    as : "videoDetails"
                }
            },
            {
                $unwind : "videoDetails"
            },
            {
                $match :{
                    "videoDetails.owner" : new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $count : "totalLikes"
            }
        ])
        if(!totalLikes) throw new ApiError(404 , "Total Likes Count not Found")
    
        const totalCommentLikes = await Like.aggregate([
            {
                $lookup:{
                    from : "comments",
                    localField : "comment",
                    foreignField : "_id",
                    as : "commentDetails"
                }
            },
            {
                $unwind : "commentDetails"
            },
            {
                $lookup :{
                    from : "videos",
                    localField: "commentDetails.video",
                    foreignField : "_id",
                    as : "videoDetails"
                }
            },
            {
                $unwind : "videoDetails"
            },
            {
                $match : {
                    "videoDetails.owner" : new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $count : "totalCommentLikes"
            }
        ])
        if(!totalCommentLikes) throw new ApiError(404 , "Total Comment Likes not Found")
    
        return res.status(200).json(new ApiResponse(200 , {totalvideo , views , subscription , totalLikes , totalCommentLikes} , "Channel Stats Fetched Successfully"))
    } catch (error) {
        throw new ApiError(401 , "Something went Wrong In Fetching Channel Stats")
    }
})

const getChannelVideos = asynchandler(async (req, res) => { 
    const [channelId] = req.params
    if(!channelId) throw new ApiError(400 ,"Channel Id not Found")

    try {
        const skip = (parseInt(req.query.page || 1)-1)*(parseInt(req.query.limit || 10))
        const sortBy = req.query.sort || "createdAt"
        const sortOrder = req.query.sortType === 'asc' ?1 :-1
    
        const video = await Video.find({owner : channelId}).skip(skip).limit(limit).sort({[sortBy] : sortOrder}).populate({path : "owner" , select : "username fullname email"})
    
        const totalVideo = await Video.countDocuments({owner : channelId})
    
        return res.status(200).json(new ApiResponse(200 , {video , totalVideo} , "Channel Videos are Fetched Successfully"))
    } catch (error) {
        throw new ApiError(400 , "Something went wrong While Fetching Channel Videos")
    }
})

export {getChannelStats , getChannelVideos}