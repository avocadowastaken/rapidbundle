import { expect } from "vitest";
import { testBundle, TestBundleOptions } from "./testBundle";
import { execCLI } from "./utils/execCLI";

export function testError(fileUrl: string, options: TestBundleOptions = {}) {
  testBundle(fileUrl, options, async () => {
    const output = await execCLI();
    expect(output).toMatchSnapshot("output");
  });
}
