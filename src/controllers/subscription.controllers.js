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

export {toggleSubscription}