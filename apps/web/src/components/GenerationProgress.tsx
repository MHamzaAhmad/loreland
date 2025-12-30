import type { GenerationStatus } from '@packages/ui-logic'
import { Terminal, CheckCircle, Loader2, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'

const STEP_MESSAGES: Record<string, string> = {
    'validate-and-init': 'INITIALIZING_CORE_SYSTEMS...',
    'generate-metadata': 'SYNTHESIZING_NARRATIVE_PARAMETERS...',
    'generate-characters': 'COMPILING_PERSONNEL_FILES...',
    'generate-npcs': 'POPULATING_LOCAL_ENTITIES...',
    'generate-preview-image': 'RENDERING_ENVIRONMENTAL_VISUALS...',
    'generate-character-portraits': 'GENERATING_UNIT_IDENTIFICATION...',
    'save-entities': 'ARCHIVING_DATA_TO_MAINFRAME...',
    'finalize-game': 'FINALIZING_SIMULATION_CONSTRUCT...',
    'vectorize-game': 'INDEXING_NEURAL_PATHWAYS...',
    'complete': 'SIMULATION_READY_FOR_DEPLOYMENT.',
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
        : 'ESTABLISHING_UPLINK...'

    const isComplete = status?.status === 'complete'
    const isError = status?.status === 'errored'

    // Segmented progress bar
    const totalSegments = 20
    const filledSegments = Math.floor((percentage / 100) * totalSegments)

    return (
        <div className="w-full max-w-lg mx-auto font-mono text-sm space-y-6">
            <div className="flex items-center gap-2 text-primary border-b border-primary/20 pb-2 mb-4">
                <Terminal className="w-4 h-4" />
                <span className="text-xs tracking-widest uppercase">System_Log_Output</span>
            </div>

            <div className="space-y-4">
                {/* Status Indicator */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {isComplete ? (
                            <CheckCircle className="w-5 h-5 text-green-500 animate-pulse" />
                        ) : isError ? (
                            <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                        ) : (
                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        )}
                        <span className={clsx(
                            "font-bold tracking-wider",
                            isComplete ? "text-green-500" : isError ? "text-red-500" : "text-primary"
                        )}>
                            {isComplete ? 'SEQUENCE_COMPLETE' : isError ? 'SYSTEM_FAILURE' : 'PROCESSING...'}
                        </span>
                    </div>
                    <div className="text-xs text-primary/60 font-mono">
                        {Math.round(percentage)}%
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-4 w-full flex gap-1">
                    {Array.from({ length: totalSegments }).map((_, i) => (
                        <div
                            key={i}
                            className={clsx(
                                "h-full flex-1 transition-all duration-300",
                                i < filledSegments
                                    ? isComplete ? "bg-green-500/80 shadow-[0_0_5px_rgba(34,197,94,0.5)]"
                                        : isError ? "bg-red-500/80"
                                            : "bg-primary/80 shadow-[0_0_5px_rgba(var(--primary-rgb),0.5)]"
                                    : "bg-primary/10 border border-primary/20"
                            )}
                        />
                    ))}
                </div>

                {/* Terminal Output */}
                <div className="bg-black/80 border border-primary/20 p-4 font-mono text-xs relative overflow-hidden min-h-[100px] flex flex-col justify-end">
                    {/* Static decorative lines */}
                    <div className="text-primary/30 mb-2">
                        <span>{'>'} ACCESSING_NODE_CLUSTER_ALPHA... [OK]</span><br />
                        <span>{'>'} VERIFYING_SECURITY_PROTOCOLS... [OK]</span>
                    </div>

                    <div className="text-primary flex items-start gap-2">
                        <span className="animate-pulse">{'>'}</span>
                        <span className={clsx(
                            isError ? "text-red-400" : "text-primary"
                        )}>
                            {message}
                        </span>
                    </div>

                    {status?.stepsCompleted && status?.totalSteps && (
                        <div className="absolute top-2 right-2 text-[10px] text-primary/40 text-right">
                            STEP: {String(status.stepsCompleted).padStart(2, '0')}/{String(status.totalSteps).padStart(2, '0')}
                            <br />
                            MEM_USAGE: {Math.floor(Math.random() * 30) + 40}%
                        </div>
                    )}

                    {isError && status?.error && (
                        <div className="mt-2 text-red-500 border-l-2 border-red-500 pl-2">
                            ERROR_CODE: {status.error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
