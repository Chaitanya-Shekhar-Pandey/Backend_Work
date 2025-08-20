import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { deleteVideo, getallvideos, getVideoById, publishVideo, togglePublishStatus, updateVideo } from "../controllers/video.controllers.js";

const router = Router();
router.use(verifyJwt);

router.route("/").get(getallvideos).post(upload.fields([
    {
        name : "videoFiles",
        maxCount : 1
    },
    {
        name : "thumbnail",
        maxCount : 1
    }
]), publishVideo)

router.route("/:videoId").get(getVideoById).delete(deleteVideo).patch(upload.single("thumbnail"),updateVideo)

router.route("/toggle/publish/:videoId").patch(togglePublishStatus)

export default router