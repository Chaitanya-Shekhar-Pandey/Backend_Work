import mongoose , {isValidObjectId} from "mongoose";
import Playlist from "../models/playlists.models"
import Video from "../models/video.models"
import { asynchandler } from "../utils/asynchandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";

const createPlaylist = asynchandler(async (req, res) => {
    const {name, description} = req.body
    if([name , description].some((field)=> !field || field.trim() === "")) throw new ApiError(400 , "The Name and Description Fields are Required")

    const userId = req.user?._id

    try {
        const list = await Playlist.create({
            name : name , 
            description : description,
            owner : userId,
            video : []
        })
    
        return res.status(200).json(new ApiResponse(200 , list , "Playlist Created Successfully"))
    } catch (error) {
        throw new ApiError(401 , "Something Went Wrong , Playlist is not Created")
    }
})

const getUserPlaylists = asynchandler(async (req, res) => {
    const {userId} = req.params
    if(!userId) throw new ApiError(401 , "Invalid User Id")

    try {
        const userplaylist = await Playlist.find({owner : userId}).populate({path:"videos" , select : "title description thumbnail" , populate:{path:"owner" , select: "usename email fullname"}}).sort({createdAt : -1})
        if(!userplaylist) throw new ApiError(404 , "User Playlist not Found")
            
        return res.status(200).json(200 , userplaylist , "User Playlist Fetched Successfully")
    } catch (error) {
        throw new ApiError(401 , "Invalid Access to User Playlist")
    }
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)) throw new ApiError(400 , "Invalid Playlist Id")

    try {
        const playlistbyid = await Playlist.find(playlistId).populate({path:"videos" , select : "title description thumbnail"}).sort({createdAt : -1})
        if(!playlistbyid) throw new ApiError(404 , "Playlist not Found")
    
        return res.status(200).json(200 , playlistbyid , "Playlist Fetched Successfully")
    } catch (error) {
        throw new ApiError(401 , "Invalid Playlist Access")
    }
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)) throw new ApiError(400 ,"Invalid Playlist Id or Video Id")

    const playlist = await Playlist.findById(playlistId)
    if(!playlist) throw new ApiError(400 , "Playlist ID not Found")

    const video = await Video.findById(videoId)
    if(!video) throw new ApiError(400 , "Video ID not Found")

    try {
        if(!playlist.owner.equals(req.user?._id)) throw new ApiError(403 , "Not Authorize Acess to Update Playlist")
    
        if(!playlist.videos.include(videoId)){
            playlist.videos.push(videoId)
            await playlist.save()
        }
    
        return res.status(200).json(new ApiResponse(200 , playlist , "Video Added to Playlist Successfully"))
    } catch (error) {
        throw new ApiError(401 , "Something Went Wrong While Adding the Video")
    }
})