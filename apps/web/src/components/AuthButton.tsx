import { useEffect, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { useUser, useAuth } from '@packages/ui-logic'
import { signInAnonymously, signOut } from '../lib/auth-client'
import { Button } from './ui/8bit/button'
import { SignOut, UserPlus } from '@phosphor-icons/react'
import { useMutation } from '@tanstack/react-query'

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
    }, [isLoading, data?.authenticated])

    const isPending = isLoading || signInMutation.isPending

    // Loading state
    if (isPending) {
        return (
            <Button variant="ghost" size="sm" disabled>
                <div className="h-2 w-12 bg-muted animate-pulse rounded" />
            </Button>
        )
    }

    // Not authenticated (should have auto-signed in, show fallback)
    if (!data?.authenticated || !data.user) {
        return (
            <Button variant="ghost" size="sm" disabled>
                <div className="h-2 w-12 bg-muted rounded" />
            </Button>
        )
    }

    const { user } = data

    // Anonymous user
    if (user.isAnonymous) {
        return (
            <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-secondary/40 rounded-md border border-transparent">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        Guest
                    </span>
                </div>
                <Link to="/auth/link">
                    <Button size="sm" variant="dashed" className="h-8 px-3 text-xs gap-1.5 border-dashed border-foreground/20 hover:border-foreground/40 hover:bg-secondary/60">
                        <UserPlus size={14} weight="fill" className="text-foreground/70" />
                        <span>Link Account</span>
                    </Button>
                </Link>
            </div>
        )
    }

    // Linked user
    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-secondary/30 border border-transparent hover:border-border/40 transition-colors">
                <div className="w-5 h-5 rounded bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                    {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                </div>
                <span className="text-xs font-medium text-foreground/80 truncate max-w-[100px]">
                    {user.name || user.email}
                </span>
            </div>
            <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                onClick={() => signOutMutation.mutate()}
                disabled={signOutMutation.isPending}
                title="Sign Out"
            >
                <SignOut size={14} weight="bold" />
            </Button>
        </div>
    )
}
