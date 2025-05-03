import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import mongoose from "mongoose";
import { uplodOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishVideo = asyncHandler( async (req,res) => {
    
        const { title, description} = req.body

        if (!title || !description) {
            throw new ApiError(404,"title or description must be required")
        }

        const videoFilePath = req.files?.video[0].path
        const thumbnailFilePath = req.files?.thumbnail[0].path

        if (!videoFilePath) {
            throw new ApiError(404,"Video file path is required")
        }
        if (!thumbnailFilePath) {
            throw new ApiError(404,"Video file path is required")
        }

        const video = await uplodOnCloudinary(videoFilePath)
        const thumbnail = await uplodOnCloudinary(thumbnailFilePath)
        
        if (!video) {
            throw new ApiError(404,"Video file is required")
        }
        if (!thumbnail) {
            throw new ApiError(404,"Video file is required")
        }

        const uplodvideo = await Video.create({
            videoFile : {url : video.url , public_id : video.public_id},
            thumbnail : {url : thumbnail.url , public_id : thumbnail.public_id},
            title ,
            description,
            duration : Math.round(video.duration),
            views : 0,
            isPublished : true,
            owner : req.user._id

        })

        return res
        .status(200)
        .json(200,uplodvideo,"Video uploded successfully")

    })

const updateViwes = asyncHandler( async (req,res) => {

        const videoId = req.params.id

        const updateVideo = await Video.findByIdAndUpdate(
            videoId ,
            {
                $inc : {
                    views : 1
                }
            },
            { new : true }
        )

        if (!updateVideo) {
            throw new ApiError(404,"Video is not found")
        }

        return res
        .status(200)
        .json(new ApiResponse(200,updateVideo,"views increment successfully"))
    })

const getVideoById = asyncHandler( async (req,res) => {

    const { videoId } = req.params
    const existVideo = await Video.findById(videoId)

    if (!existVideo) {
        throw new ApiError(404,"Video not exist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,existVideo,"Video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {

    const { videoId } = req.params
    const {title,description} = req.body
    const thumbnail = req.file?.path

    if (!title || !description || !thumbnail) {
        throw new ApiError(404,"All filed must be required")
    }

    const existVideo = await Video.findById(videoId)

    if (!existVideo) {
        throw new ApiError(404,"Video not exist")
    }

    const deletedThumbnail = await deleteFromCloudinary(existVideo.thumbnail.public_id)
    const uploadedThumbnail = await uplodOnCloudinary(thumbnail)

    if (!uploadedThumbnail) {
        throw new ApiError(400, "Thumbnail upload failed");
      }

    const updateVideoDetails = await Video.findByIdAndUpdate(
        videoId,
        {
            $set : {
                title,
                description,
                thumbnail :{
                    url : uploadedThumbnail.url,
                    public_id : uploadedThumbnail.public_id
                } 
            }
        },
        {new : true}
    )

    return res
    .status(200)
    .json(new ApiResponse(200,updateVideoDetails,"Video Details Upadeted Successfully"))
})
   
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    const existVideo = await Video.findById(videoId)

    if (!existVideo) {
        throw new ApiError(404,"Video not exist")
    }

    const deleteVideoFromCloudinary = await deleteFromCloudinary(existVideo.videoFile.public_id)
    
    if (!deleteFromCloudinary) {
        throw new ApiError(404,"video deltetion is not completed ")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,deleteVideoFromCloudinary,"video is deleted"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: { isPublished: !existingVideo.isPublished } },
        { new: true }
    );

    return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Publish status toggled successfully"));
})

export {publishVideo,
            updateViwes,
            getVideoById,   
            updateVideo,
            deleteVideo,
            togglePublishStatus
        }