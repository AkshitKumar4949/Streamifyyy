import { useMutation, useQueryClient } from '@tanstack/react-query'
import { GoogleLogin } from '@react-oauth/google'
import toast from 'react-hot-toast'
import { googleAuth } from '../lib/api'

const GoogleAuthButton = () => {
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: googleAuth,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['authUser'] }),
    onError: (error) => toast.error(error.response?.data?.message || 'Google authentication failed'),
  })

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return null

  return (
    <div className="flex justify-center w-full">
      <GoogleLogin
        onSuccess={(response) => mutate({ credential: response.credential })}
        onError={() => toast.error('Google authentication failed')}
        useOneTap={false}
        theme="outline"
        size="large"
        width="400"
        text="continue_with"
        disabled={isPending}
      />
    </div>
  )
}

export default GoogleAuthButton