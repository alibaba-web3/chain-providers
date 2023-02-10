module.exports = {
  apps: [
    {
      name: 'chain-providers (production)',
      script: './dist/src/main.js',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'chain-providers (test)',
      script: './dist/src/main.js',
      env: {
        NODE_ENV: 'test',
      },
    },
  ],
};
