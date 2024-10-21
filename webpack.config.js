

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');


module.exports = {
  entry: {
    mintbot: './public/js/mintbot.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
  },
  resolve: {
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      zlib: require.resolve("browserify-zlib"),
      url: require.resolve("url/"),
      buffer: require.resolve('buffer/'),
      vm: require.resolve("vm-browserify"),
      path: require.resolve("path-browserify"),
      os: require.resolve("os-browserify/browser")
    },
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/mintbot.html',
      filename: 'mintbot.html',
      chunks: ['mintbot'], 
    }),
  ],
  devServer: {
    contentBase: path.join(__dirname, 'public'),
    compress: true,
    port: 15000,
  },
};

