const CracoLessPlugin = require("craco-less");
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: { "@primary-color": "#2abdd2" },
            javascriptEnabled: true,
          },
        },
      },
    },
    {
      plugin: HtmlWebpackPlugin,
      options: {
        template: path.join(__dirname, "public", "index.html"),
        favicon: path.join(__dirname, "public", "logo.ico")
      },
    },
    
  ],
  babel: {
    test: /\.(js|ts|tsx)?$/,
    exclude: /node_modules/,
    presets: ['@babel/preset-env', ['@babel/preset-react', {"runtime": "automatic"}], '@babel/preset-typescript'],
  },
  webpack: {
 
    configure: (webpackConfig, { paths }) => {
      webpackConfig.entry = [path.join(__dirname, "src", "index.tsx"), path.join(__dirname, "node_modules", "three") ];
      //webpackConfig.mode = "production"; THIS BREAKS EVERYTHING

      webpackConfig.output = { path:path.resolve(__dirname, "build")};
      
      webpackConfig.resolve.extensions.push('.tsx', '.ts', '.js','.jsx');
      webpackConfig.resolve.modules.push('node_modules');

      //console.log(webpackConfig);
     return webpackConfig;
    },
  }
};
