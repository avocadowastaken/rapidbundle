const BROWSERSLIST_ESBUILD_NAMES = {
  chrome: "chrome",
  edge: "edge",
  firefox: "firefox",
  ios_saf: "ios",
  safari: "safari",
};

/**
 * @param {string | string[]} input
 * @returns {Promise<string[]>}
 */
export async function getESBuildBrowsers(input) {
  const { default: browserslist } = await import("browserslist");
  const browsers = browserslist(input, { mobileToDesktop: true });

  /** @type {Map<string, string>} */
  const targets = new Map();

  for (const browser of browsers) {
    const [name, versionRange] =
      /** @type {[keyof typeof BROWSERSLIST_ESBUILD_NAMES, string]}*/ (
        browser.split(" ")
      );

    const target = BROWSERSLIST_ESBUILD_NAMES[name];

    if (target) {
      const [version] = /** @type {[string, ...string[]]} */ (
        versionRange.split("-")
      );

      targets.set(target, version);
    }
  }

  return Array.from(targets, ([name, version]) => name + version);
}
