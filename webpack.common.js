const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const SpritezeroWebpackPlugin = require('spritezero-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack')

module.exports = {
  entry: './src/index.js',
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
    noParse: /(mapbox-gl)\.js$/,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html',
    }),
    new SpritezeroWebpackPlugin({
      source: 'sprites/*.svg'
    }),
    new CopyPlugin({
      patterns: [{ from: "sprites", to: "style/sprites" }]
    }),
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery"
    })
  ],
};
