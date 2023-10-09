module.exports = {
  module: {},
  resolve: {
    fallback: {
      fs: false,
      // "path": false, // set in https://github.com/jupyterlab/jupyterlab/blob/v4.0.0/builder/src/webpack.config.base.ts#L66
      crypto: false
    }
  }
};
