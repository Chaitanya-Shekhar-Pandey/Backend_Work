import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controllers.js";

const router = Router()
router.use(verifyJwt)

router.route("/:channelId").get(getUserChannelSubscribers).post(toggleSubscription)
router.route("/:subscriberId").get(getSubscribedChannels)

export default router