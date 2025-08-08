import { ApiError } from "../utils/ApiError"
import jwt from jsonwebtoken
import { User } from "../models/user.models"
import { asynchandler } from "../utils/asynchandler"

export const verifyJwt = asynchandler(async(req,res,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")

        if(!token) throw new ApiError(401,"Unauthorized Request")

        const decodetoken = jwt.verify(token , process.env.ACCESS_TOKEN_VAL)    

        const user = User.findById(decodetoken?._id).select("-password -refreshToken")

        if(!user){
            throw new ApiError(401, "Invalid Access Token")
        }

        req.user = user
        next()

    } catch (error) {
        throw new ApiError(400 ,error.message || "Invalid Authorization")
    }
})