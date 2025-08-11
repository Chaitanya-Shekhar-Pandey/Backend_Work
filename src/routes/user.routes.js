import { Router } from "express";
import { changepassword, getchannelprofile, getUser, getwatchHistory, loginuser, logoutuser, refreshaccesstoken, register_user, updateavatar, updatecoverimage, updateuserdetails } from "../controllers/user.controllers.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = Router()
/*WE CAN USE MIDDLEWARE HERE JUST BEFORE EXECUTING THE METHOD TO REGISTER USER , HERE MIDDLEWARE WILL BE RESPONSIBLE TO UPLOAD AND HANDLE FILE , */
router.route("/register").post(/*{Middleware}*/ upload.fields([
    {
        name : "avatar",
        max_count : 1
    },
    {
        name: "coverimage",
        max_count : 1
    },
]), register_user)

router.route("/login").post(loginuser)

router.route("/logout").post(verifyJwt,logoutuser)

router.route("/refreshToken").post(refreshaccesstoken)

router.route("/change-password").post(verifyJwt , changepassword)

router.route("/get-user").get(verifyJwt,getUser)

router.route("/update-details").patch(verifyJwt , updateuserdetails)

router.route("/avatar").patch(verifyJwt , upload.single("avatar") , updateavatar)

router.route("coverimage").patch(verifyJwt , upload.single("coverImage") , updatecoverimage)

router.route("/c/:username").get(verifyJwt , getchannelprofile)

router.route("/watchHistory").get(verifyJwt , getwatchHistory)
export default router