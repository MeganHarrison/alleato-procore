"use client";

import { forwardRef, type KeyboardEvent } from "react";

import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface PromptInputProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading?: boolean;
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
}

export const PromptInput = forwardRef<HTMLDivElement, PromptInputProps>(
  (
    {
      className,
      children,
      isLoading,
      value,
      onValueChange,
      onSubmit,
      ...props
    },
    ref,
  ) => (
    <div ref={ref} className={cn("relative", className)} {...props}>
      {children}
    </div>
  ),
);
PromptInput.displayName = "PromptInput";

interface PromptInputTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value?: string;
  onValueChange?: (value: string) => void;
  onSubmit?: () => void;
}

export const PromptInputTextarea = forwardRef<
  HTMLTextAreaElement,
  PromptInputTextareaProps
>(({ className, value, onValueChange, onSubmit, ...props }, ref) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
  };

  return (
    <Textarea
      ref={ref}
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      onKeyDown={handleKeyDown}
      className={cn(
        "resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
        className,
      )}
      {...props}
    />
  );
});
PromptInputTextarea.displayName = "PromptInputTextarea";

export const PromptInputActions = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
));
PromptInputActions.displayName = "PromptInputActions";

interface PromptInputActionProps extends React.HTMLAttributes<HTMLDivElement> {
  tooltip?: string;
  delayDuration?: number;
}

export const PromptInputAction = forwardRef<
  HTMLDivElement,
  PromptInputActionProps
>(({ tooltip, delayDuration = 0, children, ...props }, ref) => {
  if (tooltip) {
    return (
      <TooltipProvider delayDuration={delayDuration}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div ref={ref} {...props}>
              {children}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
});
PromptInputAction.displayName = "PromptInputAction";
