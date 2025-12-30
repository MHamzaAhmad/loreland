import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useGenerateGame, useGenerationStatus } from '@packages/ui-logic'
import { GenerationProgress } from '../../components/GenerationProgress'
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { soundService } from '../../lib/sounds'

export const Route = createFileRoute('/games/new')({
    component: CreateGame,
})

function CreateGame() {
    const navigate = useNavigate()
    const [prompt, setPrompt] = useState('')
    const [instanceId, setInstanceId] = useState<string | null>(null)

    const generateMutation = useGenerateGame()
    const statusQuery = useGenerationStatus(instanceId, {
        onComplete: (gameId) => {
            // Navigate to the new game
            setTimeout(() => {
                navigate({ to: '/games/$id', params: { id: gameId } })
            }, 1500)
        },
    })

    const handleGenerate = async () => {
        if (!prompt.trim()) return

        soundService.play('click');
        try {
            const result = await generateMutation.mutateAsync({
                prompt: prompt.trim(),
                characterCount: 2,
                npcCount: 3,
                generatePreviewImage: true,
                generateCharacterPortraits: true,
                imageStyle: 'cinematic sci-fi, realistic, high detail',
            })
            setInstanceId(result.instanceId)
        } catch (err) {
            console.error('Generation failed:', err)
        }
    }

    const isGenerating = !!instanceId && statusQuery.data?.status !== 'complete'

    return (
        <div className="min-h-screen bg-background relative selection:bg-primary/30 font-mono text-sm overflow-hidden">
            {/* Background elements */}
            <div className="scanline-overlay pointer-events-none fixed inset-0 z-50 opacity-50" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background z-0 pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto p-4 md:p-8 flex flex-col min-h-screen">
                <header className="mb-12 border-b border-primary/20 pb-6">
                    <Link
                        to="/"
                        onClick={() => soundService.play('click')}
                        className="inline-flex items-center gap-2 text-xs text-primary/60 hover:text-primary mb-4 transition-colors font-mono uppercase tracking-widest"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        ABORT_CREATION
                    </Link>
                    <div className="flex items-end justify-between">
                        <div>
                            <div className="text-[10px] text-primary/40 font-mono mb-1">SYSTEM_ACCESS</div>
                            <h1 className="text-3xl md:text-4xl font-orbitron text-primary tracking-wide text-shadow-glow">
                                INITIALIZE_SIMULATION
                            </h1>
                        </div>
                        <div className="hidden md:block text-right">
                            <div className="text-[10px] text-primary/40 font-mono">AVAILABLE_RESOURCES</div>
                            <div className="text-xs text-primary font-bold">UNLIMITED</div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
                    {!isGenerating ? (
                        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 opacity-20 group-hover:opacity-40 blur transition duration-1000 group-hover:duration-200" />
                                <div className="relative bg-black border border-primary/20 p-1">
                                    <div className="bg-primary/5 p-6 md:p-8 space-y-6">
                                        <div className="flex items-center gap-3 text-primary border-b border-primary/10 pb-4">
                                            <Sparkles className="h-5 w-5" />
                                            <span className="font-orbitron tracking-widest text-sm">INPUT_PARAMETERS</span>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-mono uppercase text-primary/60 tracking-wider flex items-center gap-2">
                                                <span className="w-1 h-1 bg-primary/40 rounded-full" />
                                                Sim_Prompt (Description)
                                            </label>
                                            <textarea
                                                value={prompt}
                                                onChange={(e) => setPrompt(e.target.value)}
                                                placeholder="Describe the universe, conflict, or scenario to simulate..."
                                                className="w-full h-40 bg-black/50 border border-primary/20 text-primary placeholder:text-primary/20 p-4 font-mono text-sm focus:outline-none focus:border-primary/60 focus:bg-primary/5 transition-all resize-none"
                                                disabled={generateMutation.isPending}
                                            />
                                            <div className="flex justify-end text-[10px] text-primary/40 font-mono">
                                                {prompt.length} CHARS
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleGenerate}
                                            disabled={!prompt.trim() || generateMutation.isPending}
                                            className="w-full relative group overflow-hidden px-6 py-4 bg-primary text-primary-foreground font-orbitron font-bold tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000" />
                                            <div className="flex items-center justify-center gap-3">
                                                {generateMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5 fill-current" />}
                                                <span>{generateMutation.isPending ? 'PROCESSING_REQUEST...' : 'GENERATE_SIMULATION'}</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center text-[10px] text-primary/30 font-mono max-w-md mx-auto">
                                NOTICE: Generating a full simulation may take 30-60 seconds. System will create characters, lore, and visual data automatically.
                            </div>
                        </div>
                    ) : (
                        <div className="w-full animate-in fade-in duration-1000">
                            <div className="border border-primary/20 bg-black/40 p-8 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 animate-scanline" />
                                <GenerationProgress
                                    status={statusQuery.data}
                                    isLoading={statusQuery.isLoading}
                                />
                            </div>
                        </div>
                    )}

                    {generateMutation.error && (
                        <div className="mt-8 p-4 border border-red-500/50 bg-red-950/20 text-red-400 text-xs font-mono text-center animate-pulse">
                            [ERROR]: Failed to initialize simulation sequence. Please retry.
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}
