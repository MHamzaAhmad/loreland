import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useGenerateGame, useGenerationStatus } from '@packages/ui-logic'
import { GenerationProgress } from '../../components/GenerationProgress'
import { ArrowLeft, Globe, Sparkle } from '@phosphor-icons/react'
import { Button } from '../../components/ui/8bit/button'

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
            setTimeout(() => {
                navigate({ to: '/games/$id', params: { id: gameId } })
            }, 1000)
        },
    })

    const handleGenerate = async () => {
        if (!prompt.trim()) return

        try {
            const result = await generateMutation.mutateAsync({
                prompt: prompt.trim(),
                options: {
                    characterCount: 2,
                    npcCount: 3,
                    generatePreviewImage: true,
                    generateCharacterPortraits: true,
                    imageStyle: 'cinematic sci-fi, realistic, high detail',
                }
            })
            setInstanceId(result.instanceId)
        } catch (err) {
            console.error('Generation failed:', err)
        }
    }

    const isGenerating = !!instanceId && statusQuery.data?.status !== 'complete'

    return (
        <div className="min-h-screen bg-[#fcfbf9] pb-20 font-sans">
            {/* Header Section */}
            <div className="relative bg-[var(--pastel-blue)] text-[var(--pastel-blue-fg)] transition-colors duration-500">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />

                <div className="relative max-w-5xl mx-auto px-6 md:px-12 py-8 md:py-16 pb-24">
                    <header className="flex items-center justify-between mb-8">
                        <Link to="/" className="flex items-center gap-2 text-current/70 hover:text-current transition-colors group">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-medium font-serif">Back to Gallery</span>
                        </Link>
                    </header>

                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 border border-white/20 text-[11px] font-bold uppercase tracking-wider shadow-sm text-current">
                            <Sparkle size={14} weight="bold" />
                            <span>AI Generation</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black font-serif tracking-tight leading-[0.9] text-current/90 max-w-4xl">
                            Create New World
                        </h1>
                        <p className="text-lg text-current/80 max-w-2xl font-serif">
                            Describe your setting, themes, and tone. The AI will weave together the lore, inhabitants, and visuals.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-6 relative z-20 -mt-16">
                <main>
                    {!isGenerating ? (
                        <div className="space-y-8 bg-card rounded-3xl border border-dashed border-border/60 p-8 shadow-sm">
                            <div className="space-y-4">
                                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Globe size={18} weight="duotone" className="text-primary" />
                                    <span>World Description</span>
                                </label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Enter a description for your world. e.g. 'A cyberpunk city where rain never stops and neon lights control the population...'"
                                    className="w-full h-48 rounded-xl border border-border bg-secondary/30 px-6 py-5 text-base leading-relaxed ring-offset-background placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary resize-none transition-all font-serif"
                                    disabled={generateMutation.isPending}
                                />
                                <div className="flex justify-between items-center text-xs text-muted-foreground">
                                    <span className="italic">Be specific about the genre and tone.</span>
                                    <span>{prompt.length} chars</span>
                                </div>
                            </div>

                            <Button
                                onClick={handleGenerate}
                                disabled={!prompt.trim() || generateMutation.isPending}
                                size="lg"
                                className="w-full text-base h-16 rounded-full shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all font-bold tracking-wide bg-foreground text-background hover:bg-foreground/90 border-0"
                            >
                                {generateMutation.isPending ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                        <span>Weaving World...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Sparkle size={20} weight="fill" />
                                        <span>Generate World</span>
                                    </div>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="bg-card rounded-3xl border border-dashed border-border/60 p-12 text-center space-y-8 shadow-sm animate-in fade-in duration-700">
                            <div className="mx-auto w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                                <Globe size={32} className="text-primary opacity-80" weight="duotone" />
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-2xl font-serif font-bold text-foreground">Constructing World</h3>
                                <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
                                    The AI is currently generating the geography, history, and inhabitants of your new world.
                                </p>
                            </div>

                            <div className="max-w-md mx-auto">
                                <GenerationProgress
                                    status={statusQuery.data}
                                    isLoading={statusQuery.isLoading}
                                />
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}
