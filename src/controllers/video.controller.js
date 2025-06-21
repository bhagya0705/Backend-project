import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

//TODO publish video
// get the video file,title,description,duration,thumbnail from user
// upload video file to cloudinary
// create video document in database

const publishVideo = asyncHandler(async(req, res) => {
    const {title,duration,description} = req.body;
    if(!title || !duration || !description) {
        throw new ApiError(400, "Title, duration and description are required");
    }

    const videoFilePath = req.files?.videoFile[0].path;
    if(!videoFilePath) {
        throw new ApiError(400, "Video file is required");
    }

    const thumbnailFilePath = req.files?.thumbnail[0].path;
    if(!thumbnailFilePath) {
        throw new ApiError(400, "Thumbnail file is required");
    }

    const video = await uploadOnCloudinary(videoFilePath);
    if(!video) {
        throw new ApiError(500, "Failed to upload video to cloudinary");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailFilePath);
    if(!thumbnail) {
        throw new ApiError(500, "Failed to upload thumbnail to cloudinary");
    }

    const ownerId = req.user._id;
    const owner = await User.findById(ownerId).select("username avatar");

    const newVideo = Video.create({
        videoFile:video.url,
        thumbnail:thumbnail.url,
        title,
        description,
        duration,
        views:0,
        isPublished:true,
        owner
    })

})

const getVideoById = asyncHandler(async(req, res) => {
    const {videoId} = req.params;
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    const video = await Video.findById(videoId);
    if(!video) {
        throw new ApiError(404, "Video not found");
    }
    
    return res.status(200).json(
        new ApiResponse(200, video, "Video fetched successfully")
    );

})

const getAllVideos = asyncHandler(async(req, res) => {
    const {page=1,limit=10,sortBy,sortType,userId} = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const filter={
        isPublished:true
    }

    if(query){
        filter.$or=[
            {title: {$regex: query, $options: "i"}},
            {description: {$regex: query, $options: "i"}}
        ]
    }

    if(userId){
        filter.owner = userId;
    }

    const sortOrder = sortType===asc? 1:-1;
    const sort = {[sortBy]:sortOrder};

    const videos = await Video.find(filter).sort(sort).skip((page-1)*limit).limit(limit)
    return res.status(200).json(
        new ApiResponse(200, videos, "Videos fetched successfully")
    )
})

const updateVideo = asyncHandler(async(req, res) => {
    const {videoId} = req.params;
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if(!video) {
        throw new ApiError(404, "Video not found");
    }

    const {title, description} = req.body;
    if(!title && !description) {
        throw new ApiError(400, "Title or description is required to update video");
    }
    
    if(title) video.title = title;
    if(description) video.description = description;

    await video.save();

    return res.status(200).json(
        new ApiResponse(200, video, "Video updated successfully")
    );
})

const deleteVideo = asyncHandler(async(req, res) => {
    const {videoId} = req.params;
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findByIdAndDelete(videoId);
    if(!video) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(
        new ApiResponse(200, null, "Video deleted successfully")
    );
})

export {publishVideo, getVideoById, updateVideo,deleteVideo,getAllVideos};