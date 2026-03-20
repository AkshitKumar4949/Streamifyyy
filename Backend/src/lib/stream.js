import {StreamChat} from "stream-chat"
import dotenv from "dotenv"
dotenv.config()
const apiKey = process.env.STREAM_API_KEY
const apiSecret = process.env.STREAM_API_SECRET
if(!apiKey || !apiSecret){
    console.error("Stream API key or Secret is missing")    
}
const streamClient = StreamChat.getInstance(apiKey,apiSecret)

export const upsertStreamUser = async(userData)=>{
    try{
        await streamClient.upsertUsers([userData])
        return userData
    }
    catch(error){
        console.error("Error upserting Stream user:",error)
    }
}

export const generateStreamToken = (userId)=>{
    try{
        // ensure userId is in string format
        if(typeof userId !== "string"){
            userId = userId.toString()
        }
        return streamClient.createToken(userId)
    }
    catch(error)
    {
        console.error("Error generating Stream token:",error)
    }
}