/**
 * @param {import('@babel/core').ConfigAPI} api
 * @returns {import('@babel/core').TransformOptions}
 */
module.exports = function babelPresetTest(api) {
  const isTest = api.env("test");
  api.cache.using(() => isTest);
  return { plugins: ["../babel/babel-plugin-no-warning.js"] };
};
