import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { ShipWheelIcon } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { verifyEmail } from '../lib/api'

const EmailVerificationPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState(location.state?.email || '')
  const [code, setCode] = useState('')
  const { mutate, isPending, error } = useMutation({
    mutationFn: verifyEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authUser'] })
      navigate('/onboarding')
    },
  })

  const handleSubmit = (event) => {
    event.preventDefault()
    mutate({ email, code })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" data-theme="forest">
      <div className="w-full max-w-md border border-primary/25 bg-base-100 rounded-xl shadow-lg p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-6">
          <ShipWheelIcon className="size-9 text-primary" />
          <span className="text-3xl font-bold font-mono text-primary tracking-wider">Streamify</span>
        </div>
        <h1 className="text-2xl font-semibold">Verify your email</h1>
        <p className="text-sm opacity-70 mt-2 mb-6">Enter the six-digit code we sent to your email address.</p>

        {error && <div className="alert alert-error mb-4"><span>{error.response?.data?.message || 'Verification failed'}</span></div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="form-control w-full">
            <span className="label-text mb-2">Email</span>
            <input type="email" className="input input-bordered w-full" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="form-control w-full">
            <span className="label-text mb-2">Verification code</span>
            <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} className="input input-bordered w-full tracking-[0.5em]" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} required />
          </label>
          <button type="submit" className="btn btn-primary w-full" disabled={isPending}>
            {isPending ? <span className="loading loading-spinner loading-xs" /> : 'Verify email'}
          </button>
        </form>

        <p className="text-sm text-center mt-5">Wrong email? <Link to="/signup" className="text-primary hover:underline">Start again</Link></p>
      </div>
    </div>
  )
}

export default EmailVerificationPage