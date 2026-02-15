import type { Plugin } from "@opencode-ai/plugin"
import { spawn } from "bun"

type Urgency = "low" | "normal" | "critical"

const shortenPath = (path: string) =>
  path.replace(/^\/home\/[^/]+/, "~").replace(/^\/Users\/[^/]+/, "~")

export const NotificationPlugin: Plugin = ({ directory }) => {
  const notify = (title: string, urgency: Urgency, icon: string, timeoutMs: number) => {
    const message = shortenPath(directory)
    if (process.platform === "darwin") {
      spawn(["osascript", "-e", `display notification "${message}" with title "${title}"`])
    } else if (process.platform === "linux") {
      spawn(["notify-send", "-u", urgency, "-i", icon, "-t", String(timeoutMs), title, message])
    }
  }

  return {
    event: ({ event }) => {
      if (event.type === "session.idle") {
        notify("opencode ✅ Done", "low", "dialog-information", 10000)
      }
      if (event.type === "session.error") {
        notify("opencode ❌ Error", "critical", "dialog-error", 30000)
      }
      if (event.type === "permission.updated") {
        notify(`opencode ❓ ${event.properties.title}`, "critical", "dialog-question", 30000)
      }
    },
  }
}
