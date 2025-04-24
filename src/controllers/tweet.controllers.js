import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { Tweet } from "../models/tweets.model.js";

const createTweet = asyncHandler( async (req,res) => {
    const {content} = req.body
    const owner = req.user?._id

    if (!content) {
        throw new ApiError(404,"Tweet Must Be Required")
    }

    const tweet = await Tweet.create({
        content,
        owner
    })

    return res
    .status(200)
    .json(new ApiResponse(200,tweet,"Tweet Added Successfully"))

})

const updateTweet = asyncHandler( async (req,res) => {

    const tweet = req.tweet
    const {content}  = req.body

    if (!content) {
        throw new ApiError(404,"Tweet must be required")
    }

    if (!tweet) {
        throw new ApiError(404,"Tweet Dos't Exist")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweet._id,
    {
        $set : {
            content
        }
    },
    {new :true}
    )

    return res
    .status(200)
    .json(new ApiResponse(200,updatedTweet,"Tweet Updated Successfully"))

})

const deleteTweet = asyncHandler( async (req,res) => {

    const tweet = req.tweet

    if (!tweet) {
        throw new ApiError(404,"Tweet does not Exist")
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweet._id)

    return res
    .status(200)
    .json(new ApiResponse(200 , deletedTweet , "Tweet Deleted Successfully"))

})

const getUsersTweet = asyncHandler( async (req,res) => {

    const userId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(req.user?._id)) {
        throw  new ApiError(400,"Invalid User Id")
    }

    const tweet = await Tweet.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "$owner",
                foreignField : "$_id",
                as : "userinfo"
            }
        },
        {
            $project : {
                content : 1,
                createdAt: 1,
                updatedAt: 1,
                "userinfo.name": 1,
                "userinfo.email": 1
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200,tweet,"Tweets Fetched Successfully"))

} )

export {createTweet,
        updateTweet,
        deleteTweet,
        getUsersTweet
}