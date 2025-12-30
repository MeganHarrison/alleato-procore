import { cn } from "@/lib/utils"
import { forwardRef } from "react"

export const ChatContainerRoot = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative w-full", className)}
    {...props}
  />
))
ChatContainerRoot.displayName = "ChatContainerRoot"

export const ChatContainerContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-full", className)}
    {...props}
  />
))
ChatContainerContent.displayName = "ChatContainerContent"
