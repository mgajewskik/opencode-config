import type { Plugin } from "@opencode-ai/plugin"
import { findDeniedBashCommand } from "./security/shared.js"

export const SecurityBashPlugin: Plugin = async () => {
  return {
    "tool.execute.before": async (input, output) => {
      const tool = String(input?.tool ?? "").toLowerCase()
      if (tool !== "bash" && tool !== "shell") return

      const args = output?.args
      if (!args || typeof args !== "object") return

      const command = (args as Record<string, unknown>).command
      if (typeof command !== "string" || !command) return

      const denied = findDeniedBashCommand(command)
      if (denied) throw new Error(`Blocked by Bash security policy: ${denied.reason}`)
    },
  }
}

export default SecurityBashPlugin
