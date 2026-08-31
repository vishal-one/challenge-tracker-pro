import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { Lock, CheckCircle2, KeyRound } from 'lucide-react';

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password must be at least 6 characters'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New password and confirmation do not match",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export const Account: React.FC = () => {
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordFormData) => {
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // 1. Get the current user's email
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('Active user session not found.');
      }

      // 2. Verify the current password
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: data.currentPassword,
      });

      if (verifyError) {
        throw new Error('Your current password is incorrect.');
      }

      // 3. Apply the new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (updateError) throw updateError;

      setSuccessMessage('Password successfully updated!');
      reset();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="border-b border-neutral-border pb-6">
        <h1 className="text-2xl font-mono font-bold uppercase tracking-wider text-neutral-txt flex items-center gap-2">
          ACCOUNT <span className="text-violet">SECURITY SETTINGS</span>
        </h1>
        <p className="text-xs font-mono text-neutral-muted mt-1">
          Manage your account security, passwords, and access.
        </p>
      </div>

      <Card className="space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-border pb-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-violet" />
            <h2 className="font-mono text-base font-bold uppercase text-neutral-txt">
              Update Auth Password
            </h2>
          </div>
        </div>

        {successMessage && (
          <div className="p-3 rounded border border-violet/40 bg-violet/10 font-mono text-xs text-violet flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded border border-red-500/40 bg-red-500/10 font-mono text-xs text-red-400">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Current Password *"
            type="password"
            placeholder="••••••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.currentPassword?.message}
            {...register('currentPassword')}
          />

          <Input
            label="New Password *"
            type="password"
            placeholder="••••••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />

          <Input
            label="Confirm New Password *"
            type="password"
            placeholder="••••••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <div className="pt-2">
            <Button type="submit" isLoading={isSubmitting}>
              Update Account Password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
