import { Link, useLocation } from '@tanstack/react-router'
import { useState } from 'react'
import {
  List,
  X,
  House,
  Compass,
  Lightning,
} from '@phosphor-icons/react'
import { AuthButton } from './AuthButton'
import { CreditBalance } from './CreditBalance'
import { MobileCreditButton } from './MobileCreditButton'
import { CreditStore } from './CreditStore'
import { cn } from '@/lib/utils'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [isStoreOpen, setIsStoreOpen] = useState(false)
  const location = useLocation()

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const navItems = [
    {
      to: '/',
      label: 'Home',
      icon: House,
      color: 'text-rose-500',
    },
    {
      to: '/games/new',
      label: 'Create',
      icon: Lightning,
      color: 'text-amber-500',
    },
    {
      to: '/games/mine',
      label: 'Library',
      icon: Compass,
      color: 'text-indigo-500',
    },
  ]

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-dashed border-border/60">
        <div className="container mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-6 h-6 flex items-center justify-center font-serif font-bold text-base bg-primary/5 text-primary rounded group-hover:bg-primary/10 transition-colors">
                L
              </div>
              <span className="font-serif font-bold text-base tracking-tight text-foreground/90">
                Loreland
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 border",
                      isActive
                        ? "bg-secondary/60 text-foreground border-border/40"
                        : "border-transparent text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                    )}
                  >
                    <item.icon
                      weight={isActive ? "fill" : "regular"}
                      className={cn(
                        "w-3.5 h-3.5 transition-colors",
                        isActive ? cn("scale-105", item.color) : "text-muted-foreground"
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Desktop: Credit balance in header */}
            <div className="hidden md:block">
              <CreditBalance onBuyClick={() => setIsStoreOpen(true)} />
            </div>
            
            <div className="hidden md:block scale-90 origin-right">
              <AuthButton />
            </div>

            <button
              onClick={toggleMenu}
              className="md:hidden p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              {isOpen ? <X size={18} /> : <List size={18} />}
            </button>
          </div>
        </div>
      </header>
      
      {/* Mobile: Floating credit button */}
      <div className="md:hidden">
        <MobileCreditButton onClick={() => setIsStoreOpen(true)} />
      </div>
      
      {/* Credit Store Modal */}
      <CreditStore 
        isOpen={isStoreOpen} 
        onClose={() => setIsStoreOpen(false)} 
      />

      {/* Mobile Drawer */}
      <div className={cn(
        "fixed inset-0 z-50 bg-background/95 backdrop-blur-sm md:hidden transition-all duration-300 ease-in-out",
        isOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
      )}>
        <div className="h-full flex flex-col p-5 border-l border-dashed border-border/60 ml-16 bg-background shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <span className="font-serif font-bold text-lg">Menu</span>
            <button onClick={toggleMenu} className="p-1.5 border border-dashed border-transparent hover:border-border rounded-md">
              <X size={20} />
            </button>
          </div>

          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg text-base font-medium transition-colors border",
                    isActive
                      ? "bg-secondary/60 text-foreground border-border/50 shadow-sm"
                      : "border-transparent hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon
                    weight={isActive ? "fill" : "regular"}
                    className={cn(
                      "w-5 h-5",
                      isActive ? item.color : "text-muted-foreground"
                    )}
                  />
                  {item.label}
                </Link>
              )
            })}
            <div className="mt-6 pt-6 border-t border-dashed border-border/60">
              <AuthButton />
            </div>
          </nav>
        </div>
      </div>
    </>
  )
}
