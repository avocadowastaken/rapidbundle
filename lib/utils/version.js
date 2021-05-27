import semver from "semver";

/**
 * @param {string} range
 * @returns {null | string}
 */
export function getMinVersion(range) {
  try {
    const version = semver.minVersion(range, true);

    if (version) {
      return version.toString();
    }
  } catch {
    //
  }

  return null;
}

/**
 * @param {string} version
 * @returns {boolean}
 */
export function isValidVersion(version) {
  try {
    return semver.parse(version, false) != null;
  } catch {
    return false;
  }
}
