import {asyncHandler} from '../utils/asyncHandler.js';
import { User } from '../models/user.models.js';
import {uploadonCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import {ApiError} from "../utils/ApiError.js"


const registerUser= asyncHandler(async (req, res) => {
  const {fullName,email,username, password} = req.body;
  // console.log("Username: ",username);

  // Check if all fields are provided
  if(
    [fullName,email,username, password].some(
      (field) => !field || field.trim() === ''
    )
  )
  {
    console.log("All fields are required");
    throw new ApiError(
      400, 
      "All fields are required"
    );
  }

  // Check if user exists or not
  const existedUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  console.log("Existed User: ",existedUser);

  if(existedUser) {
    throw new ApiError(
      400,"User already exists with this email or username")
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;   // Get the local path of the uploaded avatar
  const coverImageLocalPath = req.files?.coverImage[0]?.path; // Get the local path of the uploaded cover image

  if(!avatarLocalPath) {
    throw new ApiError(
      400, "Avatar is required")
  }

  const avatar = await uploadonCloudinary(avatarLocalPath) // Upload the avatar to Cloudinary
  const coverImage = await uploadonCloudinary(coverImageLocalPath); // Upload the cover image to Cloudinary

  if(!avatar) {
    throw new ApiError(
      500, 
      "Error uploading avatar to Cloudinary"
    );
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage:coverImage?.url||"",
    email,
    password,
    username: username.toLowerCase()
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser) {
    throw new ApiError(
      500, 
      "Error creating user"
    );
  }
 })

 return res.status(201).json(
  new ApiResponse(
    200, 
    createdUser, 
    "User registered successfully"
  )
 )

export {registerUser};