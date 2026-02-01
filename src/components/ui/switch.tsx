import { Switch as HeadlessSwitch } from '@headlessui/react'
import { cn } from "@/utils/cn"

interface SwitchProps {
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
    className?: string
    disabled?: boolean
    id?: string
    'aria-label'?: string
    'aria-describedby'?: string
}

export function Switch({ checked, onCheckedChange, className, ...props }: SwitchProps) {
    return (
        <HeadlessSwitch
            checked={checked || false}
            onChange={onCheckedChange || (() => { })}
            className={cn(
                "peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                checked ? 'bg-blue-600' : 'bg-gray-200',
                className
            )}
            {...props}
        >
            <span className="sr-only">Use setting</span>
            <span
                aria-hidden="true"
                className={cn(
                    "pointer-events-none block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                    checked ? 'translate-x-5' : 'translate-x-0'
                )}
            />
        </HeadlessSwitch>
    )
}
