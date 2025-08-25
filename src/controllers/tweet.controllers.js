import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { Tweet } from "../models/tweets.models.js";
import mongoose, { isValidObjectId } from "mongoose";


const createTweet = asynchandler(async (req, res) => {
    const {content} = req.body
    if(content.trim() === "") throw new ApiError(400 , "Content Is Required , Tweet cannot be Empty")

    const user = await User.findById(req.user._id)
    if(!user) throw new ApiError(404,"User Not Found");

    const tweet = await Tweet.create({
        content: content,
        owner: user._id,
    })

    const createdtweet = await Tweet.findById(tweet._id).select("-owner")
    if(!createdtweet) throw new ApiError(401, "Something Went Wrong While Creating Tweet")

    return res.status(200).json(new ApiResponse(200 , createdtweet , "Tweet Created Successfully"))
})

const getUserTweets = asynchandler(async (req, res) => {
    const {userId} = req.params
    if(!isValidObjectId(userId)) throw new ApiError(400 , "User ID is invalid")

    const tweetinfo = await Tweet.aggregate([
        {
            $match:{
                owner : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField:"_id",
                as:"ownerDetails",
            }
        },
        {
            $unwind: {path :"$ownerDetails" , preserveNullAndEmptyArrays:true}
        },
        {
            $project:{
                content:1,
                "ownerDetails.username":1,
                "ownerDetails.fullname":1,
                "ownerDetails.avatar":1
            }
        }
    ])

    if(!tweetinfo?.length) throw new ApiError(400 , "Tweets Does not Exist")

    return res.status(200).json(new ApiResponse(200 , tweetinfo , "Tweet's Fetched Successfully"))
})

const updateTweet = asynchandler(async (req, res) => {
    const {content} = req.body
    if(!content?.trim()) throw new ApiError(400 , "Content is Required")
    const {tweetid} = req.params
    if(!isValidObjectId(tweetid)) throw new ApiError(400 , "Tweet Id is Invalid")

    const tweet = await Tweet.findByIdAndUpdate(tweet?._id ,{$set:{content}}, {new:true})

    return res.status(200).json(new ApiResponse(200 , tweet , "Tweet Updated Successfully"))
})

const deleteTweet = asynchandler(async (req, res) => {
    const {tweetid} = req.params
    if(!isValidObjectId(tweetid)) throw new ApiError(400 , "Tweet Id is Invalid")

    try {
        const tweet = await Tweet.findByIdAndDelete(tweetid)
    } catch (error) {
        throw new ApiError(404 , error.message || "Tweet Not Found")
    }

    return res.status(200).json(new ApiResponse(200 , {} , "Tweet Deleted Successfully"))
})

export {createTweet , getUserTweets , updateTweet , deleteTweet}
