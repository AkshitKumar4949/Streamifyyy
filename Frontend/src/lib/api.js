import { axiosInstance } from "./axios"
export const signup = async (signupData) => {
    const response = await axiosInstance.post("/auth/signup", signupData)
    return response.data
}
export const verifyEmail = async (verificationData) => {
    const response = await axiosInstance.post("/auth/verify-email", verificationData)
    return response.data
}
export const googleAuth = async (credential) => {
    const response = await axiosInstance.post("/auth/google", credential)
    return response.data
}
export const login = async(loginData) =>{
    const response = await axiosInstance.post("/auth/login",loginData)
    return response.data
}
export const logout = async () =>{
    const response = await axiosInstance.post("/auth/logout")
    return response.data
}
export const getAuthUser = async () => {
    try{const res = await axiosInstance.get("/auth/me")
    return res.data}
    catch(error){
        console.log("Error in getauthUser:",error)
        return null
    }
}
export const completeOnboarding = async(userData)=>{
    const response = await axiosInstance.post("/auth/onboarding",userData)
    return response.data
}
export const updateProfile = async(profileData)=>{
    const response = await axiosInstance.patch("/auth/profile", profileData)
    return response.data
}
export async function getUserFriends({ pageParam = 1 } = {}){
    const response = await axiosInstance.get("users/friends", { params: { page: pageParam, limit: 12 } })
    return response.data
}
export async function getRecommendedUsers({ pageParam = 1 } = {}){
    const response = await axiosInstance.get("users", { params: { page: pageParam, limit: 12 } })
    return response.data
}
export async function getOutgoingFriendReqs(){
    const response = await axiosInstance.get("users/outgoing-friend-requests")
    return response.data
}
export async function sendFriendRequest(userId){
    const response = await axiosInstance.post(`/users/friend-request/${userId}`)
    return response.data
}
export async function getFriendRequests(){
    const response = await axiosInstance.get("/users/friend-requests")
    return response.data
}
export async function acceptFriendRequest(requestId){
    const response = await axiosInstance.put(`/users/friend-request/${requestId}/accept`)
    return response.data
}

export async function getStreamToken(){
    const response = await axiosInstance.get("/chat/token")
    return response.data
}
