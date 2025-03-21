import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { jwt } from "jsonwebtoken";

const userSchema = new Schema(
    {
        username : {
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true,
            index : true
        },
        email : {
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true,
        },
        fullname : {
            type : String,
            required : true,
            trim : true,
            index : true
        },
        avatar : {
            type : String, // cloudniary url
            required : true,
        },
        coverImage : {
            type : String, // cloudniary url
        },
        wathchHistory : [
            {
                type : mongoose.Typese.ObjectId,
                ref : "Video"
            }
        ],
        password : {
            type : String,
            required : [true,"Password is required"],
        },
        refreshToken : {
            type : String
        }


},{timestamps : true})


userSchema.pre("save",async function (next) {
    if(this.isModified("password")){
        this.password = bcrypt.hash(this.password , 10)
        next()
    }
})

userSchema.methods.isPasswordCorrect = async function (password) {
   return await bcrypt.compare(password , this.password)
}

userSchema.mathods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            username : this.username,
            fullname : this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.mathods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id : this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User = mongoose.model("User",userSchema)