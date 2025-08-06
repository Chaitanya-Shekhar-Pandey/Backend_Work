import dotenv from "dotenv";
import connectdb from "./db/index.js";
import express from 'express'
import {app} from "./app.js";

// const app = express()
dotenv.config({
    path : './env'
})

connectdb()
.then(()=>{
    app.on("Error",(error)=>{
        console.error("Error",error)
        throw error
    })

    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Application Server is Listening on Port : ${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.error("Error On Database Connection" , error)
})

app.listen(8000, () => {
    console.log(`Server running on http://localhost:${process.env.PORT}`);
});



// import mongoose from "mongoose";
// import { DB_NAME } from "./constants.js";

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