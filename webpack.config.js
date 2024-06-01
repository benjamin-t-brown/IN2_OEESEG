const path = require('path');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
  entry: './src-web/index.js',
  mode: 'development',
  devtool: 'inline-source-map',
  plugins: [
    new MonacoWebpackPlugin({
      // available options are documented at https://github.com/microsoft/monaco-editor/blob/main/webpack-plugin/README.md#options
      languages: ['javascript'],
    }),
  ],
  resolve: {
    extensions: ['*', '.js', '.jsx'],
    modules: [path.resolve(__dirname, 'src-web'), 'node_modules'],
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
  devServer: {
    port: 8898,
    contentBase: path.join(__dirname, 'public'),
    compress: true,
    hot: true,
    liveReload: true,
    open: true,
    openPage: 'index.dev.html',
    proxy: {
      '/compile': 'http://localhost:8899',
      '/file': 'http://localhost:8899',
      '/images': 'http://localhost:8899',
      '/standalone': 'http://localhost:8899',
      '/res': 'http://localhost:8899',
      '/export': 'http://localhost:8899',
      '/format': 'http://localhost:8899',
      '/voice': 'http://localhost:8899',
      '/open': 'http://localhost:8899',
      '/assets': 'http://localhost:8899',
      '/find-node': 'http://localhost:8899',
      '/rename-file-contents': 'http://localhost:8899',
    },
  },
};
