import type { Plugin } from "@opencode-ai/plugin"
import { findProtectedFileToolAccess } from "./security/shared.js"

export const SecurityFilesPlugin: Plugin = async () => {
  return {
    "tool.execute.before": async (input, output) => {
      const tool = String(input?.tool ?? "").toLowerCase()
      if (tool === "bash" || tool === "shell") return

      const denied = findProtectedFileToolAccess(tool, output?.args)
      if (denied) throw new Error(`Blocked by file security policy: ${denied.reason}`)
    },
  }
}

export default SecurityFilesPlugin
