import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useGenerateGame, useGenerationStatus } from '@packages/ui-logic'
import { GenerationProgress } from '../../components/GenerationProgress'
import { ArrowLeft, Sparkle, MagicWand } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
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
        <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto space-y-10">
                <header className="space-y-6">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Back to Home
                    </Link>

                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                            Create New Vision
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Describe the world you want to experience, and we'll generate the lore, characters, and visuals for you.
                        </p>
                    </div>
                </header>

                <main>
                    {!isGenerating ? (
                        <div className="space-y-8 bg-card rounded-3xl border border-secondary p-8 shadow-sm">
                            <div className="space-y-4">
                                <label className="block text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Sparkle size={16} className="text-primary" />
                                    <span>Vision Prompt</span>
                                </label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="e.g. A solarpunk city floating in the clouds where humanity lives in harmony with giant mechanical birds..."
                                    className="w-full h-40 rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none transition-shadow"
                                    disabled={generateMutation.isPending}
                                />
                                <div className="flex justify-end text-xs text-muted-foreground">
                                    {prompt.length} characters
                                </div>
                            </div>

                            <Button
                                onClick={handleGenerate}
                                disabled={!prompt.trim() || generateMutation.isPending}
                                size="lg"
                                className="w-full text-base h-14 rounded-xl shadow-md"
                            >
                                {generateMutation.isPending ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Generating...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <MagicWand size={20} weight="fill" />
                                        <span>Generate World</span>
                                    </div>
                                )}
                            </Button>

                            <p className="text-center text-xs text-muted-foreground/80">
                                Generation typically takes 30-60 seconds.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-card rounded-3xl border border-secondary p-12 text-center space-y-8 shadow-sm animate-in fade-in duration-500">
                            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                <Sparkle size={32} className="text-primary animate-pulse" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold">Weaving Reality</h3>
                                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                                    Constructing the narrative threads, character backstories, and visual assets for your new universe.
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
