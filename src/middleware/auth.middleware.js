import { ApiError } from "../utils/ApiError.js"
import jwt from 'jsonwebtoken'
import { User } from "../models/user.models.js"
import { asynchandler } from "../utils/asynchandler.js"

export const verifyJwt = asynchandler(async(req,res,next)=>{
    const authHeader = req.header("Authorization");
    const token = req.cookies?.accessToken || (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1].trim() : null);
    console.log("AccessToken", req.cookies.accessToken)
    if(!token) throw new ApiError(401,"Unauthorized Request")
    console.log("Token",token)
    try {
        let decodetoken
        try {
            decodetoken = jwt.verify(token , process.env.ACCESS_TOKEN_VAL)
            console.log("DEcoded",decodetoken)
        } catch (err) {
            console.error("JWT Verification Failed:", err.name, err.message);
            throw new ApiError(401, `Invalid or expired token: ${err.message}`)
        }    

        const user = await User.findById(decodetoken?._id).select("-password -refreshToken")

        if(!user){
            throw new ApiError(401, "Invalid Access Token")
        }
        console.log("User",user)
        req.user = user
        next()

    } catch (error) {
        throw new ApiError(400 ,error.message || "Invalid Authorization")
    }
})