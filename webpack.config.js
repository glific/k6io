const path = require('path');

module.exports = {
  mode: 'development',
  context: path.join(__dirname, 'src'),
  entry: {
      tag: './tag.ts',
      message: './message.ts',
      flow: './flow.ts',
      flow_new_contact: './flow_new_contact.ts'
  },
  output: {
    path: path.join(__dirname, 'dist'),
    libraryTarget: 'commonjs',
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'babel-loader',
      },
    ],
  },
  target: 'web',
  externals: /k6(\/.*)?/,
  stats: {
    colors: true,
  },
};
