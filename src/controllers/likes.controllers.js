import mongoose, { isValidObjectId } from "mongoose";
import { asynchandler } from "../utils/asynchandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import {Like} from "../models/likes.models"
import { Video } from "../models/video.models";
import { Comment } from "../models/comments.models";
import { Tweet } from "../models/tweets.models";

const toggleVideoLike = asynchandler(async (req, res) => {
    const {videoId} = req.params
    if(!isValidObjectId(videoId)) throw new ApiError(400 , "Video Id is Invalid")

    const video = await Video.findById(videoId)
    if(!video) throw new ApiError(404 ,"Video Not Found")

    try {
        const existing = await Like.findOne({
            video : videoId,
            likedBy : req.user?._id
        })
    
        if(existing){
            await Like.findByIdAndDelete(existing._id)
    
            return res.status(200).json(new ApiResponse(200 , {} , "Video is Unliked"))
        }
    
        const createlike = await Like.create({
            video : videoId,
            likedBy : req.user?._id
        })
    
        return res.status(201).json(new ApiResponse(201 , {createlike} , "Video is Liked"))
    } catch (error) {
        throw new ApiError(401 ,error.message || "Invalid Like Response")
    }
})

const toggleCommentLike = asynchandler(async (req, res) => {
    const {commentId} = req.params
    if(!isValidObjectId(commentId)) throw new ApiError(400,"Comment Id is Invalid")

    const comment = await Comment.findById(commentId)
    if(!comment) throw new ApiError(404 , "Comment Like not Found")
        
    try {
        const existingcomment = await Like.findOne({
            comment : commentId,
            likedBy : req.user?._id
        })
    
        if(existingcomment){
            await Like.findByIdAndDelete(existingcomment._id)
    
            return res.status(200).json(new ApiResponse(200 , {} , "Comment is Unliked"))
        }
    
        const createCommentLike = await Like.create({
            comment : commentId,
            likedBy : req.user?._id
        })
    
        return res.status(201),json(new ApiResponse(201 , {createCommentLike} , "Comment is Liked"))
    } catch (error) {
        throw new ApiError(401 , "Invalid Comment Like Response")
    }
})

const toggleTweetLike = asynchandler(async (req, res) => {
    const {tweetId} = req.params
    if(isValidObjectId(tweetId)) throw new ApiError(4004, "Tweet Id is Invalid")

    const tweet = await Tweet.findById(tweetId)
    if(!tweet) throw new ApiError(404 , "Tweet Like not Found")

    try {
        const existingTweetLike = await Tweet.findOne({
            tweet : tweetId,
            likedBy : req.user?._id
        })
    
        if(existingTweetLike){
            await Like.findByIdAndDelete(existingTweetLike._id)
    
            return res.status(200).json(new ApiResponse(200 , {} , "Tweet is Unliked"))
        }
    
        const createTweetLike = await Like.create({
            tweet : tweetId,
            likedBy : req.user?._id
        })
    
        return res.status(201).json(new ApiResponse(201 , {createTweetLike} , "Tweet is Liked"))
    } catch (error) {
        throw new ApiError(401 , "Invalid Tweet Like Response")
    }
})

const getLikedVideos = asynchandler(async (req, res) => {
    const userId = req.user?._id
    if(!userId) throw new ApiError(400 , "User Id is Invalid")

    const {page = 1 , limit = 1 , sortBy = "createdAt" , sortType = "desc"} = req.params

    const skip = (parseInt(psge) - 1)*(parseInt(limit))
    const sortOrder = sortType === "asc" ? -1:1

    try {
        const like = await Like.findOne({
            likedBy : userId,
            video : {$exist : true}
        }).populate({path : "video" , populate:{path : "owner" , select : "username , email , fullname"}}).skip(skip).limit(limit).sort({[sortBy] : sortOrder})
    
        if(!like || like.length === 0) throw new ApiError(404 , "Liked Video not Found")
    
        const totalLikeVideo = await Like.countDocuments({
            likedBy : userId,
            video : {$exist : true}
        })
    
        return res.status(200).json(new ApiResponse(200 , {page : parseInt(page) , limit : parseInt(limit) , totalLikeVideo , totalpage : Math.ceil(totalLikeVideo / limit) , like} , "Liked Videos Fetched Successfully"))
    } catch (error) {
        throw new ApiError(401 , "Fsiled To Fetched Liked Videos")
    }
})

export {toggleVideoLike , toggleCommentLike , toggleTweetLike , getLikedVideos}
