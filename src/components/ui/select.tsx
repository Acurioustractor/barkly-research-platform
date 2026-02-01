'use client';

import * as React from "react"
import { cn } from "@/utils/cn"
import { ChevronDown } from "lucide-react"

const SelectContext = React.createContext<{
    value: any
    onValueChange: (value: any) => void
    open: boolean
    setOpen: (open: boolean) => void
} | null>(null)

export const Select = ({ value, onValueChange, children }: any) => {
    const [open, setOpen] = React.useState(false)
    return (
        <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
            <div className="relative">{children}</div>
        </SelectContext.Provider>
    )
}

export const SelectTrigger = ({ children, className }: any) => {
    const context = React.useContext(SelectContext)
    if (!context) return null
    const { open, setOpen } = context

    return (
        <button
            type="button"
            onClick={() => setOpen(!open)}
            className={cn("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)}
        >
            {children}
            <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
    )
}

export const SelectValue = ({ placeholder }: any) => {
    const context = React.useContext(SelectContext)
    if (!context) return null
    const { value } = context
    return <span className="block truncate">{value || placeholder}</span>
}

export const SelectContent = ({ children, className }: any) => {
    const context = React.useContext(SelectContext)
    if (!context || !context.open) return null
    return (
        <div className={cn("absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white text-popover-foreground shadow-md animate-in fade-in-80 mt-1", className)}>
            <div className="p-1">{children}</div>
        </div>
    )
}

export const SelectItem = ({ value, children, className }: any) => {
    const context = React.useContext(SelectContext)
    if (!context) return null
    const { onValueChange, setOpen } = context

    return (
        <div
            onClick={() => {
                onValueChange(value)
                setOpen(false)
            }}
            className={cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none hover:bg-slate-100 cursor-pointer", className)}
        >
            {children}
        </div>
    )
}
