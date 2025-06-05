import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import connectDB from "./db/db.js";    

connectDB().then(()=>{
    app.on("error", (err) => {
        console.error("Server error:", err);
        throw err;
    });

    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
});

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