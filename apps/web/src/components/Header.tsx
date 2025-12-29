import { Link } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import {
  Home,
  Menu,
  X,
  Compass,
  User,
  Zap,
} from 'lucide-react'
import { AuthButton } from './AuthButton'
import { soundService } from '../lib/sounds'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  const playSound = useCallback((type: 'open' | 'close' | 'hover') => {
    soundService.play(type)
  }, [])

  const toggleMenu = () => {
    if (isOpen) {
      playSound('close')
    } else {
      playSound('open')
    }
    setIsOpen(!isOpen)
  }

  return (
    <>
      <header className="px-6 py-4 flex items-center justify-between hud-panel border-x-0 border-t-0 z-40 bg-background/40 backdrop-blur-xl group">
        <div className="hud-bracket absolute inset-0 pointer-events-none" />

        <div className="flex items-center gap-6 z-10">
          <button
            onClick={toggleMenu}
            className="relative p-2 group/btn overflow-hidden transition-all duration-300 hover:scale-105"
            aria-label="Toggle menu"
            onMouseEnter={() => playSound('hover')}
          >
            <div className="absolute inset-0 border border-[var(--primary)]/30 group-hover/btn:border-[var(--primary)] transition-colors" />
            <Menu size={20} className="text-[var(--primary)] group-hover/btn:scale-110 transition-transform" />
          </button>

          <Link to="/" className="flex flex-col gap-0 group/logo" onMouseEnter={() => playSound('hover')}>
            <h1 className="text-2xl font-black tracking-[0.4em] glow-text leading-none transition-all duration-300 group-hover/logo:tracking-[0.6em]">
              LORELAND
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-[7px] font-mono text-[var(--primary)]/50 tracking-[0.5em]">VISION_INTERFACE_v4.2</span>
              <div className="h-px flex-1 bg-[var(--primary)]/20" />
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-8 z-10">
          <div className="hidden lg:flex flex-col items-end gap-1 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-[7px] text-[var(--primary)]/40 uppercase tracking-widest">Core_Temp</span>
              <span className="text-[9px] text-[var(--primary)] tracking-widest animate-pulse">34.2°C</span>
            </div>
            <div className="w-24 h-[2px] bg-[var(--primary)]/10 relative overflow-hidden">
              <div className="absolute inset-0 bg-[var(--primary)] w-3/4 opacity-50" />
              <div className="absolute inset-0 bg-[var(--primary)] w-1/4 animate-[shimmer_2s_infinite]" />
            </div>
          </div>

          <div className="relative group/auth">
            <div className="hud-bracket absolute -inset-1 opacity-40 group-hover/auth:opacity-100 transition-opacity" />
            <AuthButton />
          </div>
        </div>
      </header>

      {/* Futuristic Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-background/95 border-r border-[var(--primary)]/30 z-50 transform transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] flex flex-col ${isOpen ? 'translate-x-0 shadow-[20px_0_50px_rgba(0,0,0,0.8)]' : '-translate-x-full'
          }`}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.05)_1px,transparent_1px)] bg-[length:20px_20px]" />
        </div>

        <div className="p-8 border-b border-[var(--primary)]/20 relative">
          <div className="hud-label">Module_Select</div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black tracking-[0.5em] text-[var(--primary)]">MAIN_MENU</h2>
            <button
              onClick={toggleMenu}
              className="p-1 text-[var(--primary)]/50 hover:text-[var(--primary)] transition-colors"
              onMouseEnter={() => playSound('hover')}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-8 space-y-6 relative overflow-y-auto">
          <div className="space-y-2">
            <NavLink to="/" icon={<Home size={18} />} label="DASHBOARD" onClick={toggleMenu} />
            <NavLink to="/games/mine" icon={<Compass size={18} />} label="MY_VISIONS" onClick={toggleMenu} />
          </div>

          <div className="pt-8">
            <div className="text-[7px] font-mono tracking-[0.4em] mb-4 text-[var(--primary)]/40 px-4 uppercase">System_Link</div>
            <div className="space-y-2">
              <NavLink to="/auth/link" icon={<User size={16} />} label="ACCOUNT_SYNC" onClick={toggleMenu} />
              <NavLink to="/games/new" icon={<Zap size={16} />} label="CREATE_NEW_V" onClick={toggleMenu} />
            </div>
          </div>
        </nav>

        <div className="p-8 border-t border-[var(--primary)]/10 bg-background/50">
          <div className="flex flex-col gap-1 text-[8px] font-mono text-[var(--primary)]/30 tracking-widest leading-relaxed">
            <div className="flex items-center gap-2">
              <div className="size-1 bg-green-500 rounded-full animate-pulse" />
              <span>STATUS_STABLE</span>
            </div>
            <div>UPTIME_42.06.12</div>
            <div className="text-[var(--primary)]/20 mt-2">© LORELAND_PROTOCOLS // [0x74-f2]</div>
          </div>
        </div>
      </aside>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/40 backdrop-blur-md z-[45] transition-opacity duration-700 h-screen"
          onClick={toggleMenu}
        />
      )}
    </>
  )
}

function NavLink({ to, icon, label, onClick }: { to: string, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      onMouseEnter={() => soundService.play('hover')}
      className="flex items-center gap-4 p-4 border border-transparent hover:border-[var(--primary)]/30 hover:bg-[var(--primary)]/5 transition-all group relative overflow-hidden"
      activeProps={{
        className: 'flex items-center gap-4 p-4 border border-[var(--primary)]/40 bg-[var(--primary)]/10 text-[var(--primary)] relative overflow-hidden',
      }}
    >
      <div className="hud-bracket absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity" />
      <div className="text-[var(--primary)] group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
        {icon}
      </div>
      <span className="text-[10px] font-bold tracking-[0.3em] truncate">{label}</span>
      <div className="absolute right-0 top-0 h-full w-[2px] bg-[var(--primary)] opacity-0 group-hover:opacity-60 transition-opacity" />
    </Link>
  )
}
