// This file monitors data persistence operations and tracks their success/failure

type PersistenceStats = {
  operations: number
  successful: number
  failed: number
  collections: Record<
    string,
    {
      operations: number
      successful: number
      failed: number
    }
  >
  lastOperation: {
    timestamp: number
    collection: string
    type: string
    success: boolean
  } | null
}

// Initialize stats
const persistenceStats: PersistenceStats = {
  operations: 0,
  successful: 0,
  failed: 0,
  collections: {},
  lastOperation: null,
}

// Initialize the persistence monitor
export function initPersistenceMonitor() {
  console.log("Data persistence monitor initialized")
  return true
}

// Record a successful operation
export function recordSuccessfulOperation(collection: string, type: string) {
  persistenceStats.operations++
  persistenceStats.successful++

  if (!persistenceStats.collections[collection]) {
    persistenceStats.collections[collection] = {
      operations: 0,
      successful: 0,
      failed: 0,
    }
  }

  persistenceStats.collections[collection].operations++
  persistenceStats.collections[collection].successful++

  persistenceStats.lastOperation = {
    timestamp: Date.now(),
    collection,
    type,
    success: true,
  }
}

// Record a failed operation
export function recordFailedOperation(collection: string, type: string) {
  persistenceStats.operations++
  persistenceStats.failed++

  if (!persistenceStats.collections[collection]) {
    persistenceStats.collections[collection] = {
      operations: 0,
      successful: 0,
      failed: 0,
    }
  }

  persistenceStats.collections[collection].operations++
  persistenceStats.collections[collection].failed++

  persistenceStats.lastOperation = {
    timestamp: Date.now(),
    collection,
    type,
    success: false,
  }
}

// Check the health of persistence operations
export function checkPersistenceHealth() {
  const issues: string[] = []

  // Check overall success rate
  const successRate = persistenceStats.operations > 0 ? persistenceStats.successful / persistenceStats.operations : 1

  if (successRate < 0.9 && persistenceStats.operations > 10) {
    issues.push(`Low overall success rate: ${(successRate * 100).toFixed(1)}%`)
  }

  // Check for problematic collections
  Object.entries(persistenceStats.collections).forEach(([collection, stats]) => {
    const collectionSuccessRate = stats.operations > 0 ? stats.successful / stats.operations : 1

    if (collectionSuccessRate < 0.8 && stats.operations > 5) {
      issues.push(`Collection "${collection}" has a low success rate: ${(collectionSuccessRate * 100).toFixed(1)}%`)
    }
  })

  return {
    healthy: issues.length === 0,
    issues,
    stats: persistenceStats,
  }
}

// Reset stats (for testing)
export function resetPersistenceStats() {
  persistenceStats.operations = 0
  persistenceStats.successful = 0
  persistenceStats.failed = 0
  persistenceStats.collections = {}
  persistenceStats.lastOperation = null
}
