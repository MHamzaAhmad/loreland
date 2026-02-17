import { createFileRoute, useNavigate, useSearch, Navigate } from '@tanstack/react-router'
import { useUser } from '@packages/ui-logic'
import { CreditStorePage } from '../components/CreditStore'

export const Route = createFileRoute('/buy-credits')({
    component: BuyCreditsPage,
    validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
        redirect: search.redirect as string | undefined,
    }),
})

function BuyCreditsPage() {
    const navigate = useNavigate()
    const search = useSearch({ from: '/buy-credits' })
    const { data: authData, isLoading } = useUser()

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground text-sm">
                    Loading...
                </div>
            </div>
        )
    }

    if (!authData?.authenticated || !authData?.user) {
        return <Navigate to="/auth/link" search={{ redirect: '/buy-credits' }} />
    }

    if (authData.user.isAnonymous) {
        return <Navigate to="/auth/link" search={{ redirect: '/buy-credits' }} />
    }

    return (
        <CreditStorePage
            onBack={() => {
                if (search.redirect) {
                    navigate({ to: search.redirect })
                } else {
                    navigate({ to: '/' })
                }
            }}
        />
    )
}
