import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '@packages/ui-logic'
import { signUpWithEmail, signInWithEmail } from '../../lib/auth-client'
import { Button } from '../../components/ui/8bit/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/8bit/card'
import { Input } from '../../components/ui/8bit/input'
import { ArrowLeft, Mail, Lock, UserCircle } from 'lucide-react'

export const Route = createFileRoute('/auth/link')({
    component: LinkAccount,
})

function LinkAccount() {
    const navigate = useNavigate()
    const { invalidateUser } = useAuth()

    const [mode, setMode] = useState<'signin' | 'signup'>('signup')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            if (mode === 'signup') {
                await signUpWithEmail(email, password, name)
            } else {
                await signInWithEmail(email, password)
            }

            invalidateUser()
            navigate({ to: '/' })
        } catch (err: any) {
            setError(err.message || 'Something went wrong')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
            <div className="w-full max-w-md space-y-6">
                {/* Back link */}
                <Link to="/" className="inline-flex items-center gap-2 text-xs text-[var(--8bit-muted-foreground)] hover:text-[var(--8bit-foreground)]">
                    <ArrowLeft className="h-4 w-4" />
                    BACK TO GAMES
                </Link>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg text-center">
                            {mode === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN'}
                        </CardTitle>
                        <CardDescription className="text-center">
                            Link your games to a permanent account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {mode === 'signup' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase">Name</label>
                                    <div className="relative">
                                        <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--8bit-muted-foreground)]" />
                                        <Input
                                            type="text"
                                            placeholder="Your name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="pl-10 text-xs"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--8bit-muted-foreground)]" />
                                    <Input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 text-xs"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--8bit-muted-foreground)]" />
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 text-xs"
                                        required
                                        minLength={8}
                                    />
                                </div>
                            </div>

                            {error && (
                                <p className="text-[10px] text-[var(--8bit-destructive)] text-center">
                                    {error}
                                </p>
                            )}

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                <span className="text-xs">
                                    {isLoading
                                        ? 'LOADING...'
                                        : mode === 'signup'
                                            ? 'CREATE & LINK'
                                            : 'SIGN IN & LINK'}
                                </span>
                            </Button>
                        </form>

                        <div className="mt-4 text-center">
                            <button
                                type="button"
                                onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
                                className="text-[10px] text-[var(--8bit-muted-foreground)] hover:text-[var(--8bit-foreground)]"
                            >
                                {mode === 'signup'
                                    ? 'Already have an account? Sign in'
                                    : "Don't have an account? Create one"}
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
