import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useCreditBalance } from '@packages/ui-logic'
import { Coin, CheckCircle, SpinnerGap } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/buy-credits/success')({
    component: PurchaseSuccessPage,
})

function PurchaseSuccessPage() {
    const navigate = useNavigate()
    const { data: creditData, isLoading, refetch } = useCreditBalance()
    const [isPolling, setIsPolling] = useState(true)
    const [countdown, setCountdown] = useState(5)

    useEffect(() => {
        const pollInterval = setInterval(() => {
            refetch()
        }, 2000)

        const countdownInterval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    setIsPolling(false)
                    clearInterval(pollInterval)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        const autoRedirect = setTimeout(() => {
            navigate({ to: '/' })
        }, 6000)

        const timeout = setTimeout(() => {
            setIsPolling(false)
            clearInterval(pollInterval)
        }, 10000)

        return () => {
            clearInterval(pollInterval)
            clearInterval(countdownInterval)
            clearTimeout(timeout)
            clearTimeout(autoRedirect)
        }
    }, [refetch, navigate])

    const handleContinue = () => {
        navigate({ to: '/' })
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle 
                            size={32} 
                            className="text-green-600" 
                            weight="fill" 
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold text-foreground">
                        Purchase Successful!
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Your credits are being added to your account.
                    </p>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-card">
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                            <SpinnerGap className="w-5 h-5 animate-spin text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                Loading your balance...
                            </span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center gap-2">
                                <Coin className="w-6 h-6 text-amber-500" weight="fill" />
                                <span className="text-3xl font-bold text-foreground">
                                    {creditData?.balance?.toLocaleString() ?? 0}
                                </span>
                                <span className="text-sm text-muted-foreground">credits</span>
                            </div>

                            {isPolling && (
                                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                    <SpinnerGap className="w-3 h-3 animate-spin" />
                                    <span>Waiting for confirmation...</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <Button 
                        onClick={handleContinue}
                        className="w-full h-11"
                    >
                        Continue to Home
                    </Button>

                    {countdown > 0 && (
                        <p className="text-xs text-muted-foreground">
                            Auto-redirecting in {countdown}s...
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
