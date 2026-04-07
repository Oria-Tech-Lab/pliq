import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface IconTooltipProps {
  label: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}

export function IconTooltip({ label, children, side = "top" }: IconTooltipProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className="text-xs px-2 py-1 rounded-md">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
