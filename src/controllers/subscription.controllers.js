import {Subscription} from "../models/subscription.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import mongoose from "mongoose"
import {User} from "../models/user.model.js"

const toggleSubscription = asyncHandler( async (req,res) => {

    const {channelId} = req.params
    const userId = req.user?._id

    if (channelId.toString() == userId.toString()) {
        throw new ApiError(400,"You cannot subscribe to yourself.")
    }

    const existChannel = await User.findById(channelId)

    if (!existChannel) {
        throw new ApiError(404,"Channel does not exist")
    }

    const existingSub = await Subscription.findOne({
        subscriber : userId,
        channel : channelId
    })

    if (existingSub) {
        
        const unsubscribed = await existingSub.deleteOne()
        return res
        .status(200)
        .json(new ApiResponse(200,unsubscribed,"Unsubscribed from channel"))

    }else
    {
        const subscribed = await Subscription.create({
            subscriber : userId,
            channel : channelId
        })
        return res
        .status(200)
        .json(new ApiResponse(200,subscribed,"Subscribed to channel"))
    }
    

})

const getUserChannelSubscribers = asyncHandler( async (req,res) => {

    const {channelId} = req.params

    const existChannel = await User.findById(channelId)
    
    if (!existChannel) {
        throw new ApiError(404,"Channel does not exist")
    }

    const userChannelSubscribers = await Subscription.aggregate([
        {
            $match : {
                "channel" : new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "subscriber",
                foreignField : "_id",
                as : "subscriberdetails"
                
            }
        },
        {
            $project : {
                _id : 1,
                "subscriberdetails._id" : 1,
                "subscriberdetails.username" : 1,
                "subscriberdetails.email" : 1,
                "subscriberdetails.avatar" : 1,

            }
        }
    ])

    if (userChannelSubscribers.length === 0) {
        return res
        .status(404)
        .json(new ApiResponse(404, [], "No subscribers found for this channel"));
    }

    return res
    .status(200)
    .json(new ApiResponse(200,userChannelSubscribers,"Subscribers Get Successfully"))

})

const getSubscribedChannels = asyncHandler( async (req,res) => {
    const { subscriberId } = req.params
    const existSubscriber = await User.findById(subscriberId)

    if (!existSubscriber) {
        throw new ApiError(404,"subscriber does not exist")
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match : {
                "subscriber" : new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup : {
                from : "users" ,
                localField : "channel" ,
                foreignField : "_id" ,
                as : "subscribedChannelsdetails"
            }
        },
        {
                $project : {
                    _id : 1,
                    "subscribedChannelsdetails._id" : 1,
                    "subscribedChannelsdetails.username" : 1,
                    "subscribedChannelsdetails.email" : 1,
                    "subscribedChannelsdetails.avatar" : 1,
    
                }
         
        }
    ])

    if (subscribedChannels.length === 0) {
        return res
        .status(404)
        .json(new ApiResponse(404, [], "No channel found for this subscriberId"));
    }

    return res
    .status(200)
    .json(new ApiResponse(200,subscribedChannels,"Channel Get Successfully"))
})

export {toggleSubscription,
        getSubscribedChannels,
        getUserChannelSubscribers
}