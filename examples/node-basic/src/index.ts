import assert = require('assert')
import { isObjectLike } from "lodash-es";

export function isAdmin(user: unknown) {
  assert.ok(isObjectLike(user))
  return (user as {role?: unknown}).role === 'admin';
}
