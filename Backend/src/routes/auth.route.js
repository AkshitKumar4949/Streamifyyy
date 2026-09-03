import express from 'express';
import { signup,login,logout,onboard,verifyEmail,updateProfile,googleAuth} from '../controllers/auth.controller.js';
import {protectRoute} from "../middleware/auth.middleware.js"
const router = express.Router()

router.post("/signup",signup)
router.post("/verify-email",verifyEmail)
router.post("/google",googleAuth)
router.post("/login",login)
router.post("/logout",logout) // Post method is for those operations that change the server state.

router.post("/onboarding",protectRoute,onboard)
router.patch("/profile",protectRoute,updateProfile)
router.get("/me",protectRoute,(req,res)=>{
    res.status(200).json({success:true,user:req.user})
})
export default router;