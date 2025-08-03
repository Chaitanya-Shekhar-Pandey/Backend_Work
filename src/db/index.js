import mongoose from "mongoose";
import {DB_NAME} from "../constants.js"

const connectdb = async()=>{
    try {
        const dataconnect = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`Database Connection Done !! ${dataconnect.connection.host}` )
    } catch (error) {
        console.error("Database Connection Failed : " ,error)
        process.exit(1)
    }
}

export default connectdb