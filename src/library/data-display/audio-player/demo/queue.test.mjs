import test from 'node:test'
import assert from 'node:assert/strict'
import { QueueNavigation } from './queue.ts'

test('completion and manual next use separate repeat rules', () => {
  const queue = new QueueNavigation()
  assert.equal(queue.next('b', ['a', 'b'], 'off', false, true), undefined)
  assert.equal(queue.next('b', ['a', 'b'], 'all', false, true), 'a')
  assert.equal(queue.next('a', ['a', 'b'], 'one', false, true), 'a')
  assert.equal(queue.next('a', ['a', 'b'], 'one', false, false), 'b')
})

test('shuffle exhausts the queue without repeating and follows actual history', () => {
  const queue = new QueueNavigation()
  const ids = ['a', 'b', 'c']
  const first = queue.next('a', ids, 'off', true, true, () => 0)
  assert.equal(first, 'b')
  queue.visit('a', first)
  const second = queue.next(first, ids, 'off', true, true, () => 0)
  assert.equal(second, 'c')
  queue.visit(first, second)
  assert.equal(queue.next(second, ids, 'off', true, true), undefined)
  assert.equal(queue.previous(second, ids, true), 'b')
  assert.equal(queue.previous('b', ids, true), 'a')
})

test('removing and adding tracks cannot resurrect stale queue entries', () => {
  const queue = new QueueNavigation()
  queue.sync(['a', 'b', 'c'])
  queue.visit('a', 'b')
  assert.equal(
    queue.next('b', ['b', 'd'], 'off', true, true, () => 0),
    'd',
  )
  assert.equal(queue.previous('b', ['b', 'd'], true), undefined)
})

test('reordered queues navigate by stable identity', () => {
  const queue = new QueueNavigation()
  assert.equal(queue.next('b', ['c', 'b', 'a'], 'off', false, false), 'a')
  assert.equal(queue.previous('b', ['c', 'b', 'a'], false), 'c')
  assert.equal(queue.next('a', ['a'], 'all', true, true), 'a')
})
