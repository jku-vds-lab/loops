console.log('➡️  loading custom webpack config ');

module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    fallback: {
      fs: false,
      // "path": false, // set in https://github.com/jupyterlab/jupyterlab/blob/v4.0.0/builder/src/webpack.config.base.ts#L66
      crypto: false
    }
  },
  ignoreWarnings: [
    // some modules dont seem to have source maps, but I don't need them anyway
    // exclude rule above seems to have no effect
    /Failed to parse source map/,
    // tabletojson version not found in the nested package.json. But it has a version in the top-level package.json
    /No version specified and unable to automatically determine one/
  ]
};
