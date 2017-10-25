const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: [
    'bootstrap-webpack/bootstrap.config.js',
    './app/javascripts/viewcontroller.js'
  ],
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'loople.js'
  },
  plugins: [
    // Copy our app's index.html to the build folder.
    new CopyWebpackPlugin([
      {
        from: './app/index.html',
        to: "index.html"
      }
    ]),
    new webpack.ProvidePlugin({
        jQuery: 'jquery',
        $: 'jquery',
        jquery: 'jquery'
    })
  ],
  module: {
    rules: [
      {
       test: /\.css$/,
       use: [ 'style-loader', 'css-loader' ]
     },
     {
       test: /bootstrap\/js\//, use: [{

          loader : "imports-loader",
          options : {
             jQuery : "jquery"
          }
        }]
     },
     {
       test: /\.(woff|woff2)$/, use: [{

          loader : "url-loader",
           options : {
              limit : 10000,
              mimetype : "application/font-woff"
           }
        }]
      },
     { test: /\.ttf$/, use: [{

        loader : "url-loader",
           options : {
              limit : 10000,
              mimetype : "application/octet-stream"
           }
         }]
     },
     { test: /\.eot$/, use: [{

        loader : "file-loader",
           options : {

           }
         }]
     },
     { test: /\.svg$/, use: [{

        loader : "url-loader",
           options : {
              limit : 10000,
              mimetype : "image/svg+xml"
           }
         }]
     },
     { test: /\.json$/, use: [
          {
            loader : 'json-loader'
          }
        ]
      },
     {
       test: /\.jsx$/,
       exclude: /(node_modules|bower_components)/,
       use : {
         loader: 'babel-loader',
         options: {
           presets: ['es2015', 'env']
         }
       }
     }],
    loaders: []
  }
}
