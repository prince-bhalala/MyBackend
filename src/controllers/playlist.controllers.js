import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { Playlist } from "../models/playlist.models.js";

const createPlaylist = asyncHandler( async (req,res) => {
    
    const {name,description} = req.body
    const user = req.user._id 

    if (!name) {
        throw new ApiError(404,"Name is required ")
    }

    const playlist = await Playlist.create({
        name , 
        description,
        owner : user
    })

    return res
    .status(201)
    .json(new ApiResponse(201,playlist,"Playlist Created Successfully"))

})

const getUserPlaylists = asyncHandler( async (req,res) => {

    const {userId} = req.params

    const playlists = await Playlist.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup : {
                from : "users" ,
                localField : "owner" ,
                foreignField : "_id" ,
                as : "userplaylistsinfo"
            }
        },
        {
            $project : {
                name : 1,
                description : 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200,playlists,"Users all Playlists fetched successfully"))

})

const getPlaylistById = asyncHandler( async (req,res) => {

    const {playlistId} = req.params

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404,"Playlist does not exist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,playlist,"Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler( async (req,res) => {

    const {playlistId, videoId} = req.params

    const existPlaylist = await Playlist.findById(playlistId)

    if (!existPlaylist) {
        throw new ApiError(404,"Playlist does not exist")
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId , 
        {
            $addToSet : {
                videos : videoId
            }
        },
        { 
            new : true
        }
    )

    return res
    .status(200)
    .json(new ApiResponse(200,playlist,"Video added successfully"))

})

const removeVideoFromPlaylist = asyncHandler( async (req,res) => {

    const {playlistId,videoId} = req.params

    const existPlaylist = await Playlist.findById(playlistId)

    if (!existPlaylist) {
        throw new ApiError(404 , "Playlist not found")
    }

    const removeVideo = await Playlist.findByIdAndUpdate(
        playlistId , 
        {
            $pull : {
                videos : videoId
            }
        },
        {
            new :true
        }
    )

    return res
    .status(200)
    .json(new ApiResponse(200,removeVideo,"Video removed from playlist successfully"))

})

const deletePlaylist = asyncHandler( async (req,res) => {

    const {playListId} = req.params
    const existPlaylist = await Playlist.findById(playListId)

    if (!existPlaylist) {
        throw new ApiError(404 , "Playlist not found")
    }

    const playlist = await Playlist.findByIdAndDelete(playListId)

    return res
    .status(200)
    .json(new ApiResponse(200,playlist,"Playlist deleted "))
})

const updatePlaylist = asyncHandler( async (req,res) => {

    const {playListId} = req.params
    const {name, description} = req.body
    const existPlaylist = await Playlist.findById(playListId)

    if (!existPlaylist) {
        throw new ApiError(404 , "Playlist not found")
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playListId,
        {
            $set : {
                name,
                description
            }
        },
        {
            new : true
        }
    )
    
    return res
    .status(200)
    .json(new ApiResponse(200,playlist,"Playlist updated successfully"))

})

export {createPlaylist,
        getUserPlaylists
}