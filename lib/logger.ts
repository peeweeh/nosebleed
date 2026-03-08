// lib/logger.ts — structured console logger for Nosebleed debug output.
// Use LOG_LEVEL env var: 'debug' | 'info' | 'warn' | 'error' (default: 'debug' in dev)

type Level = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_RANK: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 }

const configuredLevel: Level =
  (process.env.NEXT_PUBLIC_LOG_LEVEL as Level | undefined) ?? 'debug'

function shouldLog(level: Level): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[configuredLevel]
}

function tag(ns: string): string {
  return `[${ns}]`
}

function fmt(ns: string, msg: string, data?: unknown): unknown[] {
  const prefix = `${new Date().toISOString().slice(11, 23)} ${tag(ns)}`
  return data !== undefined ? [prefix, msg, data] : [prefix, msg]
}

export function createLogger(ns: string) {
  return {
    debug: (msg: string, data?: unknown) => {
      if (shouldLog('debug')) console.debug(...fmt(ns, msg, data))
    },
    info: (msg: string, data?: unknown) => {
      if (shouldLog('info')) console.info(...fmt(ns, msg, data))
    },
    warn: (msg: string, data?: unknown) => {
      if (shouldLog('warn')) console.warn(...fmt(ns, msg, data))
    },
    error: (msg: string, data?: unknown) => {
      if (shouldLog('error')) console.error(...fmt(ns, msg, data))
    },
  }
}

export type Logger = ReturnType<typeof createLogger>
