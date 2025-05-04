import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {Video} from "../models/video.model.js"
import {Like} from "../models/like.models.js"
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";
import mongoose from "mongoose";

const getChannelStats = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    const existChannel = await User.findById(channelId);
    if (!existChannel) {
        throw new ApiError(404, "Channel does not exist");
    }

    const videoStats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views" },
                totalVideos: { $sum: 1 }
            }
        }
    ]);

    const totalViews = videoStats[0]?.totalViews || 0;
    const totalVideos = videoStats[0]?.totalVideos || 0;

    const totalSubscribers = await Subscription.countDocuments({
        channel: new mongoose.Types.ObjectId(channelId)
    });

    const likeStats = await Like.aggregate([
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        { $unwind: "$videoDetails" },
        {
            $match: {
                "videoDetails.owner": new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $count: "totalLikes"
        }
    ]);

    const totalLikes = likeStats[0]?.totalLikes || 0;

    return res.status(200).json(
        new ApiResponse(200, {
            totalViews,
            totalVideos,
            totalSubscribers,
            totalLikes
        }, "Channel stats fetched successfully")
    );
});


const getChannelVideos = asyncHandler( async (req,res) => {
  
    const {channelId} = req.params
    const existChannel = await User.findById(channelId)

    if (!existChannel) {
        throw new ApiError(404,"Channel does not exist")
    }

    const video = await Video.find({
        owner : channelId
    }).sort({ createdAt : -1})

    if (video.length == 0) {
        return res
        .status(404)
        .json(new ApiResponse(404,[],"No videos found for this channel"))
    }

    return res
    .status(200)
    .json(new ApiResponse(200,video,"All Video fetched Successfully"))
})

export {    getChannelStats,
            getChannelVideos
}