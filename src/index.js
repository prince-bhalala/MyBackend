import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";


dotenv.config({
    path:'./.env'
});


connectDB()
.then( () => {
    app.listen(process.env.PORT || 3000 , () => {
        console.log(`Server are Runing at PORT : ${process.env.PORT}`);
        app.on("error", (error) => {
            console.log("Error : ", error);
            throw error;            
        })
    })
})
.catch((error) => {
    console.log("MONGO db Connection Failed !!!! ", error)
})