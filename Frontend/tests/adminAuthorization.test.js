import assert from 'node:assert/strict'
import test from 'node:test'

import { isAdminUser } from '../src/lib/adminAccess.js'

test('only main and assigned group administrators can enter the admin workspace', () => {
  assert.equal(isAdminUser(null), false)
  assert.equal(isAdminUser({ is_main_admin: false, group_id: null }), false)
  assert.equal(isAdminUser({ is_main_admin: true, group_id: null }), true)
  assert.equal(isAdminUser({ is_main_admin: false, group_id: 7 }), true)
})
