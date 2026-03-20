import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getUserFriends } from '../lib/api'
import FriendCard from '../components/FriendCard'
import { UserCheckIcon } from 'lucide-react'

const FriendsPage = () => {
  const { data: friends, isLoading, error } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends
  })

  if (isLoading) {
    return (
      <div className='p-4 sm:p-6 lg:p-8'>
        <div className='container mx-auto max-w-6xl'>
          <h1 className='text-2xl sm:text-3xl font-bold tracking-tight mb-6'>Friends</h1>
          <div className='flex justify-center py-12'>
            <span className='loading loading-spinner loading-lg'></span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='p-4 sm:p-6 lg:p-8'>
        <div className='container mx-auto max-w-6xl'>
          <h1 className='text-2xl sm:text-3xl font-bold tracking-tight mb-6'>Friends</h1>
          <div className='alert alert-error'>
            <span>Error loading friends. Please try again later.</span>
          </div>
        </div>
      </div>
    )
  }

  const friendsList = friends || []

  return (
    <div className='p-4 sm:p-6 lg:p-8'>
      <div className='container mx-auto max-w-6xl'>
        <div className='mb-8'>
          <h1 className='text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2'>
            <UserCheckIcon className="h-8 w-8 text-primary" />
            Friends
            <span className='badge badge-primary text-lg'>{friendsList.length}</span>
          </h1>
          <p className='text-base-content/70 mt-2'>Connect and chat with your friends</p>
        </div>

        {friendsList.length === 0 ? (
          <div className='text-center py-12'>
            <UserCheckIcon className="h-16 w-16 mx-auto text-base-content/30 mb-4" />
            <h2 className='text-xl font-semibold mb-2'>No friends yet</h2>
            <p className='text-base-content/70 mb-4'>Start by adding friends to begin chatting</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {friendsList.map((friend) => (
              <FriendCard key={friend._id} friend={friend} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FriendsPage
