import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {Like} from "../models/like.models.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose , {isValidObjectId} from "mongoose";

const toggleVideoLike = asyncHandler( async (req,res) => {

    const {videoId} = req.params
    const user = req.user?._id

    if (!videoId) {
        throw new ApiError(500,"Video ID is required")
    }

    const existingVideoLike = await Like.findOne(
        {video :  videoId , likeBy : user }
    )

    if (existingVideoLike) {
        
        await Like.findByIdAndDelete(existingVideoLike._id)

        return res
        .status(200)
        .json(new ApiResponse(200, null,"Video Unlike Successfully "))
    }

    const like = await Like.create(
        {
            video : videoId,
            likeBy : user
        }
    )

    return res
    .status(200)
    .json(new ApiResponse(200,like,"Like added successfully in Video"))
} )

const toggleCommentLike = asyncHandler( async (req,res) => {

    const {commentId} = req.params
    const userId = req.user?._id

    if (!commentId) {
        throw new ApiError(500,"Comment id required")
    }

    const existingCommentLike = await Like.findOne( 
        { comment : commentId , likeBy : userId}
    )

    if (existingCommentLike) {
        
        await Like.findByIdAndDelete(existingCommentLike._id)

        return res
        .status(200)
        .json(new ApiResponse(200,null,"Comment unlike successfully"))
    }

    const like = await Like.create(
        { 
            comment : commentId , 
            likeBy :userId
        }
    )

    return res
    .status(200)
    .json(new ApiResponse(200,like,"Comment liked successfully"))

})

const toggleTweetLike = asyncHandler( async (req,res) => {

    const {tweetId} = req.params
    const userId = req.user?._id

    if (!tweetId) {
        throw new ApiError(500,"Tweet id required")
    }

    const existingTweetLike = await Like.findOne( 
        { tweet : tweetId , likeBy : userId}
    )

    if (existingTweetLike) {
        
        await Like.findByIdAndDelete(existingTweetLike._id)

        return res
        .status(200)
        .json(new ApiResponse(200,null,"Tweet unlike successfully"))
    }

    const like = await Like.create(
        { 
            tweet : tweetId , 
            likeBy :userId
        }
    )

    return res
    .status(200)
    .json(new ApiResponse(200,like,"Tweet liked successfully"))

})

const getLikedVideo = asyncHandler( async (req,res) => {

    if (!mongoose.Types.ObjectId.isValid(req.user?._id)) {
        throw new ApiError(404,"Invalid User Id")
    }

    const userId = new mongoose.Types.ObjectId(req.user._id)

    const like = await Like.aggregate([
        {
            $match : {
                likeBy : userId
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "video",
                foreignField : "_id" ,
                as : "videodetails"
            }
        },
        {
            $addFields : {

                likeCount : {
                    $size : "$videodetails"
                }
            }
        }
    ])

    if (!like.length) {
        throw new ApiError(404,"Video Dos't exsit")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,like,"Liked Video Fetched Succesfully"))

})

export {toggleVideoLike,
        toggleCommentLike,
        toggleTweetLike,
        getLikedVideo
}