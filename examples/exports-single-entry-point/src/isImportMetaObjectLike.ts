import { isObjectLike } from "lodash-es";
export function isImportMetaObjectLike() {
  return isObjectLike(import.meta);
}
