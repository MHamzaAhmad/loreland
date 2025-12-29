import { useState, useEffect, useCallback } from 'react'
import { Terminal, Database } from 'lucide-react'
import { Input } from './ui/8bit/input'
import { soundService } from '../lib/sounds'

interface SearchBarProps {
    onSearch: (query: string) => void
    placeholder?: string
    debounceMs?: number
}

export function SearchBar({
    onSearch,
    placeholder = "CONNECT_TO_DB...",
    debounceMs = 300
}: SearchBarProps) {
    const [value, setValue] = useState('')

    const debouncedSearch = useCallback(() => {
        onSearch(value)
    }, [value, onSearch])

    useEffect(() => {
        const timeout = setTimeout(debouncedSearch, debounceMs)
        return () => clearTimeout(timeout)
    }, [value, debounceMs, debouncedSearch])

    return (
        <div className="relative group/search w-full max-w-xl">
            <div className="hud-bracket absolute -inset-2 opacity-20 group-focus-within/search:opacity-100 transition-all duration-500 scale-95 group-focus-within/search:scale-100" />

            <div className="relative flex items-center bg-background/20 backdrop-blur-md border border-[var(--primary)]/20 group-focus-within/search:border-[var(--primary)]/50 transition-all duration-300">
                <div className="pl-4 pr-2 py-3 flex items-center gap-3 border-r border-[var(--primary)]/10">
                    <Database size={16} className="text-[var(--primary)]/40 group-focus-within/search:text-[var(--primary)] animate-pulse" />
                </div>

                <Input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onFocus={() => soundService.play('hover')}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold tracking-[0.2em] placeholder:text-[var(--primary)]/20 py-3 h-auto"
                />

                <div className="pr-4 pl-2 py-3">
                    <Terminal size={14} className="text-[var(--primary)]/30 group-focus-within/search:animate-bounce" />
                </div>

                {/* Technical Deco */}
                <div className="absolute -bottom-1 -right-1 w-8 h-[1px] bg-[var(--primary)]/30" />
                <div className="absolute -bottom-1 -right-1 w-[1px] h-8 bg-[var(--primary)]/30" />

                <div className="absolute -top-6 left-2 font-mono text-[7px] text-[var(--primary)]/40 tracking-[0.3em] uppercase opacity-0 group-focus-within/search:opacity-100 transition-opacity">
                    Accessing_Relational_Data
                </div>
            </div>
        </div>
    )
}
