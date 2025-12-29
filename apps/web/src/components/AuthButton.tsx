import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useUser, useAuth } from '@packages/ui-logic'
import { signInAnonymously, signOut, getSession } from '../lib/auth-client'
import { Button } from './ui/8bit/button'
import { User, LogOut, UserPlus } from 'lucide-react'

/**
 * Auth button component
 * 
 * Shows different states:
 * - Loading: "..."
 * - Not logged in: "START" (auto-signs in anonymously)
 * - Anonymous: "GUEST" + "LINK ACCOUNT"
 * - Linked: Username + "SIGN OUT"
 */
export function AuthButton() {
    const { data, isLoading, refetch } = useUser()
    const { invalidateUser } = useAuth()
    const [isSigningIn, setIsSigningIn] = useState(false)

    // Auto sign-in as anonymous if not authenticated
    useEffect(() => {
        const autoSignIn = async () => {
            if (isLoading || data?.authenticated || isSigningIn) return

            // Check if session exists first
            const session = await getSession()
            if (session.data?.session) {
                refetch()
                return
            }

            // No session - sign in anonymously
            setIsSigningIn(true)
            try {
                await signInAnonymously()
                invalidateUser()
                refetch()
            } catch (err) {
                console.error('Auto sign-in failed:', err)
            } finally {
                setIsSigningIn(false)
            }
        }

        autoSignIn()
    }, [isLoading, data?.authenticated, isSigningIn, refetch, invalidateUser])

    const handleSignOut = async () => {
        try {
            await signOut()
            invalidateUser()
            refetch()
        } catch (err) {
            console.error('Sign out failed:', err)
        }
    }

    // Loading state
    if (isLoading || isSigningIn) {
        return (
            <Button variant="ghost" size="sm" disabled>
                <span className="text-[10px] animate-pulse">...</span>
            </Button>
        )
    }

    // Not authenticated (should auto-sign in)
    if (!data?.authenticated || !data.user) {
        return (
            <Button variant="ghost" size="sm" disabled>
                <span className="text-[10px]">START</span>
            </Button>
        )
    }

    const { user } = data

    // Anonymous user
    if (user.isAnonymous) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--8bit-muted-foreground)]">
                    GUEST
                </span>
                <Link to="/auth/link">
                    <Button size="sm" variant="default">
                        <UserPlus className="h-3 w-3" />
                        <span className="text-[10px]">LINK</span>
                    </Button>
                </Link>
            </div>
        )
    }

    // Linked user
    return (
        <div className="flex items-center gap-2">
            <span className="text-[10px] truncate max-w-[100px]">
                {user.name || user.email}
            </span>
            <Button size="sm" variant="ghost" onClick={handleSignOut}>
                <LogOut className="h-3 w-3" />
            </Button>
        </div>
    )
}
