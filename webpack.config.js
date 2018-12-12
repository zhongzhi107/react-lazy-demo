const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  devServer: {
    // contentBase: path.join(__dirname, 'dist'),
    // compress: true,
    port: 3000,
    before: (app, server) => {
      app.get('/0.js', async (req, res, next) => {
        setTimeout(function() {
          next();
        }, 3000);
      });
    }
  },
  module: {
    rules: [
      {
        test:/\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
            plugins: [
              '@babel/plugin-syntax-dynamic-import',
              '@babel/plugin-proposal-class-properties'
            ]
          }
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      title: 'React.lazy() Demo',
      template: 'src/template.html'
    })
  ]
};
