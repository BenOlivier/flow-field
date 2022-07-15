module.exports = {
  'env': {
    'browser': true,
    'es2021': true,
  },
  'extends': [
    'google',
  ],
  'parserOptions': {
    'ecmaVersion': 'latest',
    'sourceType': 'module',
  },
  'rules': {
    'indent': 'off',
    'brace-style': ['error', 'allman', { 'allowSingleLine': true }],
    'require-jsdoc': 'off',
    'max-len': ['error', {'code': 100}],
    'object-curly-spacing': 'off',
    'block-spacing': ['error', 'always'],
  },
};
