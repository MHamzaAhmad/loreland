import type { GenerationStatus } from '@packages/ui-logic'
import { FileText, CheckCircle, CircleNotch, WarningCircle } from '@phosphor-icons/react'


const STEP_MESSAGES: Record<string, string> = {
    'validate-and-init': 'Initializing world parameters...',
    'generate-metadata': 'Drafting initial world lore...',
    'generate-characters': 'Recruiting key figures...',
    'generate-npcs': 'Populating local inhabitants...',
    'generate-preview-image': 'Sketching environment visuals...',
    'generate-character-portraits': 'Illustrating character portraits...',
    'save-entities': 'Archiving data to registry...',
    'finalize-game': 'Finalizing world simulation...',
    'vectorize-game': 'Indexing knowledge base...',
    'complete': 'World generation complete.',
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
        : 'Establishing connection...'

    const isComplete = status?.status === 'complete'
    const isError = status?.status === 'errored'

    return (
        <div className="w-full max-w-lg mx-auto font-sans space-y-6">
            <div className="bg-card border-dashed border-2 border-secondary/50 rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-dashed border-secondary/30 pb-4">
                    <FileText size={20} className="text-muted-foreground" weight="duotone" />
                    <span className="font-serif font-bold text-lg text-foreground tracking-tight">Generation Status</span>
                    <span className="ml-auto text-xs text-muted-foreground font-mono">
                        {status?.stepsCompleted && status?.totalSteps ?
                            `STEP ${status.stepsCompleted}/${status.totalSteps}` :
                            'INIT'
                        }
                    </span>
                </div>

                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="pt-0.5">
                            {isComplete ? (
                                <CheckCircle size={24} weight="fill" className="text-green-600 animate-in zoom-in duration-300" />
                            ) : isError ? (
                                <WarningCircle size={24} weight="fill" className="text-red-500 animate-pulse" />
                            ) : (
                                <CircleNotch size={24} className="text-primary animate-spin" />
                            )}
                        </div>
                        <div className="space-y-1 flex-1">
                            <p className="font-medium text-foreground">
                                {isComplete ? 'Generation Complete' : isError ? 'Generation Failed' : 'Processing...'}
                            </p>
                            <p className="text-sm text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-left-2 duration-300">
                                {message}
                            </p>
                            {isError && status?.error && (
                                <p className="text-xs text-red-500 mt-2 p-2 bg-red-50 rounded border border-red-100">
                                    {status.error}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${Math.max(5, percentage)}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
