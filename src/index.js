import dotenv from "dotenv";
import connectdb from "./db/index.js";

dotenv.config({
    path : './env'
})

connectdb();




// import mongoose from "mongoose";
// import express from 'express'
// import { DB_NAME } from "./constants.js";
// const app = express()

// (async () => {
//     try {
//         const conndb = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
//         app.on("Error", (error)=>{
//             console.error("Error",error)
//             throw error
//         })

//         app.listen(process.env.PORT ,()=>{
//             console.log(`App is listening on the Port : ${process.env.PORT}`)
//         })
//     } catch (error) {
//         console.log("Database Connection Error : ",error)
//         throw new Error("Error 01");
//     }
// })()