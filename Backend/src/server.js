import express from 'express'
import dotenv from 'dotenv'
import cookieParser from "cookie-parser"
import cors from 'cors'
dotenv.config()
import path from "path"
import { connectDB } from './lib/db.js'
import authRoutes from "./routes/auth.route.js"
import userRoutes from "./routes/user.route.js"
import chatRoutes from "./routes/chat.route.js"

const app = express()
const PORT = process.env.PORT || 5001

const __dirname = path.resolve()
app.use(cors({
    origin: 'http://localhost:5173',
    credentials:true,//allow cookies to be sent by frontend
}))
app.use(express.json({ limit: "4mb" }))
app.use(cookieParser())

app.use("/api/auth",authRoutes)
app.use("/api/users",userRoutes)
app.use("/api/chat",chatRoutes)

if(process.env.NODE_ENV==="production"){
    app.use(express.static(path.join(__dirname,"../Frontend/dist")))
    app.get("*",(req,res)=>{
        res.sendFile(path.join(__dirname, "../Frontend","dist","index.html"))
    })
}

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
    connectDB()
})