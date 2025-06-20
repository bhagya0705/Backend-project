import mongoose,{Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        username:{
            type: String,
            required:true,
            unique:true,
            trim:true,
            lowercase:true,
            index:true
        },

        email:{
            type: String,
            required:true,
            unique:true,
            trim:true
        },

        password:{
            type: String,
            required:[true, 'Password is required'],
            minlength:[6, 'Password must be at least 6 characters'],
            trim:true
        },

        fullName:{
            type: String,
            required:true,
            trim:true,
            index:true
        },

        avatar:{
            type: String,
            required:true
        },

        coverImage:{
            type: String,
        },

        watchHistory:[
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],

        refreshToken:{
            type: String,
        }
    },{timestamps:true}
)

//Middleware pre hook to hash password before saving
userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password,10);
    next();
})

userSchema.methods.isCorrectPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        { 
            _id: this._id, 
            email: this.email,
            username: this.username,
            fullName: this.fullName,
        }, 
        
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken=function (){
    return jwt.sign(
        {
            _id: this._id,
            
        },

        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema);


