module.exports = {
  apps: [
    {
      name: 'se-liff-service',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p ' + (process.env.PORT || 8080),
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
