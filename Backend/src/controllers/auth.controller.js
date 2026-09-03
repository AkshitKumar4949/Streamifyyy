import User from "../models/User.js"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { OAuth2Client } from "google-auth-library"
import { upsertStreamUser } from "../lib/stream.js"
import { sendVerificationEmail } from "../lib/mail.js"

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const createAuthCookie = (res, userId) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET_KEY, {
        expiresIn: "7d",
    })

    res.cookie("token", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
    })
}

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
        const normalizedEmail = email.trim().toLowerCase()
        const existingUser = await User.findOne({ email: normalizedEmail })
        if(existingUser){
            return res.status(400).json({message:"Email already exists, use a different email to register"})
        }

        const idx = Math.floor(Math.random() * 100)+1
        const randomAvatar = `https://api.dicebear.com/9.x/adventurer/png?seed=${idx}`
        const verificationCode = crypto.randomInt(100000, 1000000).toString()
        const newUser = await User.create({
            email:normalizedEmail,
            password:password,
            fullName:fullName,
            profilePic:randomAvatar,
            verificationCode,
            verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000),
        })

        try{
            await sendVerificationEmail(newUser.email, verificationCode)
        }
        catch(error){
            await newUser.deleteOne()
            console.error("Error sending verification email: ", error.message)
            return res.status(500).json({ message: "Could not send verification email" })
        }

        res.status(201).json({success:true,message:"Verification code sent to your email"})
    }
    catch (error) {
        console.error("Error in signup controller: ", error)
        res.status(500).json({ message: "Internal Server error" })
    }
}

export async function verifyEmail(req, res) {
    try {
        const { email, code } = req.body
        const user = await User.findOne({ email: email?.trim().toLowerCase() })

        if (!user || user.isVerified || user.verificationCode !== code || user.verificationCodeExpires < new Date()) {
            return res.status(400).json({ message: "Invalid or expired verification code" })
        }

        user.isVerified = true
        user.verificationCode = null
        user.verificationCodeExpires = null
        await user.save()

        await upsertStreamUser({
            id: user._id.toString(),
            name: user.fullName,
            image: user.profilePic || "",
        })
        createAuthCookie(res, user._id)
        res.status(200).json({ success: true, user })
    }
    catch (error) {
        console.error("Error in email verification: ", error)
        res.status(500).json({ message: "Internal Server error" })
    }
}

export async function googleAuth(req, res) {
    try {
        const { credential } = req.body
        if (!credential) {
            return res.status(400).json({ message: "Google credential is required" })
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        })
        const payload = ticket.getPayload()

        if (!payload?.email || !payload.email_verified || !payload.sub) {
            return res.status(401).json({ message: "Google account email is not verified" })
        }

        const email = payload.email.toLowerCase()
        let user = await User.findOne({ email })

        if (user) {
            user.googleId = payload.sub
            user.isVerified = true
            if (!user.profilePic && payload.picture) user.profilePic = payload.picture
            await user.save()
        } else {
            user = await User.create({
                googleId: payload.sub,
                email,
                fullName: payload.name || email.split("@")[0],
                password: crypto.randomBytes(32).toString("hex"),
                profilePic: payload.picture || "",
                isVerified: true,
            })
        }

        await upsertStreamUser({
            id: user._id.toString(),
            name: user.fullName,
            image: user.profilePic || "",
        })
        createAuthCookie(res, user._id)
        res.status(200).json({ success: true, user })
    }
    catch (error) {
        console.error("Google authentication error: ", error)
        res.status(401).json({ message: "Google authentication failed" })
    }
}

export async function login(req, res) {
    try{
        const {email,password} = req.body
        if(!email || !password){
            return res.status(400).json({message:"All fields required"})
        }
        const user = await User.findOne({email: email.trim().toLowerCase()})
        if(!user){
            return res.status(401).json({message:"Invalid credentials"})
        }
        const isPasswordCorrect = await user.matchPassword(password)
        if(!isPasswordCorrect){
            return res.status(401).json({message:"Invalid credentials"})
        }
        if (!user.isVerified) {
            return res.status(403).json({message:"Please verify your email before signing in"})
        }

        createAuthCookie(res, user._id)
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

export async function updateProfile(req, res) {
    try {
        const { profilePic } = req.body

        if (!profilePic || !/^data:image\/(png|jpeg|jpg|webp);base64,/.test(profilePic)) {
            return res.status(400).json({ message: "Please provide a valid image" })
        }

        if (profilePic.length > 3 * 1024 * 1024) {
            return res.status(400).json({ message: "Image must be smaller than 2 MB" })
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { profilePic },
            { new: true }
        )

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" })
        }

        await upsertStreamUser({
            id: updatedUser._id.toString(),
            name: updatedUser.fullName,
            image: updatedUser.profilePic,
        })

        res.status(200).json({ success: true, user: updatedUser })
    }
    catch (error) {
        console.error("Profile update error: ", error)
        res.status(500).json({ message: "Internal server error" })
    }
}