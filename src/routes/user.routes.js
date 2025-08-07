import { Router } from "express";
import { register_user } from "../controllers/user.controllers.js";
import { upload } from "../middleware/multer.middleware.js";

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

export default router