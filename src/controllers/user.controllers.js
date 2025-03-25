import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uplodOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

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
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select( "-password -refreshToken")

    if (!createdUser) {
        throw new ApiError(500,"Somthing Went wrong while registring a user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser ,"User REgisterd Successfully ")
    )

})

const loginUser = asyncHandler( async (req , res) => {
    //req body -> data
    //username or email 
    //find the user
    //password check
    //access adn refresh token
    // send cookie 


    const {email,username,password} = req.body

    if (!username || !email) {
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
            $set : {refreshToken : undefined}
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


export { registerUser , loginUser,logoutUser }