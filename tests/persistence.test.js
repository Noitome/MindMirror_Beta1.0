import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert'

describe('PersistenceAdapter', () => {
  let adapter

  beforeEach(async () => {
    const { PersistenceAdapter } = await import('../src/utils/persistence.js')
    adapter = new PersistenceAdapter()
  })

  test('auth methods return null when auth disabled', async () => {
    const user = await adapter.getUser()
    assert.strictEqual(user, null)
    
    try {
      await adapter.login('google')
      assert.fail('Should have thrown error')
    } catch (error) {
      assert.ok(error.message.includes('disabled') || error.message.includes('not configured'))
    }
  })

  test('migration handles version changes correctly', async () => {
    const oldData = { appVersion: '0.9.0', tasks: {} }
    
    const migrated = await adapter.runMigrations(oldData)
    assert.strictEqual(migrated.appVersion, '1.0.0')
  })

  test('syncData returns local data when auth disabled', async () => {
    const localData = { tasks: {}, lastSavedAt: Date.now() }
    const result = await adapter.syncData(localData)
    
    assert.strictEqual(result.synced, false)
    assert.strictEqual(result.data, localData)
  })

  test('export data creates proper structure', async () => {
    const testData = {
      tasks: { 'test1': { id: 'test1', name: 'Test Task' } },
      appVersion: '1.0.0'
    }
    
    assert.doesNotThrow(() => {
      adapter.exportData(testData)
    })
  })

  test('adapter initializes correctly in Node.js environment', async () => {
    assert.strictEqual(adapter.user, null)
    assert.ok(Array.isArray(adapter.authStateListeners))
  })
})
