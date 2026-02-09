import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '@packages/ui-logic'
import { signUpWithEmail, signInWithEmail } from '../../lib/auth-client'
import { Button } from '../../components/ui/8bit/button'
import { ArrowLeft, Envelope, Lock, UserCircle, LinkSimple } from '@phosphor-icons/react'
import { Loader2 } from 'lucide-react'

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
        <div className="min-h-screen bg-background">
            {/* Compact Header */}
            <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft size={16} />
                        <span className="text-sm font-medium">Back</span>
                    </Link>
                    <div className="h-4 w-px bg-border/60" />
                    <h1 className="text-sm font-semibold text-foreground">
                        {mode === 'signup' ? 'Create Account' : 'Sign In'}
                    </h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-md mx-auto px-6 py-12">
                {/* Page Header */}
                <div className="mb-8 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                        <LinkSimple size={24} className="text-foreground" weight="duotone" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                        {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {mode === 'signup'
                            ? 'Link your worlds and credits to a permanent account'
                            : 'Sign in to access your worlds and credits'}
                    </p>
                </div>

                {/* Form Card */}
                <div className="p-6 rounded-xl border border-border/50 bg-card">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'signup' && (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Name
                                </label>
                                <div className="relative">
                                    <UserCircle
                                        size={18}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                        weight="duotone"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Your name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full h-10 pl-10 pr-4 text-sm bg-secondary/50 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition-colors"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Email
                            </label>
                            <div className="relative">
                                <Envelope
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                    weight="duotone"
                                />
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-10 pl-10 pr-4 text-sm bg-secondary/50 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Password
                            </label>
                            <div className="relative">
                                <Lock
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                    weight="duotone"
                                />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-10 pl-10 pr-4 text-sm bg-secondary/50 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition-colors"
                                    required
                                    minLength={8}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                <p className="text-xs text-destructive text-center">
                                    {error}
                                </p>
                            </div>
                        )}

                        <Button type="submit" className="w-full h-11" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <span className="text-sm font-medium">
                                    {mode === 'signup' ? 'Create & Link Account' : 'Sign In & Link'}
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-border/50 text-center">
                        <button
                            type="button"
                            onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {mode === 'signup'
                                ? 'Already have an account? Sign in'
                                : "Don't have an account? Create one"}
                        </button>
                    </div>
                </div>

                {/* Info Note */}
                <div className="mt-6 p-4 rounded-lg bg-secondary/30 border border-dashed border-border/50">
                    <p className="text-xs text-muted-foreground text-center leading-relaxed">
                        Your guest worlds and remaining credits will be automatically
                        transferred to your permanent account.
                    </p>
                </div>
            </main>
        </div>
    )
}

