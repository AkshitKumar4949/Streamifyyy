import User from "../models/User.js"
import FriendRequest from "../models/FriendRequest.js"

export async function getRecommendedUsers(req,res){
    try{
        const currentUserId = req.user.id
        const currentUser = req.user

        const recommendedUsers = await User.find({
            $and:[
                {_id: {$ne: currentUserId}},// Exclude current user
                {_id: {$nin: currentUser.friends}},// Exclude existing friends
                {isOnboarded:true}
            ]
        })
        res.status(200).json(recommendedUsers)
    }
    catch(error){
        console.log("Error fetching recommended users:",error.message)
        res.status(500).json({message:"Internal server error"})
    }
}

export async function getFriends(req,res){
    try{
        const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1)
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 12, 1), 50)
        const user = await User.findById(req.user.id).select("friends")
        if (!user) return res.status(404).json({ message: "User not found" })

        const skip = (page - 1) * limit
        const friendIds = user.friends.slice(skip, skip + limit)
        const friends = await User.find({ _id: { $in: friendIds } })
            .select("fullName profilePic nativeLanguage learningLanguage")

        res.status(200).json({
            friends,
            page,
            hasMore: skip + friends.length < user.friends.length,
            total: user.friends.length,
        })
    }
    catch(error){
        console.error("Error fetching friends:",error.message)
        res.status(500).json({message:"Internal server error"})
    }
}

export async function sendFriendRequest(req,res){
    try{
        const myId = req.user.id
        const {id:recipientId} = req.params

        // Prevent sending request to self
        if(myId===recipientId){
            return res.status(400).json({message:"You cannot send friend request to yourself"})
        }

        // Check if recipient exists
        const recipient = await User.findById(recipientId)
        if(!recipient){
            return res.status(400).json({message:"Recipient id is required"})
        }

        // check if you are already friends
        if(recipient.friends.includes(myId)){
            return res.status(400).json({message:"You are already friends with user"})
        }

        // check if you have already sent a friend request or vice-versa
        const existingRequest = await FriendRequest.findOne({
            $or:[
                {sender:myId,recipient:recipientId},
                {sender:recipientId,recipient:myId},
            ],
        })

        if(existingRequest){
            return res.status(400).json({message:"Friend request already exists between both of you"})
        }

        const friendRequest = await FriendRequest.create({
            sender:myId,
            recipient:recipientId
        })
        res.status(201).json({message:"Friend request send successfully"})
    }
    catch(error){
        console.error("Error sending friend request:",error.message)
        return res.status(500).json({message:"Internal server error"})
    }
}

export async function acceptFriendRequest(req,res){
    try{
        const {id:requestId} = req.params
        const friendRequest = await FriendRequest.findById(requestId)

        if(!friendRequest){
            return res.status(400).json({message:"Frieend request not found"})
        }

        // check if current user is recipient of request
        if(friendRequest.recipient.toString()!==req.user.id){
            return res.status(403).json({message:"You are not authorized to accept this request"})
        }

        friendRequest.status = "accepted"
        await friendRequest.save()

        // adding each other to friend list

        // addToSet is used to prevent duplicate entries in friends array insted of using push as addToSet will only add if value isn't in the list already
        await User.findByIdAndUpdate(friendRequest.sender,{$addToSet:{friends:friendRequest.recipient}})

        await User.findByIdAndUpdate(friendRequest.recipient,{$addToSet:{friends:friendRequest.sender}})

        res.status(200).json({message:"Friend request accepted successfully"})
    }
    catch(error){
        console.log("Error accepting friendRequest:",error.message)
        return res.status(500).json({message:"Internal server error"})
    }
}

export async function getFriendRequests(req,res){
    try{
        const incomingReqs = await FriendRequest.find({
            recipient:req.user.id,
            status:"pending",
        }).populate("sender","fullName profilePic nativeLanguage learningLanguage")

        const acceptedReqs = await FriendRequest.find({
            sender:req.user.id,
            status:"accepted",
        }).populate("recipient","fullName profilePic")

        res.status(200).json({incomingReqs,acceptedReqs})
    }
    catch(error){
        console.error("Error fetching friend requests:",error.message)
        res.status(500).json({message:"Internal server error"})
    }
}

export async function getOutgoingFriendReqs(req,res){
    try{
        const outgoingRequests = await FriendRequest.find({
            sender:req.user.id,
            status:"pending"
        }).populate("recipient","fullName profilePic nativeLanguage learningLanguage")
        res.status(200).json(outgoingRequests)
    }
    catch(error){
        console.error("Error fetching outgoing friend requests:",error.message)
        res.status(500).json({message:"Internal server error"})
    }
}