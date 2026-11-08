import * as React from "react"
import { cn } from "../../lib/utils"

export function Select({ value, onValueChange, children }: any) {
    return (
        <div className="relative">
             <select 
                value={value} 
                onChange={(e) => onValueChange(e.target.value)}
                className="w-full h-10 rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:text-slate-50 dark:focus:ring-slate-300"
            >
                {children}
            </select>
        </div>
    )
}

export function SelectTrigger({ className, children }: any) {
    return <>{children}</>
}

export function SelectValue({ placeholder }: any) {
    return <>{placeholder}</>
}

export function SelectContent({ children }: any) {
    return <>{children}</>
}

export function SelectItem({ value, children }: any) {
    return <option value={value}>{children}</option>
}