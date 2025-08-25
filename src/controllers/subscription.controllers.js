import mongoose from "mongoose";
import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {Subscription} from "../models/subscription.models.js"

const toggleSubscription = asynchandler(async (req, res) => {
    const {channelId} = req.params
    if(!mongoose.isValidObjectId(channelId)) throw new ApiError(401 , "Channel Id is Invalid")

    const subscriberid = req?.user._id;

    if(channelId === subscriberid) throw new ApiError(400 , "User cannot Subscribe itself")

    const subscription = await Subscription.findOne({subscriber :subscriberid , channel : channelId})
    if(subscription) {
        await Subscription.findByIdAndDelete(subscriberid);
        return res.status(200)
        .json(new ApiResponse(200 ,{},"Channel Unsubscribed Successfully"))
    }
    else {
        await Subscription.create({subscriber :subscriberid , channel : channelId})
        return res.status(201).json(new ApiResponse(201 , {} , "Channel Subscribed Successfully"))
    }

})

const getUserChannelSubscribers = asynchandler(async (req, res) => {
    const {channelId} = req.params
    if(!mongoose.isValidObjectId(channelId)) throw new ApiError(400 , "Invalid Channel Id")
    try {

            const channel = await Subscription.find({channel :channelId}).populate("channel" , "username fullname email")
            if(channel.length === 0) throw new ApiError(404, "Channel does not Found")
            
            const countsubs = await Subscription.countDocuments({channel: channelId})

            return res.status(200)
            .json(new ApiResponse(200 , {countsubs , subs} , "Subscribers Fetched Successfully"))
    } catch (error) {
        throw new ApiError(401 , error.message || "Failed to Fetch Subscribers")
    }  
})

const getSubscribedChannels = asynchandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!mongoose.isValidObjectId(subscriberId)) throw new ApiError(400 , "Subscriber Id is Invalid")

    try {
        const subscriber = await Subscription.find({subscriber: subscriberId}).populate("subscriber" , "username fullname email")
        if(subscriber.length() === 0) throw new ApiError(404, "Subscribers does not Found")
    
        const count = await Subscription.countDocuments({subscriber:subscriberId})
        
        return res.status(200)
        .json(new ApiResponse(200 , {channels :subscriber,count}, "Subscription Fetched Successfully"))
    } catch (error) {
        throw new ApiError(401 , error.message || "Failed to fetch Subscriptions")
    }
})

export {toggleSubscription , getUserChannelSubscribers , getSubscribedChannels}
