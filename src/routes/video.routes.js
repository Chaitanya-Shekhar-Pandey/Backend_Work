import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { fileupload } from "../utils/cloudinary.js";

const router = Router();


export default router