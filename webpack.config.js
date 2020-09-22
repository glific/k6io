const path = require('path');

module.exports = {
  mode: 'development',
  context: path.join(__dirname, 'src'),
  entry: {
      tag: './tag.ts',
      message: './message.ts',
      flow_help: './flows/help.ts',
      flow_new_contact: './flows/new_contact.ts',
      flow_test_wrong_input: './flows/test_wrong_input.ts',
      flow_test_other_flow_keywords: './flows/test_other_flow_keywords.ts',
      flow_test_all: './flows/test_all.ts',
      flow_test_any: './flows/test_any.ts'
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
