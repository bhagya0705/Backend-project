import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'; //Cookie parser is used for parsing cookies in requests

const app = express();

app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
export default app;