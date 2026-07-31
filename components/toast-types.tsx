"use client"

import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"


export function ToastTypes() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() => toast.add({ description: "Event has been created." })}
      >
        Default
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.success("Success",{
            description: "Event has been created.",
          })
        }
      >
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.info("Info",{
            description: "Arrive 10 minutes before the event.",
          })
        }
      >
        Info
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.warning("Warning",{
            description: "The event cannot start before 8:00 AM.",
          })
        }
      >
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error("Error",{
            description: "The event could not be created.",
            priority: "high",
          })
        }
      >
        Error
      </Button>
    </div>
  )
}
