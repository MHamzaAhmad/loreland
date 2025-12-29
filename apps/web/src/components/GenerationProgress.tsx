import type { GenerationStatus } from '@packages/ui-logic'
import { Progress } from './ui/8bit/progress'
import { Card, CardContent, CardHeader, CardTitle } from './ui/8bit/card'

const STEP_MESSAGES: Record<string, string> = {
    'validate-and-init': 'Creating game record...',
    'generate-metadata': 'Generating game concept...',
    'generate-characters': 'Designing characters...',
    'generate-npcs': 'Creating NPCs...',
    'generate-preview-image': 'Drawing preview art...',
    'generate-character-portraits': 'Drawing character portraits...',
    'save-entities': 'Saving to database...',
    'finalize-game': 'Finalizing game...',
    'vectorize-game': 'Indexing for search...',
    'complete': 'Adventure ready!',
}

interface GenerationProgressProps {
    status: GenerationStatus | undefined
    isLoading: boolean
}

export function GenerationProgress({ status, isLoading }: GenerationProgressProps) {
    if (!status && !isLoading) {
        return null
    }

    const percentage = status?.progress?.percentage ??
        (status?.stepsCompleted && status?.totalSteps
            ? (status.stepsCompleted / status.totalSteps) * 100
            : 0)

    const message = status?.currentStep
        ? STEP_MESSAGES[status.currentStep] ?? status.progress?.message
        : 'Starting generation...'

    const isComplete = status?.status === 'complete'
    const isError = status?.status === 'errored'

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-center text-sm">
                    {isComplete ? '🎉 COMPLETE!' : isError ? '❌ ERROR' : '⚔️ GENERATING...'}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Progress value={percentage} className="h-6" />

                <div className="text-center space-y-2">
                    <p className="text-[10px] text-[var(--8bit-muted-foreground)] uppercase">
                        {message}
                    </p>
                    {status?.stepsCompleted && status?.totalSteps && (
                        <p className="text-[10px]">
                            Step {status.stepsCompleted} / {status.totalSteps}
                        </p>
                    )}
                </div>

                {isError && status?.error && (
                    <p className="text-[10px] text-[var(--8bit-destructive)] text-center">
                        {status.error}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
