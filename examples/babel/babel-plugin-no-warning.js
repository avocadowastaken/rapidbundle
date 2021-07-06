"use strict";

const NODE_SEEN = Symbol();

/**
 * @param {import('@babel/core')} babel
 * @returns {import('@babel/core').PluginObj}
 */
module.exports = function babelPluginNoWarning(babel) {
  const buildProcessEnvWrapper = babel.template.statement(`
    process.env.NODE_ENV === 'production' ? %%warning%% : undefined 
  `);

  const buildImportMetaEnvWrapper = babel.template.statement(`
    import.meta.env.MODE === 'production' ? %%warning%% : undefined 
  `);

  return {
    visitor: {
      CallExpression(path, state) {
        if (
          !(
            !path.node[NODE_SEEN] &&
            path.get("callee").isIdentifier({ name: "warning" })
          )
        ) {
          return;
        }
        path.node[NODE_SEEN] = true;
        const buildWrapper = state.file.opts.caller.supportsProcessEnv
          ? buildProcessEnvWrapper
          : buildImportMetaEnvWrapper;

        path.replaceWith(buildWrapper({ warning: path.node }));
      },
    },
  };
};
