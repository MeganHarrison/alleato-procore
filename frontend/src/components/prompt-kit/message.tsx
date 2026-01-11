"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { forwardRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const Message = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("py-4", className)} {...props} />
));
Message.displayName = "Message";

interface MessageContentProps extends React.HTMLAttributes<HTMLDivElement> {
  markdown?: boolean;
}

export const MessageContent = forwardRef<HTMLDivElement, MessageContentProps>(
  ({ className, markdown, children, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm", className)} {...props}>
      {markdown ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {children as string}
        </ReactMarkdown>
      ) : (
        children
      )}
    </div>
  ),
);
MessageContent.displayName = "MessageContent";

export const MessageActions = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mt-2 flex items-center", className)}
    {...props}
  />
));
MessageActions.displayName = "MessageActions";

interface MessageActionProps extends React.HTMLAttributes<HTMLDivElement> {
  tooltip?: string;
  delayDuration?: number;
}

export const MessageAction = forwardRef<HTMLDivElement, MessageActionProps>(
  ({ tooltip, delayDuration = 0, children, ...props }, ref) => {
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
  },
);
MessageAction.displayName = "MessageAction";
