import { asynchandler } from "../utils/asynchandler.js";

const register_user = asynchandler(async(req,res)=>{
    res.status(200).json({
        message : "User Registered"
    })
})

export {register_user}