import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const helthcheck = asyncHandler( async (req,res) => {
    return res
    .status(200)
    .json(new ApiResponse(200,null,"Everithing is okay"))
})

export {helthcheck}