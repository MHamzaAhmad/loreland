import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'
import { useGame, useUpdateGame } from '@packages/ui-logic'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, FloppyDisk, Plus, Trash, Globe, Users, Cube, Lightning, Gear, Books, Article } from '@phosphor-icons/react'
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

function EditGame() {
    const { id } = Route.useParams()
    const { data: gameResponse, isLoading } = useGame(id)
    const game = gameResponse?.game
    const updateGame = useUpdateGame()
    const queryClient = useQueryClient()

    // Tabs
    const [activeTab, setActiveTab] = useState('general')

    // Form State
    const [formData, setFormData] = useState<any>({})
    const [characters, setCharacters] = useState<any[]>([])
    const [npcs, setNpcs] = useState<any[]>([])
    const [lore, setLore] = useState<any[]>([])
    const [items, setItems] = useState<any[]>([])
    const [triggers, setTriggers] = useState<any[]>([])

    const colorClass = useMemo(() => {
        if (!game) return pastelClasses[0];
        const index = game.id.charCodeAt(0) % pastelClasses.length;
        return pastelClasses[index];
    }, [game?.id]);

    useEffect(() => {
        if (game) {
            setFormData({
                title: game.title,
                description: game.description,
                background: game.background,
                instructions: game.instructions,
                objective: game.objective,
                imageStyle: game.imageStyle,
            })

            if ((game as any).characters) setCharacters((game as any).characters)
            if ((game as any).npcs) setNpcs((game as any).npcs)
            if ((game as any).lorebookEntries) setLore((game as any).lorebookEntries)
            if ((game as any).trackedItems) setItems((game as any).trackedItems)
            if ((game as any).triggerEvents) setTriggers((game as any).triggerEvents)
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
                    trackedItems: items,
                    triggerEvents: triggers,
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
        { id: 'characters', label: 'Characters', icon: Users },
        { id: 'npcs', label: 'NPCs', icon: Users },
        { id: 'lore', label: 'Lore', icon: Books },
        { id: 'items', label: 'Items', icon: Cube },
        { id: 'triggers', label: 'Triggers', icon: Lightning },
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
                                className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background hover:bg-foreground/90 rounded-full font-medium transition-all shadow-md disabled:opacity-50"
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

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <FormGroup label="World Context">
                                            <Textarea value={formData.background || ''} onChange={e => setFormData({ ...formData, background: e.target.value })} rows={8} />
                                        </FormGroup>
                                        <div className="space-y-8">
                                            <FormGroup label="Primary Objective">
                                                <Textarea value={formData.objective || ''} onChange={e => setFormData({ ...formData, objective: e.target.value })} rows={3} />
                                            </FormGroup>
                                            <FormGroup label="AI Instructions">
                                                <Textarea value={formData.instructions || ''} onChange={e => setFormData({ ...formData, instructions: e.target.value })} rows={3} />
                                            </FormGroup>
                                        </div>
                                    </div>

                                    <FormGroup label="Visual Style Prompt">
                                        <Input value={formData.imageStyle || ''} onChange={e => setFormData({ ...formData, imageStyle: e.target.value })} placeholder="e.g. moody cyberpunk, neon lights, rain" />
                                    </FormGroup>
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
                                        { key: 'appearance', label: 'Visual Description', type: 'textarea' }
                                    ]}
                                    newItem={{ name: 'New Character', description: '', appearance: '', position: 0 }}
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
                                        { key: 'location', label: 'Location', type: 'text' }
                                    ]}
                                    newItem={{ name: 'New NPC', detail: '', oneLiner: '', location: '', position: 0 }}
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
                                        { key: 'name', label: 'Keyword', type: 'text' },
                                        { key: 'content', label: 'Content', type: 'textarea' }
                                    ]}
                                    newItem={{ name: 'New Keyword', content: '', position: 0 }}
                                />
                            )}

                            {activeTab === 'items' && (
                                <ListEditor
                                    items={items}
                                    setItems={setItems}
                                    title="Items"
                                    itemName="Item"
                                    icon={Cube}
                                    fields={[
                                        { key: 'name', label: 'Name', type: 'text' },
                                        { key: 'initialValue', label: 'Initial State', type: 'text' },
                                        { key: 'description', label: 'Description', type: 'text' }
                                    ]}
                                    newItem={{ name: 'Item', initialValue: '1', description: '', position: 0 }}
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
                                        { key: 'name', label: 'Event ID', type: 'text' },
                                        { key: 'triggerOnTurn', label: 'Turn #', type: 'number' },
                                        { key: 'effect', label: 'Effect', type: 'textarea' },
                                        { key: 'condition', label: 'Condition', type: 'text' }
                                    ]}
                                    newItem={{ name: 'Event', triggerOnTurn: 1, effect: '', condition: '', position: 0 }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Helper Components

function FormGroup({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                {label}
            </label>
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

function ListEditor({ items, setItems, title, itemName, icon: Icon, fields, newItem }: any) {
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
                        <div className="text-sm">No items found</div>
                    </div>
                )}

                {items.map((item: any, index: number) => (
                    <div key={index} className="border border-border/50 bg-card rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden group">
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
                            {fields.map((field: any) => (
                                <FormGroup key={field.key} label={field.label}>
                                    {field.type === 'textarea' ? (
                                        <Textarea value={item[field.key] || ''} onChange={e => update(index, field.key, e.target.value)} rows={3} />
                                    ) : (
                                        <Input type={field.type} value={item[field.key] || ''} onChange={e => update(index, field.key, e.target.value)} />
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
