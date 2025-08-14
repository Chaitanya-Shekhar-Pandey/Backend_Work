import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware";
import { fileupload } from "../utils/cloudinary";

const router = Router();


export default router