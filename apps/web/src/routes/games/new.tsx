import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useGenerateGame, useGenerationStatus } from '@packages/ui-logic'
import { GenerationProgress } from '../../components/GenerationProgress'
import { ArrowLeft, Sparkle } from '@phosphor-icons/react'
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
        <div className="min-h-screen bg-background">
            {/* Compact Header */}
            <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
                        <ArrowLeft size={16} weight="bold" className="group-hover:-translate-x-0.5 transition-transform" />
                        <span className="text-sm font-medium">Gallery</span>
                    </Link>

                    <h1 className="text-sm font-semibold text-foreground">Create World</h1>

                    <div className="w-16" /> {/* Spacer for centering */}
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-2xl mx-auto px-6 py-12">
                {!isGenerating ? (
                    <div className="space-y-8">
                        {/* Title Section */}
                        <div className="text-center space-y-2">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                <Sparkle size={12} weight="fill" />
                                AI Powered
                            </div>
                            <h2 className="text-2xl font-serif font-semibold text-foreground">
                                Describe your world
                            </h2>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                The AI will generate lore, characters, and visuals based on your description.
                            </p>
                        </div>

                        {/* Input Card */}
                        <div className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="A cyberpunk city where rain never stops and neon lights control the population..."
                                className="w-full h-40 rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm leading-relaxed ring-offset-background placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary resize-none transition-all"
                                disabled={generateMutation.isPending}
                            />
                            <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
                                <span>Be specific about genre, tone, and setting</span>
                                <span>{prompt.length} chars</span>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <Button
                            onClick={handleGenerate}
                            disabled={!prompt.trim() || generateMutation.isPending}
                            size="lg"
                            className="w-full h-12 rounded-xl font-medium"
                        >
                            {generateMutation.isPending ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                    <span>Generating...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Sparkle size={16} weight="fill" />
                                    <span>Generate World</span>
                                </div>
                            )}
                        </Button>
                    </div>
                ) : (
                    <div className="bg-card rounded-2xl border border-border/60 p-10 text-center space-y-6 shadow-sm">
                        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Sparkle size={24} className="text-primary animate-pulse" weight="fill" />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-foreground">Creating your world</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                Generating geography, history, and inhabitants...
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
    )
}
