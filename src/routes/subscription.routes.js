import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controllers";

const router = Router()
router.use(verifyJwt)

router.route("/:channelId").get(getUserChannelSubscribers).post(toggleSubscription)
router.route("/:subscriberId").get(getSubscribedChannels)

export default router