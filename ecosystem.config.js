module.exports = {
  apps: [
    {
      name: 'cartier-valentine-card',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p ' + (process.env.PORT || 8080),
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
