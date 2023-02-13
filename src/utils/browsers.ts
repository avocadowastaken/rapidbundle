const BROWSERSLIST_ESBUILD_NAMES = {
  chrome: "chrome",
  edge: "edge",
  firefox: "firefox",
  ios_saf: "ios",
  safari: "safari",
} as const;

export async function getESBuildBrowsers(
  input: string | string[]
): Promise<string[]> {
  const { default: browserslist } = await import("browserslist");
  const browsers = browserslist(input, { mobileToDesktop: true });

  const targets = new Map<string, string>();

  for (const browser of browsers) {
    const [name, versionRange] = browser.split(" ", 2) as [
      keyof typeof BROWSERSLIST_ESBUILD_NAMES,
      string
    ];

    const target = BROWSERSLIST_ESBUILD_NAMES[name];

    if (target) {
      const [version] = versionRange.split("-", 2) as [string, string];

      targets.set(target, version);
    }
  }

  return Array.from(targets, ([name, version]) => name + version);
}
