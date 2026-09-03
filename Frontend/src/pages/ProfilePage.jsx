import { useState } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import { ArrowLeftIcon, CheckIcon, MessageCircleIcon, UploadIcon, UsersIcon } from 'lucide-react'
import useAuthUser from '../hooks/useAuthUser'
import { getUserFriends, updateProfile } from '../lib/api'
import toast from 'react-hot-toast'

const ProfilePage = () => {
  const { authUser } = useAuthUser()
  const queryClient = useQueryClient()
  const [selectedImage, setSelectedImage] = useState(null)
  const { mutate: updateProfileMutation, isPending: isUpdating } = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authUser'] })
      setSelectedImage(null)
      toast.success('Profile photo updated')
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not update profile photo'),
  })
  const {
    data: friendsPages,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['friends'],
    queryFn: getUserFriends,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
  })
  const friends = friendsPages?.pages.flatMap((page) => page.friends) || []

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be smaller than 2 MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => setSelectedImage(reader.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-4xl space-y-6">
        <Link to="/" className="btn btn-ghost btn-sm gap-2">
          <ArrowLeftIcon className="size-4" />
          Back to home
        </Link>

        <section className="card bg-base-200 shadow-sm">
          <div className="card-body items-center text-center sm:flex-row sm:text-left sm:items-start gap-5">
            <div className="avatar">
              <div className="w-28 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                <img src={selectedImage || authUser?.profilePic} alt={authUser?.fullName} />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold">{authUser?.fullName}</h1>
              <p className="opacity-70 mt-1">{authUser?.email}</p>
              {authUser?.bio && <p className="mt-3 max-w-xl">{authUser.bio}</p>}
              <div className="flex flex-wrap gap-2 mt-4">
                <label className="btn btn-outline btn-sm gap-2">
                  <UploadIcon className="size-4" />
                  Choose photo
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImageChange} />
                </label>
                {selectedImage && (
                  <button type="button" className="btn btn-primary btn-sm gap-2" onClick={() => updateProfileMutation({ profilePic: selectedImage })} disabled={isUpdating}>
                    {isUpdating ? <span className="loading loading-spinner loading-xs" /> : <CheckIcon className="size-4" />}
                    Save photo
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <UsersIcon className="size-5 text-primary" />
            <h2 className="text-2xl font-bold">Friends ({friends.length})</h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : friends.length === 0 ? (
            <div className="card bg-base-200 p-6 text-center opacity-80">
              You have not added any friends yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {friends.map((friend) => (
                <div key={friend._id} className="card bg-base-200">
                  <div className="card-body p-4 flex-row items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="avatar shrink-0">
                        <div className="w-12 rounded-full">
                          <img src={friend.profilePic} alt={friend.fullName} />
                        </div>
                      </div>
                      <h3 className="font-semibold truncate">{friend.fullName}</h3>
                    </div>
                    <Link to={`/chat/${friend._id}`} className="btn btn-ghost btn-circle" aria-label={`Message ${friend.fullName}`}>
                      <MessageCircleIcon className="size-5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          {hasNextPage && (
            <div className="flex justify-center mt-5">
              <button className="btn btn-outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage && <span className="loading loading-spinner loading-xs" />}
                {isFetchingNextPage ? 'Loading friends...' : 'Load more friends'}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default ProfilePage