import mongoose , {Schema} from "mongoose";


const suscriptionSchema = new Schema({
    subscriber : {
        type :Schema.Types.ObjectId,// one who is suscribing
        ref : "User"
    },
    channel : {
        type :Schema.Types.ObjectId,// one whom is 'subscriber' to suscribing
        ref : "User"
    },
},{timestamps:true})

    
export const Subscription = mongoose.model("Subscription",suscriptionSchema)
