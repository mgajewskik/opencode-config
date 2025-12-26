import type { Plugin } from "@opencode-ai/plugin"

export const NotificationPlugin: Plugin = async ({ client, $ }) => {
  return {
    event: async ({ event }) => {
      // Send notification on session completion
      if (event.type === "session.idle") {
        const platform = process.platform
        const cwd = process.cwd()
        const message = `Session completed in ${cwd}`
        
        if (platform === "darwin") {
          // macOS
          await $`osascript -e 'display notification "${message}" with title "opencode"'`
        } else if (platform === "linux") {
          // Linux
          await $`notify-send "opencode" "${message}"`
        } else {
          // Unsupported platform - could log or silently skip
          console.warn(`Notifications not supported on platform: ${platform}`)
        }
      }
    },
  }
}
