import { buildFixture, buildFixturesDiff } from "../__testutils__/CliUtils";

const FIXTURE = `
import isObject from 'isobject';
export function isAdmin(user) {
  return isObject(user?.role)
}
`;

test.concurrent("basic", async () => {
  const { main } = await buildFixture("bundle-node-basic", FIXTURE, {
    main: "dist.js",
  });

  expect(main).toMatchSnapshot();
});

test.concurrent("version", async () => {
  const diff = await buildFixturesDiff(
    "bundle-node-version",
    FIXTURE,
    { main: "dist.js", engines: { node: ">=10" } },
    { main: "dist.js", engines: { node: ">=14" } }
  );

  expect(diff).toMatchSnapshot(diff);
});
