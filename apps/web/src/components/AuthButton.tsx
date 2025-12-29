import { useEffect, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { useUser, useAuth } from '@packages/ui-logic'
import { signInAnonymously, signOut } from '../lib/auth-client'
import { Button } from './ui/8bit/button'
import { LogOut, UserPlus } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'

/**
 * Auth button component
 * 
 * Shows different states:
 * - Loading: "..."
 * - Anonymous: "GUEST" + "LINK ACCOUNT"
 * - Linked: Username + "SIGN OUT"
 */
export function AuthButton() {
    const { data, isLoading, refetch } = useUser()
    const { invalidateUser } = useAuth()
    const didAttemptRef = useRef(false)

    // Use mutation for anonymous sign-in to handle state cleanly
    const signInMutation = useMutation({
        mutationFn: signInAnonymously,
        onSuccess: () => {
            invalidateUser()
            refetch()
        },
        onError: (err) => {
            console.error('Auto sign-in failed:', err)
        },
    })

    // Sign out mutation
    const signOutMutation = useMutation({
        mutationFn: signOut,
        onSuccess: () => {
            invalidateUser()
            refetch()
        },
        onError: (err) => {
            console.error('Sign out failed:', err)
        },
    })

    // Auto sign-in effect - runs only when user query settles
    useEffect(() => {
        // Already attempted or still loading
        if (didAttemptRef.current || isLoading) return

        // Already authenticated
        if (data?.authenticated) return

        // Mark as attempted and sign in
        didAttemptRef.current = true
        signInMutation.mutate()
    }, [isLoading, data?.authenticated]) // eslint-disable-line react-hooks/exhaustive-deps

    const isPending = isLoading || signInMutation.isPending

    // Loading state
    if (isPending) {
        return (
            <Button variant="ghost" size="sm" disabled>
                <span className="text-[10px] animate-pulse">...</span>
            </Button>
        )
    }

    // Not authenticated (should have auto-signed in, show fallback)
    if (!data?.authenticated || !data.user) {
        return (
            <Button variant="ghost" size="sm" disabled>
                <span className="text-[10px]">...</span>
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
            <Button
                size="sm"
                variant="ghost"
                onClick={() => signOutMutation.mutate()}
                disabled={signOutMutation.isPending}
            >
                <LogOut className="h-3 w-3" />
            </Button>
        </div>
    )
}
