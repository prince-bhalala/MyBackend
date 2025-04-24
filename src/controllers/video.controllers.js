import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import mongoose from "mongoose";
import { uplodOnCloudinary } from "../utils/cloudinary.js";

const publishVideo = asyncHandler( async (req,res) => {
    
})