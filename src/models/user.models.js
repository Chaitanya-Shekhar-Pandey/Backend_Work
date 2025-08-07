import mongoose, {Schema} from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userschema = Schema({
    username:{
        type : String,
        required: true,
        lowercase : true,
        unique : true,
        index : true,
        trim : true
    },
    email:{
        type : String,
        required: true,
        lowercase : true,
        unique : true,
    },
    fullname:{
        type : String,
        required: true,
        lowercase : true,
        index : true,
    },
    avatar:{
        type:String,
        required:true
    },
    coverImage:{
        type : String
    },
    password:{
        type : String,
        required : [true , "Password is Necessary"]
    },
    refreshToken:{
        type : String,
        default : ""
    },
    watchHistory:[
        {
            type: Schema.Types.ObjectId,
            ref : "Video"
        }
    ],
},{timestamps:true})


userschema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    try {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (error) {
        next(error); 
    }
})

userschema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

userschema.methods.generateAccessToken = function(){
    return jwt.sign(
    {
        _id : this._id,
        email: this.email,
        username : this.username,
        fullname : this.fullname
    }, 
    process.env.ACCESS_TOKEN_VAL,
    {
        expiresIn : process.env.ACCESS_TOKEN_EXP
    }
)
}

userschema.methods.generateRefreshToken = function(){
    return jwt.sign(
    {
        _id : this._id,
    }, 
    process.env.REFRESH_TOKEN_VAL,
    {
        expiresIn : process.env.REFRESH_TOKEN_EXP
    }
)
}

export const User = mongoose.model("User" , userschema)