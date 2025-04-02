export interface RateLimiterOptions {
  interval: number
  uniqueTokenPerInterval: number
}

interface RateLimiterResponse {
  check: (limit: number, token: string) => Promise<void>
}

export function rateLimit(options: RateLimiterOptions): RateLimiterResponse {
  const tokenCache = new Map<string, number[]>()
  let activeTokens: string[] = []

  // Clean up function to remove old tokens
  const cleanup = () => {
    const now = Date.now()
    activeTokens.forEach((token) => {
      const tokenTimestamps = tokenCache.get(token)
      if (tokenTimestamps) {
        const newTimestamps = tokenTimestamps.filter((timestamp) => now - timestamp < options.interval)
        if (newTimestamps.length > 0) {
          tokenCache.set(token, newTimestamps)
        } else {
          tokenCache.delete(token)
          activeTokens = activeTokens.filter((t) => t !== token)
        }
      }
    })
  }

  // Set up periodic cleanup
  setInterval(cleanup, options.interval / 10)

  return {
    check: (limit: number, token: string) => {
      return new Promise((resolve, reject) => {
        const now = Date.now()
        cleanup()

        // Check if token exists
        const tokenTimestamps = tokenCache.get(token) || []

        // Filter out timestamps that are older than the interval
        const newTimestamps = [...tokenTimestamps.filter((timestamp) => now - timestamp < options.interval), now]

        // Check if the number of requests exceeds the limit
        if (newTimestamps.length > limit) {
          const oldestTimestamp = newTimestamps[0]
          const retryAfter = Math.ceil((options.interval - (now - oldestTimestamp)) / 1000)

          const error: any = new Error("Rate limit exceeded")
          error.statusCode = 429
          error.retryAfter = retryAfter

          return reject(error)
        }

        // Update token cache
        tokenCache.set(token, newTimestamps)
        if (!activeTokens.includes(token)) {
          activeTokens.push(token)
        }

        // Check if we've exceeded the total number of unique tokens
        if (tokenCache.size > options.uniqueTokenPerInterval) {
          const error: any = new Error("Rate limit exceeded")
          error.statusCode = 429
          return reject(error)
        }

        resolve()
      })
    },
  }
}

