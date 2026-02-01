import * as React from "react"
import { cn } from "@/utils/cn"

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    onCheckedChange?: (checked: boolean) => void;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, onCheckedChange, onChange, ...props }, ref) => {
        const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            const checked = event.target.checked;
            onCheckedChange?.(checked);
            onChange?.(event);
        }

        return (
            <input
                type="checkbox"
                className={cn(
                    "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50 accent-blue-600",
                    className
                )}
                ref={ref}
                onChange={handleChange}
                {...props}
            />
        )
    }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
