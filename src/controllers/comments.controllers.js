import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {Comment} from "../models/comment.models.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const addComment = asyncHandler( async (req,res) => {

    const {videoId} = req.params
    const {content} = req.body
    const {user} = req.user._id
    
    if (!content) {
        throw new ApiError(400 , "Comment contengt is must be required")
    }

    const comment = await Comment.create(
        {
            content,
            video : videoId,
            owner : user
        }
    )

    return res
    .status(201)
    .json(new ApiResponse(201,comment,"Comment added Successfully "))
})

const updateComment = asyncHandler( async (req,res) => {

    const {updatedContent} = req.body

    if (!updatedContent) {
        throw new ApiError(500,"Content is must be required")
    }

    const existingComment = req.comment

    if (!existingComment) {
        throw new ApiError(500,"This Comment is not Exsited")
    }

    const comment = await Comment.findByIdAndUpdate(
        existingComment._id,
        {
            $set : {
                content : updatedContent
            }
        },
        { new : true}
    )

    return res
    .status(200)
    .json(new ApiResponse(200,comment,"Comment Updated Succesfully"))

})

const deleteComment = asyncHandler( async (req,res) => {

    const commentId = req.comment?._id

    if (!commentId) {
        throw new ApiError(500,"Comment is does not exist")
    }

    const comment = await Comment.findByIdAndDelete(commentId)

    return res
    .status(200)
    .json(new ApiResponse(200,comment,"Comment deleted Successfully"))
})

export {addComment,
        updateComment,
        deleteComment
    }