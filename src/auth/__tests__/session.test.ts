import crypto from 'node:crypto'
import { describe, it, expect } from 'vitest'
import { createSessionToken, validateSessionToken, verifyPassword } from '#/auth/session'

const TEST_SECRET = 'test-secret-key-for-signing'

describe('createSessionToken', () => {
  it('returns a string with payload and signature separated by a dot', () => {
    const token = createSessionToken(TEST_SECRET)
    const parts = token.split('.')
    expect(parts).toHaveLength(2)
  })

  it('creates tokens that are valid', () => {
    const token = createSessionToken(TEST_SECRET)
    expect(validateSessionToken(token, TEST_SECRET)).toBe(true)
  })
})

describe('validateSessionToken', () => {
  it('returns true for a valid, non-expired token', () => {
    const token = createSessionToken(TEST_SECRET)
    expect(validateSessionToken(token, TEST_SECRET)).toBe(true)
  })

  it('returns false for a token signed with a different secret', () => {
    const token = createSessionToken(TEST_SECRET)
    expect(validateSessionToken(token, 'wrong-secret')).toBe(false)
  })

  it('returns false for a tampered token', () => {
    const token = createSessionToken(TEST_SECRET)
    const tampered = token.slice(0, -1) + 'x'
    expect(validateSessionToken(tampered, TEST_SECRET)).toBe(false)
  })

  it('returns false for a malformed token', () => {
    expect(validateSessionToken('garbage', TEST_SECRET)).toBe(false)
    expect(validateSessionToken('', TEST_SECRET)).toBe(false)
    expect(validateSessionToken('a.b.c', TEST_SECRET)).toBe(false)
  })

  it('returns false for an expired token', () => {
    const expiredTimestamp = `${Date.now() - 1000}`
    const signature = crypto.createHmac('sha256', TEST_SECRET).update(expiredTimestamp).digest('hex')
    const expiredToken = `${expiredTimestamp}.${signature}`
    expect(validateSessionToken(expiredToken, TEST_SECRET)).toBe(false)
  })
})

describe('verifyPassword', () => {
  it('returns true for matching passwords', () => {
    expect(verifyPassword('my-secret-password', 'my-secret-password')).toBe(true)
  })

  it('returns false for non-matching passwords', () => {
    expect(verifyPassword('wrong', 'my-secret-password')).toBe(false)
  })

  it('returns false for different length passwords', () => {
    expect(verifyPassword('short', 'much-longer-password')).toBe(false)
  })
})
