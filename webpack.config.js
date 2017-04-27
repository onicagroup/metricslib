const webpack = require('webpack');
const path = require("path");
const BabiliPlugin = require("babili-webpack-plugin");

const env = process.env.WEBPACK_ENV;

module.exports = {
  context: path.resolve(__dirname),
  entry: {
    metricslib: ['index']
  },
  target: 'node',
  output: {
    filename: env === 'build' ? '[name].min.js' : '[name].js',
    library: '[name]',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'lib'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
          options: {
            presets: [
              ['env', {
                targets: {
                  browsers: ['last 2 versions'],
                  node: 4.3
                },
                //debug: true,
                //useBuiltIns: true
              }],
              'stage-2'
            ],
            plugins: [
              'transform-runtime'
            ]
          }
        }]
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js'],
    modules: [
      path.resolve(__dirname, 'src'),
      path.join(__dirname, 'node_modules')
    ],
    alias: {
    }
  },
  devtool: "source-map",
  externals: {
    'aws-sdk': 'aws-sdk',
    'proxy-polyfill': 'proxy-polyfill'
  },
  plugins: [
  ]
};

if (env === 'build') {
  module.exports.plugins.push(new BabiliPlugin({}, {}))
}
