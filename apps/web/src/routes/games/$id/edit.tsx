import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'
import { useGame, useUpdateGame } from '@packages/ui-logic'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, FloppyDisk, Plus, Trash, Globe, Users, Cube, Lightning, Gear, Books, Article, Eye, EyeSlash, Star, Scroll, ImageSquare } from '@phosphor-icons/react'
import { Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const Route = createFileRoute('/games/$id/edit')({
    component: EditGame,
})

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs))
}

const pastelClasses = [
    'bg-[var(--pastel-red)] text-[var(--pastel-red-fg)]',
    'bg-[var(--pastel-orange)] text-[var(--pastel-orange-fg)]',
    'bg-[var(--pastel-yellow)] text-[var(--pastel-yellow-fg)]',
    'bg-[var(--pastel-green)] text-[var(--pastel-green-fg)]',
    'bg-[var(--pastel-blue)] text-[var(--pastel-blue-fg)]',
    'bg-[var(--pastel-purple)] text-[var(--pastel-purple-fg)]',
    'bg-[var(--pastel-pink)] text-[var(--pastel-pink-fg)]',
]

interface GameFormData {
    title: string
    description: string
    worldDescription: string
    objective: string
    firstPrompt: string
    authorStyle: string
    turnInstructions: string
    summarizationInstructions: string
    victoryCondition: string
    defeatCondition: string
    imageStyle: string
    imageInstructions: string
    imageModel: string
    designNotes: string
    public: boolean
    favorite: boolean
}

function EditGame() {
    const { id } = Route.useParams()
    const { data: gameResponse, isLoading } = useGame(id)
    const game = gameResponse?.game
    const updateGame = useUpdateGame()
    const queryClient = useQueryClient()

    // Tabs
    const [activeTab, setActiveTab] = useState('general')

    // Form State - using correct schema field names
    const [formData, setFormData] = useState<Partial<GameFormData>>({})
    const [characters, setCharacters] = useState<any[]>([])
    const [npcs, setNpcs] = useState<any[]>([])
    const [lore, setLore] = useState<any[]>([])
    const [states, setStates] = useState<any[]>([]) // was: items
    const [triggers, setTriggers] = useState<any[]>([])

    const colorClass = useMemo(() => {
        if (!game) return pastelClasses[0];
        const index = game.id.charCodeAt(0) % pastelClasses.length;
        return pastelClasses[index];
    }, [game?.id]);

    useEffect(() => {
        if (game) {
            setFormData({
                title: game.title || '',
                description: game.description || '',
                worldDescription: (game as any).worldDescription || '',
                objective: game.objective || '',
                firstPrompt: (game as any).firstPrompt || '',
                authorStyle: (game as any).authorStyle || '',
                turnInstructions: (game as any).turnInstructions || '',
                summarizationInstructions: (game as any).summarizationInstructions || '',
                victoryCondition: (game as any).victoryCondition || '',
                defeatCondition: (game as any).defeatCondition || '',
                imageStyle: (game as any).imageStyle || '',
                imageInstructions: (game as any).imageInstructions || '',
                imageModel: (game as any).imageModel || '',
                designNotes: (game as any).designNotes || '',
                public: (game as any).public || false,
                favorite: (game as any).favorite || false,
            })

            if ((game as any).characters) setCharacters((game as any).characters)
            if ((game as any).npcs) setNpcs((game as any).npcs)
            if ((game as any).lorebookEntries) setLore((game as any).lorebookEntries)
            if ((game as any).states) setStates((game as any).states)
            if ((game as any).triggers) setTriggers((game as any).triggers)
        }
    }, [game])

    const handleSave = async () => {
        try {
            await updateGame.mutateAsync({
                id,
                data: {
                    ...formData,
                    characters,
                    npcs,
                    lorebookEntries: lore,
                    states,
                    triggers,
                },
            })
            queryClient.invalidateQueries({ queryKey: ['games', id] })
        } catch (e) {
            console.error(e)
            alert('Update failed')
        }
    }

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#fcfbf9]">
                <Loader2 className="animate-spin w-8 h-8 text-muted-foreground" />
            </div>
        )
    }

    if (!game) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#fcfbf9]">
                <div className="text-xl font-serif font-medium">World not found</div>
                <Link to="/" className="text-sm underline hover:text-primary">
                    Return to Gallery
                </Link>
            </div>
        )
    }

    const tabs = [
        { id: 'general', label: 'Overview', icon: Gear },
        { id: 'narrative', label: 'Narrative', icon: Scroll },
        { id: 'characters', label: 'Characters', icon: Users },
        { id: 'npcs', label: 'NPCs', icon: Users },
        { id: 'lore', label: 'Lore', icon: Books },
        { id: 'states', label: 'States', icon: Cube },
        { id: 'triggers', label: 'Triggers', icon: Lightning },
        { id: 'images', label: 'Images', icon: ImageSquare },
        { id: 'settings', label: 'Settings', icon: Gear },
    ]

    return (
        <div className="min-h-screen bg-[#fcfbf9] pb-20">
            {/* Header Section */}
            <div className={`relative ${colorClass} transition-colors duration-500`}>
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />

                <div className="relative max-w-6xl mx-auto px-6 md:px-12 py-8">
                    {/* Navigation */}
                    <header className="flex items-center justify-between mb-8">
                        <Link to="/games/$id" params={{ id }} className="flex items-center gap-2 text-current/70 hover:text-current transition-colors group">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-medium font-serif">Back to World</span>
                        </Link>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider opacity-60 mr-2">
                                Edit Mode
                            </span>
                            <button
                                onClick={handleSave}
                                disabled={updateGame.isPending}
                                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-medium transition-all shadow-md disabled:opacity-50"
                            >
                                {updateGame.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FloppyDisk size={18} weight="fill" />}
                                <span>{updateGame.isPending ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                        </div>
                    </header>

                    <h1 className="text-4xl md:text-5xl font-black font-serif tracking-tight leading-[0.9] text-current/90 max-w-4xl">
                        Editing: {game.title}
                    </h1>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar Tabs */}
                    <div className="lg:col-span-3 space-y-2">
                        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-2 border border-dashed border-border/60">
                            {tabs.map(tab => {
                                const Icon = tab.icon
                                const isActive = activeTab === tab.id
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all rounded-xl text-left mb-1",
                                            isActive
                                                ? "bg-white shadow-sm text-foreground border border-border/50"
                                                : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                                        )}
                                    >
                                        <Icon size={18} weight={isActive ? "fill" : "regular"} className={cn(isActive ? "text-foreground" : "text-muted-foreground")} />
                                        {tab.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-9">
                        <div className="bg-white rounded-3xl border border-dashed border-border/60 p-8 shadow-sm min-h-[500px] relative">
                            {activeTab === 'general' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center gap-2 text-muted-foreground border-b border-dashed border-border pb-4">
                                        <Gear size={20} />
                                        <h2 className="font-serif text-lg font-semibold text-foreground">Core Parameters</h2>
                                    </div>

                                    <FormGroup label="World Title">
                                        <Input value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                    </FormGroup>

                                    <FormGroup label="Description">
                                        <Textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} />
                                    </FormGroup>

                                    <FormGroup label="World Description" hint="The lore, setting, and background of your world">
                                        <Textarea value={formData.worldDescription || ''} onChange={e => setFormData({ ...formData, worldDescription: e.target.value })} rows={6} />
                                    </FormGroup>

                                    <FormGroup label="Primary Objective" hint="What the player is trying to achieve">
                                        <Textarea value={formData.objective || ''} onChange={e => setFormData({ ...formData, objective: e.target.value })} rows={3} />
                                    </FormGroup>

                                    <FormGroup label="First Prompt" hint="The opening scene when a player starts">
                                        <Textarea value={formData.firstPrompt || ''} onChange={e => setFormData({ ...formData, firstPrompt: e.target.value })} rows={4} />
                                    </FormGroup>
                                </div>
                            )}

                            {activeTab === 'narrative' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center gap-2 text-muted-foreground border-b border-dashed border-border pb-4">
                                        <Scroll size={20} />
                                        <h2 className="font-serif text-lg font-semibold text-foreground">Narrative Settings</h2>
                                    </div>

                                    <FormGroup label="Author Style" hint="The narrative voice and writing style of the AI">
                                        <Textarea
                                            value={formData.authorStyle || ''}
                                            onChange={e => setFormData({ ...formData, authorStyle: e.target.value })}
                                            rows={4}
                                            placeholder="e.g. Write like a mysterious storyteller, using evocative language and dramatic pauses..."
                                        />
                                    </FormGroup>

                                    <FormGroup label="Turn Instructions" hint="Instructions given to the AI each turn">
                                        <Textarea
                                            value={formData.turnInstructions || ''}
                                            onChange={e => setFormData({ ...formData, turnInstructions: e.target.value })}
                                            rows={4}
                                            placeholder="e.g. Always describe the environment first, then character reactions..."
                                        />
                                    </FormGroup>

                                    <FormGroup label="Summarization Instructions" hint="How to summarize conversation context">
                                        <Textarea
                                            value={formData.summarizationInstructions || ''}
                                            onChange={e => setFormData({ ...formData, summarizationInstructions: e.target.value })}
                                            rows={3}
                                            placeholder="e.g. Focus on key plot points and character relationships..."
                                        />
                                    </FormGroup>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormGroup label="Victory Condition" hint="How the player wins">
                                            <Textarea
                                                value={formData.victoryCondition || ''}
                                                onChange={e => setFormData({ ...formData, victoryCondition: e.target.value })}
                                                rows={3}
                                                placeholder="e.g. Defeat the dragon and save the kingdom..."
                                            />
                                        </FormGroup>

                                        <FormGroup label="Defeat Condition" hint="How the player loses">
                                            <Textarea
                                                value={formData.defeatCondition || ''}
                                                onChange={e => setFormData({ ...formData, defeatCondition: e.target.value })}
                                                rows={3}
                                                placeholder="e.g. Health reaches zero or time runs out..."
                                            />
                                        </FormGroup>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'characters' && (
                                <ListEditor
                                    items={characters}
                                    setItems={setCharacters}
                                    title="Characters"
                                    itemName="Character"
                                    icon={Users}
                                    fields={[
                                        { key: 'name', label: 'Name', type: 'text' },
                                        { key: 'description', label: 'Profile', type: 'textarea' },
                                    ]}
                                    newItem={{ name: 'New Character', description: '', position: 0 }}
                                />
                            )}

                            {activeTab === 'npcs' && (
                                <ListEditor
                                    items={npcs}
                                    setItems={setNpcs}
                                    title="NPCs"
                                    itemName="NPC"
                                    icon={Users}
                                    fields={[
                                        { key: 'name', label: 'Name', type: 'text' },
                                        { key: 'detail', label: 'Details', type: 'textarea' },
                                        { key: 'oneLiner', label: 'Voice/One-liner', type: 'text' },
                                        { key: 'appearance', label: 'Appearance', type: 'text' },
                                        { key: 'location', label: 'Location', type: 'text' },
                                        { key: 'secretInfo', label: 'Secret Info', type: 'textarea' },
                                    ]}
                                    newItem={{ name: 'New NPC', detail: '', oneLiner: '', appearance: '', location: '', secretInfo: '', position: 0 }}
                                />
                            )}

                            {activeTab === 'lore' && (
                                <ListEditor
                                    items={lore}
                                    setItems={setLore}
                                    title="Lore Entries"
                                    itemName="Entry"
                                    icon={Globe}
                                    fields={[
                                        { key: 'name', label: 'Entry Name', type: 'text' },
                                        { key: 'content', label: 'Content', type: 'textarea' },
                                    ]}
                                    newItem={{ name: 'New Entry', content: '', position: 0 }}
                                />
                            )}

                            {activeTab === 'states' && (
                                <ListEditor
                                    items={states}
                                    setItems={setStates}
                                    title="Game States"
                                    itemName="State"
                                    icon={Cube}
                                    fields={[
                                        { key: 'name', label: 'State Name', type: 'text' },
                                        { key: 'description', label: 'Description', type: 'text' },
                                        { key: 'dataType', label: 'Type', type: 'select', options: ['text', 'number', 'boolean'] },
                                        { key: 'initialValue', label: 'Initial Value', type: 'text' },
                                        { key: 'visibility', label: 'Visibility', type: 'select', options: ['visible', 'hidden', 'conditional'] },
                                    ]}
                                    newItem={{ name: 'New State', description: '', dataType: 'text', initialValue: '', visibility: 'visible', position: 0 }}
                                />
                            )}

                            {activeTab === 'triggers' && (
                                <ListEditor
                                    items={triggers}
                                    setItems={setTriggers}
                                    title="Triggers"
                                    itemName="Trigger"
                                    icon={Lightning}
                                    fields={[
                                        { key: 'name', label: 'Trigger Name', type: 'text' },
                                        { key: 'condition', label: 'Condition', type: 'textarea' },
                                        { key: 'effect', label: 'Effect', type: 'textarea' },
                                        { key: 'triggerOnTurn', label: 'Trigger on Turn #', type: 'number' },
                                        { key: 'oneShot', label: 'One-shot', type: 'checkbox' },
                                    ]}
                                    newItem={{ name: 'New Trigger', condition: '', effect: '', triggerOnTurn: null, oneShot: false, position: 0 }}
                                />
                            )}

                            {activeTab === 'images' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center gap-2 text-muted-foreground border-b border-dashed border-border pb-4">
                                        <ImageSquare size={20} />
                                        <h2 className="font-serif text-lg font-semibold text-foreground">Image Settings</h2>
                                    </div>

                                    <FormGroup label="Image Style" hint="Style prompt for generated images">
                                        <Input
                                            value={formData.imageStyle || ''}
                                            onChange={e => setFormData({ ...formData, imageStyle: e.target.value })}
                                            placeholder="e.g. fantasy illustration, detailed, vibrant colors"
                                        />
                                    </FormGroup>

                                    <FormGroup label="Image Instructions" hint="Detailed instructions for image generation">
                                        <Textarea
                                            value={formData.imageInstructions || ''}
                                            onChange={e => setFormData({ ...formData, imageInstructions: e.target.value })}
                                            rows={4}
                                            placeholder="e.g. Always include dramatic lighting, avoid text in images..."
                                        />
                                    </FormGroup>

                                    <FormGroup label="Image Model" hint="Preferred image generation model">
                                        <Input
                                            value={formData.imageModel || ''}
                                            onChange={e => setFormData({ ...formData, imageModel: e.target.value })}
                                            placeholder="e.g. flux-schnell"
                                        />
                                    </FormGroup>

                                    {/* Preview Image Section */}
                                    {(game as any).previewImage && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Current Preview</label>
                                            <div className="rounded-xl overflow-hidden border border-border/50 max-w-md">
                                                <img
                                                    src={(game as any).previewImage}
                                                    alt="Game preview"
                                                    className="w-full h-auto"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'settings' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center gap-2 text-muted-foreground border-b border-dashed border-border pb-4">
                                        <Gear size={20} />
                                        <h2 className="font-serif text-lg font-semibold text-foreground">World Settings</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border/50">
                                            <div className="flex items-center gap-3">
                                                {formData.public ? <Eye size={24} className="text-green-600" /> : <EyeSlash size={24} className="text-muted-foreground" />}
                                                <div>
                                                    <div className="font-medium">Public World</div>
                                                    <div className="text-xs text-muted-foreground">Others can view and fork this world</div>
                                                </div>
                                            </div>
                                            <Toggle
                                                checked={formData.public || false}
                                                onChange={checked => setFormData({ ...formData, public: checked })}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border/50">
                                            <div className="flex items-center gap-3">
                                                <Star size={24} weight={formData.favorite ? "fill" : "regular"} className={formData.favorite ? "text-yellow-500" : "text-muted-foreground"} />
                                                <div>
                                                    <div className="font-medium">Favorite</div>
                                                    <div className="text-xs text-muted-foreground">Mark this world as a favorite</div>
                                                </div>
                                            </div>
                                            <Toggle
                                                checked={formData.favorite || false}
                                                onChange={checked => setFormData({ ...formData, favorite: checked })}
                                            />
                                        </div>
                                    </div>

                                    <FormGroup label="Design Notes" hint="Internal notes for your reference (not shown to AI)">
                                        <Textarea
                                            value={formData.designNotes || ''}
                                            onChange={e => setFormData({ ...formData, designNotes: e.target.value })}
                                            rows={4}
                                            placeholder="e.g. Notes about planned updates, balance changes, etc."
                                        />
                                    </FormGroup>

                                    {(game as any).sourceGameId && (
                                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                            <div className="text-sm text-blue-800">
                                                <strong>Forked from:</strong> {(game as any).sourceGameId}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Helper Components

function FormGroup({ label, hint, children }: { label: string, hint?: string, children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                {label}
            </label>
            {hint && <p className="text-xs text-muted-foreground/70">{hint}</p>}
            {children}
        </div>
    )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            className="w-full bg-secondary/30 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 transition-all placeholder:text-muted-foreground/50"
        />
    )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <textarea
            {...props}
            className="w-full bg-secondary/30 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 transition-all resize-y min-h-[100px] placeholder:text-muted-foreground/50"
        />
    )
}

function Toggle({ checked, onChange }: { checked: boolean, onChange: (checked: boolean) => void }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                checked ? "bg-green-500" : "bg-gray-300"
            )}
        >
            <span
                className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                    checked ? "translate-x-6" : "translate-x-1"
                )}
            />
        </button>
    )
}

interface ListEditorField {
    key: string
    label: string
    type: 'text' | 'textarea' | 'number' | 'checkbox' | 'select'
    options?: string[]
}

function ListEditor({ items, setItems, title, itemName, icon: Icon, fields, newItem }: {
    items: any[]
    setItems: (items: any[]) => void
    title: string
    itemName: string
    icon: any
    fields: ListEditorField[]
    newItem: any
}) {
    const add = () => {
        setItems([...items, { ...newItem, id: undefined }]) // No ID means new
    }

    const remove = (index: number) => {
        const newItems = [...items]
        newItems.splice(index, 1)
        setItems(newItems)
    }

    const update = (index: number, key: string, value: any) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [key]: value }
        setItems(newItems)
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center border-b border-dashed border-border pb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                    {Icon && <Icon size={20} />}
                    <span className="font-serif text-lg font-semibold text-foreground">{title}</span>
                </div>
                <button
                    onClick={add}
                    className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                >
                    <Plus weight="bold" /> Add {itemName}
                </button>
            </div>

            <div className="grid gap-6">
                {items.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border/50 rounded-2xl bg-secondary/5 text-muted-foreground/50 gap-3">
                        <Article size={32} weight="light" />
                        <div className="text-sm">No {title.toLowerCase()} yet</div>
                    </div>
                )}

                {items.map((item: any, index: number) => (
                    <div key={item.id || index} className="border border-border/50 bg-card rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden group">
                        <div className="px-4 py-3 border-b border-border/10 bg-secondary/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-muted-foreground opacity-50">#{String(index + 1).padStart(2, '0')}</span>
                                <span className="font-serif font-medium text-foreground">{item.name || 'Untitled'}</span>
                            </div>
                            <button onClick={() => remove(index)} className="text-muted-foreground hover:text-destructive transition-colors p-1 opacity-50 group-hover:opacity-100">
                                <Trash size={16} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {fields.map((field: ListEditorField) => (
                                <FormGroup key={field.key} label={field.label}>
                                    {field.type === 'textarea' ? (
                                        <Textarea value={item[field.key] || ''} onChange={e => update(index, field.key, e.target.value)} rows={3} />
                                    ) : field.type === 'checkbox' ? (
                                        <Toggle
                                            checked={item[field.key] || false}
                                            onChange={checked => update(index, field.key, checked)}
                                        />
                                    ) : field.type === 'select' ? (
                                        <select
                                            value={item[field.key] || ''}
                                            onChange={e => update(index, field.key, e.target.value)}
                                            className="w-full bg-secondary/30 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 transition-all"
                                        >
                                            {field.options?.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <Input type={field.type} value={item[field.key] ?? ''} onChange={e => update(index, field.key, field.type === 'number' ? (e.target.value ? parseInt(e.target.value) : null) : e.target.value)} />
                                    )}
                                </FormGroup>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
