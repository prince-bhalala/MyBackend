import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uplodOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        
        const user  = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return {accessToken,refreshToken}


    } catch (error) {
        throw new ApiError(500,"Something Went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler( async (req , res) => {
    //get user details from frontend
    // validation - not empty
    //check if user already exites : username , email
    //check for images , check for avatar
    //uplod than to cloudinary  , avatar 
    // create user object  - create entry in db
    // remove pass and refresh token field from response
    // check for user creation 
    // return response

    const {fullname,email,username,password} = req.body
    // console.log("email : ",email);
    
    if ( [fullname,email,username,password].some( (field) => field?.trim() ==="" ) ) {
        throw new ApiError(400,"All fields are required")      
    }


    const existedUSer = await User.findOne( {
        $or : [{ username },{ email }]
    } )

    if(existedUSer){
        throw new ApiError(409,"User with email or username")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath ;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar  = await uplodOnCloudinary(avatarLocalPath)
    const coverImage  = await uplodOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400,"Avatar file is required")
    }

    const user = await User.create({
        fullname,
        avatar :    {
                        url : avatar.url ,
                        public_id :  avatar.public_id
                    },
        coverImage :    {
                        url : coverImage?.url || "" ,
                        public_id :  coverImage?.public_id || ""
                    },
        email,
        password,
        username : username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select( "-password -refreshToken")

    if (!createdUser) {
        throw new ApiError(500,"Somthing Went wrong while registring a user")
    }

    return res
    .status(201)
    .json(new ApiResponse(200,createdUser ,"User Registred Successfully "))

})

const loginUser = asyncHandler( async (req , res) => {
    //req body -> data
    //username or email 
    //find the user
    //password check
    //access adn refresh token
    // send cookie 


    const {email,username,password} = req.body

    if (!username && !email) {
        throw new ApiError(400,"Username or Email is required")
    }

    const user = await User.findOne({
        $or : [{ username },{ email }]
    })

    if (! user) {
        throw new ApiError(404,"User does not Exits")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (! isPasswordValid) {
        throw new ApiError(401,"Invalid user credentials")
    }

    const {accessToken , refreshToken} =  await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,{
                user : loggedInUser , accessToken ,refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req,res) => {
    User.findByIdAndUpdate(
        req.user._id,{
            $unset : {refreshToken : 1}
            
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }
    
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logged Out "))
})

const refreshAccessToken = asyncHandler( async (req,res) => {
   const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken

   if (!incomingRefreshToken) {
     throw new ApiError(401,"Unauthorized request")
   }
try {
    
       const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
    
       const user = await User.findById(decodedToken?._id)
    
       if (!user) {
        throw new ApiError(401,"Invalid Refresh Token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const options = {
            httpOnly : true,
            secure : true
        }
       const {newaccessToken,newrefreshToken} = await generateAccessAndRefereshTokens(user._id)
       return res
       .status(200)
       .cookie("accessToken",newaccessToken,options)
       .cookie("RefreshToken",newrefreshToken,options)
       .json( new ApiResponse(
        200,
        {
            accessToken,refreshToken : newrefreshToken
        }
       ))
} catch (error) {
    throw new ApiError(401,error?.message || "Invalid Refresh Token")
}
})

const changeCurrentPassword = asyncHandler( async (req,res) => {
    const {oldPassword , newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (! isPasswordCorrect) {
        throw new ApiError(400,"Invalid old password")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave : false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password Changed Successfully "))
})

const getCurrentUser = asyncHandler( async (req,res) => {
    return res
    .status(200)
    .json(new ApiResponse(200 , req.user,"Current User fetched Successfully"))
})

const updateAccountDetails = asyncHandler( async(req,res) => {
    const {fullname,email} = req.body

    if (!fullname || !email) {
        throw new ApiError(400,"All fileds are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
    {
        $set : {
            fullname,
            email
        }
    },
    {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account detaild updat success]fully"))

})

const updateUserAvatar = asyncHandler( async (req,res) => {

    const avatarLocalPath = req.file?.path

    if (! avatarLocalPath) {
        new ApiError(400,"Avatar file ismissing")
    }

    const deltedAvatar = await deleteFromCloudinary(req.user.avatar.public_id)

    const avatar = await uplodOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400,"Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                avatar: {   
                            url : avatar.url,
                            public_id : avatar.public_id
                        }
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"avatar Updated Successfully"))

})

const updateUserCoverImage = asyncHandler( async (req,res) => {
    const coverImageLocalPath = req.file?.path

    if (! coverImageLocalPath) {
        new ApiError(400,"coverImage file ismissing")
    }

    const coverImage = await uplodOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400,"Error while uploading on coverImage")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                coverImage : {  
                                url : coverImage.url,
                                public_id : coverImage.public_id
                            }
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"CoverImage Updated Successfully"))

})
    
const getUserChannelProfile = asyncHandler( async(req,res ) => {
   const {username} =  req.params

   if (!username?.trim()) {
    throw new ApiError(400,"Username is missing")
   }


   const channel  = await User.aggregate([
    {
        $match : {
            username : username?.toLowerCase()
        }
   },
   {
        $lookup : {
            from : "subscriptions",
            localField : "_id",
            foreignField : "channel",
            as : "subscribers"
        }
   },
   {
        $lookup : {
            from : "subscriptions",
            localField : "_id",
            foreignField : "subscriber",
            as : "subscribedTo"
        }
   },
   {
        $addFields : {
            subscribersCount : {
                $size : "$subscribers"
            },
            
            subscribedToCount : {
                $size : "$subscribedTo"
            },

            isSubscribed : {
                $cond : {
                    if : {$in : [req.user?._id , "$subscribers.subscriber"]},
                    then : true,
                    else : false
                }
            }

            
        }    
   },{

    $project : {
        fullname : 1,
        username : 1,
        subscribersCount : 1,
        subscribedToCount : 1,
        avatar : 1,
        coverImage : 1,
        email : 1

    }

}

])

    if (!channel.length) {
        throw new ApiError(404,"Channel dose not exists")
    }

    return res
    .status(200)
    .json(new ApiResponse(200 ,channel[0],"User channel fetched successfully "))

})

const getWatchHistory = asyncHandler( async(req,res) => {
    const user = await User.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "wathcHistory",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline : [
                                {
                                    $project : {
                                        fullname : 1,
                                        username : 1,
                                        avatar : 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields : {
                            owner : {
                                $first : "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200 , user[0].watchHistory, "Watch history Fecthed Successfully "))
})

export { registerUser , 
        loginUser,
        logoutUser, 
        refreshAccessToken,
        changeCurrentPassword,
        getCurrentUser,
        updateAccountDetails,
        updateUserAvatar,
        updateUserCoverImage,
        getUserChannelProfile,
        getWatchHistory
    }