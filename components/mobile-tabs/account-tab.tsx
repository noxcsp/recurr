"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { Loader2, Trash2, AlertTriangle, UserCheck, ShieldAlert, Copy, Check, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { deleteAccount, resetPassword } from "@/app/auth/actions"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useHomeData } from "@/contexts/home-data-context"

export function AccountTab() {
  const { user, profile } = useHomeData()
  const router = useRouter()
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null)
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState<string | null>(null)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const { clearFcmToken } = usePushNotifications()

  const handleResetPassword = async () => {
    if (!user?.email) return
    setIsResettingPassword(true)
    setResetPasswordError(null)
    setResetPasswordSuccess(null)
    try {
      const result = await resetPassword({ email: user.email })
      if (result?.error) {
        setResetPasswordError(result.error)
      } else if (result?.success) {
        setResetPasswordSuccess(result.message || "Check your email for the password reset link.")
      }
    } catch (err: unknown) {
      setResetPasswordError(err instanceof Error ? err.message : "Failed to send reset link.")
    } finally {
      setIsResettingPassword(false)
      setIsResetDialogOpen(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true)
    setDeleteError(null)
    try {
      await clearFcmToken()
    } catch (error) {
      console.error("Failed to clear FCM token before account deletion:", error)
    }

    const result = await deleteAccount()
    if (result?.error) {
      setDeleteError(result.error)
      setIsDeletingAccount(false)
    } else if (result?.success) {
      router.push("/success?type=delete-account")
    }
  }

  const displayName =
    profile?.display_name ||
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    "N/A"

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex flex-col gap-4 p-4 md:p-6 overflow-y-auto pb-8"
    >
      {/* Tab Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h1 className="text-xl font-heading font-semibold leading-tight md:text-2xl lg:text-3xl flex items-center gap-2">
          <UserCheck className="size-5 text-foreground" aria-hidden="true" />
          Account Details
        </h1>
      </div>

      {/* Account Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="border border-border bg-card p-4 space-y-4"
      >
        <h2 className="text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground">
          Primary Profile
        </h2>

        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
          <span className="font-semibold text-muted-foreground">Display Name:</span>
          <span className="truncate font-medium">{displayName}</span>

          <span className="font-semibold text-muted-foreground">Email:</span>
          <span className="truncate font-mono text-xs">{user.email}</span>

          <span className="font-semibold text-muted-foreground">Timezone:</span>
          <span>{profile?.timezone || "Not set"}</span>

          <span className="font-semibold text-muted-foreground">Last Sign In:</span>
          <span className="font-mono text-xs">
            {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "N/A"}
          </span>

        </div>
      </motion.div>

      {/* Security Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.08 }}
        className="border border-border bg-card p-4 space-y-3"
      >
        <div className="flex items-center gap-2">
          <KeyRound className="size-4 text-foreground" aria-hidden="true" />
          <h2 className="text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground">
            Security
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Request a password reset link sent to your registered email address.
        </p>

        {resetPasswordError && (
          <div className="border border-destructive p-3 text-xs font-medium text-destructive">
            {resetPasswordError}
          </div>
        )}

        {resetPasswordSuccess && (
          <div className="border border-primary p-3 text-xs font-medium text-primary">
            {resetPasswordSuccess}
          </div>
        )}

        <AlertDialog
          open={isResetDialogOpen}
          onOpenChange={(open) => {
            if (isResettingPassword) return
            setIsResetDialogOpen(open)
          }}
        >
          <AlertDialogTrigger
            render={
              <Button
                variant="outline"
                disabled={isResettingPassword}
                className="w-full text-sm font-medium rounded-none flex items-center justify-center gap-2"
              />
            }
          >
            {isResettingPassword ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Sending Link...
              </>
            ) : (
              <>
                <KeyRound className="size-4" aria-hidden="true" />
                Reset Password
              </>
            )}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-foreground">
                <KeyRound className="size-5" aria-hidden="true" />
                Reset Password
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to send a password reset link to <span className="font-mono text-foreground font-medium">{user.email}</span>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isResettingPassword}>
                Cancel
              </AlertDialogCancel>
              <Button
                onClick={handleResetPassword}
                disabled={isResettingPassword}
                className="rounded-none"
              >
                {isResettingPassword ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>

      {/* Danger Zone */}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        className="border border-destructive/40 bg-card p-4 space-y-3"
      >
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-destructive" aria-hidden="true" />
          <h2 className="text-xs font-heading font-semibold uppercase tracking-wider text-destructive">
            Danger Zone
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Irreversible action. Wipes all subscription payment histories, alert feeds, and credentials.
        </p>

        {deleteError && (
          <div className="border border-destructive p-3 text-xs font-medium text-destructive">
            {deleteError}
          </div>
        )}

        <AlertDialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (isDeletingAccount) return
            setIsDialogOpen(open)
          }}
        >
          <AlertDialogTrigger
            render={
              <Button
                variant="destructive"
                disabled={isDeletingAccount}
                className="w-full text-sm font-medium"
              />
            }
          >
            <Trash2 className="mr-2 size-4" aria-hidden="true" />
            Delete Account
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="size-5" aria-hidden="true" />
                Delete Account
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action is non-recoverable. All of your subscription records, notification feeds, and account data will be permanently wiped.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingAccount}>
                Cancel
              </AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                    Deleting...
                  </>
                ) : (
                  "Delete My Account"
                )}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </motion.div>
  )
}
