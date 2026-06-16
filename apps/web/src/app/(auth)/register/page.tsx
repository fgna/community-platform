'use client';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, Mail } from 'lucide-react';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function RegisterForm() {
  const { register: registerUser, registerLoading, registerError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite') ?? undefined;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser({
        email: data.email,
        name: data.name,
        password: data.password,
        inviteToken,
      });
    } catch {
      // error handled by mutation state
    }
  };

  return (
    <div className="glass rounded-2xl p-8" style={{ border: '1px solid var(--theme-border)' }}>
      <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--theme-text)' }}>
        Create your account
      </h2>

      {inviteToken && (
        <div
          className="mb-4 flex items-center gap-2 p-3 rounded-lg text-sm"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}
        >
          <Mail size={14} />
          You&apos;ve been invited to join. Complete your registration below.
        </div>
      )}

      {registerError && (
        <div
          className="mb-4 p-3 rounded-lg text-sm"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#ef4444',
          }}
        >
          {(registerError as { response?: { data?: { message?: string } } })?.response?.data
            ?.message || 'Registration failed'}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="John Doe"
            {...register('name', {
              required: 'Name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' },
            })}
            className="mt-1"
          />
          {errors.name && (
            <p className="text-xs mt-1" style={{ color: 'var(--theme-danger)' }}>
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
            })}
            className="mt-1"
          />
          {errors.email && (
            <p className="text-xs mt-1" style={{ color: 'var(--theme-danger)' }}>
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-1">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Min 8 characters"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
              })}
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--theme-text-muted)' }}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs mt-1" style={{ color: 'var(--theme-danger)' }}>
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat password"
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (val) => val === password || 'Passwords do not match',
            })}
            className="mt-1"
          />
          {errors.confirmPassword && (
            <p className="text-xs mt-1" style={{ color: 'var(--theme-danger)' }}>
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={registerLoading}>
          {registerLoading ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm" style={{ color: 'var(--theme-text-muted)' }}>
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium hover:underline"
          style={{ color: 'var(--theme-primary)' }}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
