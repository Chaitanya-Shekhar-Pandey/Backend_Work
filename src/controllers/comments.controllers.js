import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asynchandler } from "../utils/asynchandler";
import Comment from "../models/comments.models"
import { Video } from "../models/video.models";
import { User } from "../models/user.models";

const getVideoComments = asynchandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10 , sortBy = "createdAt" , sortType = "desc"} = req.query

    if(!isValidObjectId(videoId)) throw new ApiError(400 , "Video Id is Invalid")

    try {
        const skip = (parseInt(page - 1)) * parseInt(limit);
        const sortOrder = asc?1:-1;
        
        const comment = await Comment.find({video : videoId}).skip(skip).limit(limit).sort({ [sortBy]:sortOrder }).populate({path : "owner" , select : "username fullname email"}).populate({path:"replies" , populate:{path : "owner" , select:"username email fullname"}})
        if(!comment.length) throw new ApiError(404 , "Comments are not Available For this Video")
            
        const totalComments = await Comment.countDocuments({video:videoId})
        if(!totalComments) throw new ApiError(400 , "Failed To Load Total Comments")
        
        return res.status(200).json(new ApiResponse(200 , {comment , totalComments} , "Comments Fetched Successfully"))
    } catch (error) {
        throw new ApiError(400 , "Something Went Wrong With Comments")
    }
})

const addComment = asynchandler(async (req, res) => {
    const {videoId} = req.params
    if(!isValidObjectId(videoId)) throw new ApiError(400 , "Video Id is Invalid")
    const {content} = req.body
    if(!content || !content.trim() === "") throw new ApiError(400 , "Content Is Required , Comment cannot be Empty")

    const comment = await Comment.create({
        video : videoId,
        owner: req.user?._id,
        content : content
    })

    const createComment = await Comment.findById(comment._id).populate({path:"owner" , select : "username email fullname"})
    if(!createComment) throw new ApiError(400 , "Something Went Wrong while Creating Error")

    return res.status(200).json(new ApiResponse(200 , createComment , "Comment Created Successfully"))

})

const updateComment = asynchandler(async (req, res) => {
    const {content} = req.body
    if(!content || !content.trim) throw new ApiError(400,"Updated Comment Cannont be Empty")
    const {commentid} = req.params
    if(!isValidObjectId(commentid)) throw new ApiError(400 , "Comment Id is Invalid")

    const comment = await Comment.findByIdAndUpdate(commentid , {$set:{content}} , {new:true})

    return res.status(200).json(new ApiResponse(200 , comment , "Comment Updated Successfully"))
})

const deleteComment = asynchandler(async (req, res) => {
    const{commentid} = req.params
    if(!isValidObjectId(commentid)) throw new ApiError(400 , "Comment Id is Invalid")

    try {
        const deleteComment = await Comment.findByIdAndDelete(commentid)
    } catch (error) {
        throw new ApiError(400 , error.message||"Something went Wrong While Deleting Comment")
    }

    return res.status(200).json(new ApiResponse(200,{},"Comment Deleted Successfully"))
})

export {getVideoComments , addComment , updateComment , deleteComment}