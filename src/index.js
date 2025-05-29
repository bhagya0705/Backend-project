import express from "express";
import connectDB from "./db/db.js";    
import dotenv from "dotenv";
dotenv.config();

connectDB();

// ;(async()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGO_URI}`)
//         app.on("error", (err) => {
//             console.error("Server error:", err);
//             throw err;
//         });

//         app.listen(process.env.PORT, () => {
//             console.log(`Server is running on port ${process.env.PORT}`);
//         });
//     }
//     catch(error){
//         console.error("Error connecting to MongoDB:", error);
        
//     }
// })()