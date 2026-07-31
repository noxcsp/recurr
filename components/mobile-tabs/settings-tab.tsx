"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2, AlertTriangle, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { deleteAccount, signout } from "@/app/auth/actions"
import { NotificationSettings } from "@/components/notification-settings"
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

export function SettingsTab() {
  const { user, profile } = useHomeData()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { clearFcmToken } = usePushNotifications()

  const handleSignOut = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSigningOut(true)
    try {
      await clearFcmToken()
    } catch (error) {
      console.error("Failed to clear FCM token on sign out:", error)
    }
    await signout()
  }

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true)
    setDeleteError(null)
    try {
      await clearFcmToken()
    } catch (error) {
      console.error("Failed to clear FCM token before deletion:", error)
    }
    const result = await deleteAccount()
    if (result?.error) {
      setDeleteError(result.error)
      setIsDeletingAccount(false)
    } else if (result?.success) {
      router.push("/success")
    }
  }

  return (
    <div className="flex flex-col">
      {/* Panel header */}
      <div className="border-b border-border px-4 py-3">
        <h1 className="text-xl font-heading font-semibold leading-tight md:text-2xl lg:text-3xl">
          Settings
        </h1>
      </div>

      {/* Account section */}
      <div className="border-b border-border px-4 py-4">
        <h2 className="mb-3 text-xs font-heading font-semibold uppercase tracking-wide leading-none text-muted-foreground md:text-xs lg:text-sm">
          Account
        </h2>
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm font-normal leading-relaxed md:text-base lg:text-base">
          <span className="font-medium text-muted-foreground">Email</span>
          <span className="truncate">{user.email}</span>
          <span className="font-medium text-muted-foreground">Last sign in</span>
          <span>
            {user.last_sign_in_at
              ? new Date(user.last_sign_in_at).toLocaleString()
              : "N/A"}
          </span>
        </div>
      </div>

      {/* Granular Notification Settings */}
      <NotificationSettings user={user} profile={profile} />

      {/* Danger Zone */}
      <div className="border-b border-border px-4 py-4">
        <h2 className="mb-1 text-xs font-heading font-semibold uppercase tracking-wide leading-none text-destructive md:text-xs lg:text-sm">
          Danger Zone
        </h2>
        <p className="mb-3 text-xs font-normal leading-normal text-muted-foreground md:text-xs lg:text-sm">
          Irreversible and destructive account actions.
        </p>

        {deleteError && (
          <div className="mb-3 border border-destructive p-3 text-xs font-medium text-destructive">
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
                disabled={isSigningOut || isDeletingAccount}
                className="w-full text-sm font-medium leading-none md:text-sm lg:text-base"
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
      </div>

      {/* Sign out */}
      <div className="border-b border-border px-4 py-4">
        <form onSubmit={handleSignOut}>
          <Button
            variant="outline"
            type="submit"
            disabled={isSigningOut || isDeletingAccount}
            className="w-full text-sm font-medium leading-none md:text-sm lg:text-base"
          >
            {isSigningOut ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut className="mr-2 size-4" aria-hidden="true" />
                Sign out
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
