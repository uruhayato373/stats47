"use client"

import * as React from "react"

import { GripVertical } from "lucide-react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

import { cn } from "@/lib/utils"

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof PanelGroup>) => {
  return (
    <PanelGroup
      className={cn(
        "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
        className
      )}
      {...props}
    />
  )
}

const ResizablePanel = React.forwardRef<
  React.ElementRef<typeof Panel>,
  React.ComponentProps<typeof Panel>
>(({ className, ...props }, ref) => {
  return (
    <Panel
      ref={ref}
      className={cn(
        "relative flex-1 overflow-hidden",
        className
      )}
      {...props}
    />
  )
})
ResizablePanel.displayName = "ResizablePanel"

const ResizableHandle = React.forwardRef<
  React.ElementRef<typeof PanelResizeHandle>,
  React.ComponentProps<typeof PanelResizeHandle> & {
    withHandle?: boolean
  }
>(({ className, withHandle, ...props }, ref) => {
  return (
    <PanelResizeHandle
      ref={ref}
      className={cn(
        "relative w-px bg-gray-200 dark:bg-neutral-700 hover:bg-primary/50 transition-colors after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      {...props}
    />
  )
})
ResizableHandle.displayName = "ResizableHandle"

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }