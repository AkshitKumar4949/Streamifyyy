import User from "../models/User.js"
import jwt from "jsonwebtoken"
import { upsertStreamUser } from "../lib/stream.js"
export async function signup(req, res) {
    const { email, password, fullName } = req.body
    try {
        if (!email || !password || !fullName) {
            return res.status(400).json({ message: "All fields are required" })
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" })
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }
        const existingUser = await User.findOne({email})
        if(existingUser){
            return res.status(400).json({message:"Email already exists, use a different email to register"})
        }

        const idx = Math.floor(Math.random() * 100)+1
        const randomAvatar = `https://api.dicebear.com/9.x/adventurer/png?seed=${idx}`
        const newUser = await User.create({
            email:email,
            password:password,
            fullName:fullName,
            profilePic:randomAvatar
        })

        try{
            await upsertStreamUser({
                id:newUser._id.toString(),
                name:newUser.fullName,
                image:newUser.profilePic || ""
            })
            console.log(`Stream user upserted successfully for ${newUser.fullName}`)
        }
        catch(error){
            console.log("Error upserting Stream User")
        }

        const token = jwt.sign({
            userId:newUser._id
        },process.env.JWT_SECRET_KEY,{
            expiresIn:"7d"
        })

        res.cookie("token",token,{
            maxAge:7*24*60*60*1000,
            httpOnly:true, // This prevents XSS
            sameSite:"strict", // This prevents CSRF
            secure: process.env.NODE_ENV === "production"
        })
        res.status(201).json({success:true,user:newUser})
    }
    catch (error) {
        console.error("Error in signup controller: ", error)
        res.status(500).json({ message: "Internal Server error" })
    }
}
export async function login(req, res) {
    try{
        const {email,password} = req.body
        if(!email || !password){
            return res.status(400).json({message:"All fields required"})
        }
        const user = await User.findOne({email})
        if(!user){
            return res.status(401).json({message:"Invalid credentials"})
        }
        const isPasswordCorrect = await user.matchPassword(password)
        if(!isPasswordCorrect){
            return res.status(401).json({message:"Invalid credentials"})
        }

        const token = jwt.sign({userId:user._id},process.env.JWT_SECRET_KEY,{
            expiresIn:"7d",
        })
        res.cookie("token",token,{
            maxAge: 7*24*60*60*1000,
            httpOnly:true, // prevents XSS attacks
            secure: process.env.NODE_ENV==="production",
            sameSite:"strict"
        })
        res.status(200).json({success:true,user})
    }
    catch(err){
        console.error("Error in login controller: ", err.message)
        res.status(500).json({ message: "Internal Server error" })
    }
}
export async function logout(req, res) {
    res.clearCookie("token")
    res.status(200).json({message:"Logged out successfully"})
} 

export async function onboard(req,res){
    try{
        const userId = req.user._id
        const {fullName,bio,nativeLanguage,learningLanguage,location} = req.body
        if(!fullName||!bio||!nativeLanguage||!learningLanguage||!location){
            return res.status(400).json({
                message:"All fields are required",
                missingFields:[
                    !fullName && "fullName",
                    !bio && "bio",
                    !nativeLanguage && "nativeLanguage",
                    !learningLanguage && "learningLanguage",
                    !location && "location"
                ].filter(Boolean)
            })
        }
        const updatedUser = await User.findByIdAndUpdate(userId,{
            ...req.body,
            isOnboarded:true
        },{new:true})
        if(!updatedUser){
            return res.status(404).json({message:"User not found"})
        }

        try{
            await upsertStreamUser({
                id:updatedUser._id.toString(),
                name:updatedUser.fullName,
                image:updatedUser.profilePic || ""
            })
            console.log(`Stream user updated after onboarding for ${updatedUser.fullName}`)
        }
        catch(error){
            console.error("Error upserting Stream User: ", error)
        }
        res.status(200).json({success:true,user:updatedUser})
    }
    catch(error){
        console.log("Onboarding error: ",error)
        res.status(500).json({message:"Internal server error"})
    }
}