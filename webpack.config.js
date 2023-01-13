module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        use: [
          {
            loader: 'source-map-loader',
            options: {
              filterSourceMappingUrl: (url, resourcePath) => {
                if (!resourcePath.includes('node_modules')) {
                  console.log('filterSourceMappingUrl', url, resourcePath);
                  return true; //'consume' the source map
                }
                return false;
              }
            }
          }
        ]
      }
    ]
  }
};
