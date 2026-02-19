import type { Plugin } from "@opencode-ai/plugin"
import { spawn } from "bun"

type Urgency = "low" | "normal" | "critical"

const shortenPath = (path: string) =>
  path.replace(/^\/home\/[^/]+/, "~").replace(/^\/Users\/[^/]+/, "~")

const escapeAppleScript = (value: string) => value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')

export const NotificationPlugin: Plugin = async ({ client, directory }) => {
  const primarySessionCache = new Map<string, boolean>()

  const notify = (title: string, urgency: Urgency, icon: string, timeoutMs: number) => {
    const message = shortenPath(directory)
    if (process.platform === "darwin") {
      const escapedMessage = escapeAppleScript(message)
      const escapedTitle = escapeAppleScript(title)
      spawn(["osascript", "-e", `display notification "${escapedMessage}" with title "${escapedTitle}"`])
    } else if (process.platform === "linux") {
      spawn(["notify-send", "-u", urgency, "-i", icon, "-t", String(timeoutMs), title, message])
    }
  }

  const isPrimarySession = async (sessionID?: string) => {
    if (!sessionID) return false

    const cached = primarySessionCache.get(sessionID)
    if (cached !== undefined) return cached

    try {
      const { data } = await client.session.get({ path: { id: sessionID }, query: { directory } })
      const isPrimary = !!data && !data.parentID
      primarySessionCache.set(sessionID, isPrimary)
      return isPrimary
    } catch {
      return false
    }
  }

  return {
    event: async ({ event }) => {
      if (event.type === "session.idle") {
        if (!(await isPrimarySession(event.properties.sessionID))) return
        notify("opencode ✅ Done", "low", "dialog-information", 10000)
      }
      if (event.type === "session.error") {
        if (event.properties.sessionID && !(await isPrimarySession(event.properties.sessionID))) return
        notify("opencode ❌ Error", "critical", "dialog-error", 30000)
      }
      if (event.type === "permission.updated") {
        if (!(await isPrimarySession(event.properties.sessionID))) return
        notify(`opencode ❓ ${event.properties.title}`, "critical", "dialog-question", 30000)
      }
    },
  }
}
