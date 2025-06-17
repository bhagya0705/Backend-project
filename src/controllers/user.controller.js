import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.models.js';
import { uploadonCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from "../utils/ApiError.js";
import jwt from 'jsonwebtoken';

const generateAccessandRefreshTokens = async (userId)=>{

  try {
    const user = await User.findById(userId);
    const accessToken =  user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken; // Save the refresh token in the user document
    await user.save({ validateBeforeSave: false }); // Save the user document without validation
    return { accessToken, refreshToken };

  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new ApiError(500, "Internal server error while generating tokens");
  }
}

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;
  // console.log("Username: ",username);

  // Check if all fields are provided
  if (
    [fullName, email, username, password].some(
      (field) => !field || field.trim() === ''
    )
  ) {
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

  if (existedUser) {
    throw new ApiError(
      400, "User already exists with this email or username")
  }

  console.log("Files: ", req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;   // Get the local path of the uploaded avatar
  const coverImageLocalPath = req.files?.coverImage[0]?.path; // Get the local path of the uploaded cover image

  if (!avatarLocalPath) {
    throw new ApiError(
      400, "Avatar is required")
  }

  const avatar = await uploadonCloudinary(avatarLocalPath) // Upload the avatar to Cloudinary
  const coverImage = await uploadonCloudinary(coverImageLocalPath); // Upload the cover image to Cloudinary

  if (!avatar) {
    throw new ApiError(
      500,
      "Error uploading avatar to Cloudinary"
    );
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if (!createdUser) {
    throw new ApiError(
      500,
      "Error creating user"
    );
  }

  return res.status(201).json(
    new ApiResponse(
      200,
      createdUser,
      "User registered successfully"
    )
  )




});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  if (!email && !username) {
    throw new ApiError(400, "Email or username is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }]
  })

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordMatch = await user.isCorrectPassword(password);
  if (!isPasswordMatch) {
    throw new ApiError(400, "Incorrect password");
  }

  const { accessToken, refreshToken } = await generateAccessandRefreshTokens(user._id);

  const loggedinUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {      // cookies configuration options
    httpOnly: true,
    secure: true
  }

  return res.status(200).cookie("refreshToken", refreshToken, options).cookie("accessToken", accessToken, options).json(
    new ApiResponse(200, loggedinUser, "User logged in successfully"))
})

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1
      }
    },
    { 
      new: true 
    }
  );

   const options = {      // cookies configuration options
    httpOnly: true,
    secure: true
  }

  return res.status(200).clearCookie("refreshToken",options).clearCookie("accessToken",options).json(
    new ApiResponse(200, null, "User logged out successfully")
  );
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(400, "Unauthorized request for token refresh");
    }

    try {
      const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
      const user = await User.findById(decodedToken?._id);
      if(!user){
        throw new ApiError(404, "Invalid refresh token");
      }
  
      if(incomingRefreshToken !== user.refreshToken){
        throw new ApiError(401, "Refresh token mismatch");
      }
  
      const options ={
        httpOnly: true,
        secure: true
      }
  
      const { accessToken, newrefreshToken } = await generateAccessandRefreshTokens(user._id);
  
      return res.status(200).cookie("refreshToken", newrefreshToken, options).cookie("accessToken", accessToken, options).json(
        new ApiResponse(200,{accessToken,newrefreshToken} , "Access token refreshed successfully")
      );
    } catch (error) {
      console.error("Error refreshing access token:", error);
      throw new ApiError(400, error?.message || "Invalid refresh token");
      
    }
})

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);
  const isPasswordMatch = await user.isCorrectPassword(currentPassword);
  if (!isPasswordMatch) {
    throw new ApiError(400, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(200, null, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, req.user, "Current user fetched successfully")
  );
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {new: true}
        
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});

const updateAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadonCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateCoverImage = asyncHandler(async(req, res) => {
    const imageLocalPath = req.file?.path

    if (!imageLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const coverImage = await uploadonCloudinary(imageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on cover image")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})



  export { registerUser, loginUser, logoutUser,refreshAccessToken,changePassword, getCurrentUser,updateAccountDetails,updateAvatar,updateCoverImage };