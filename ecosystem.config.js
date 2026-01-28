module.exports = {
  apps: [
    {
      name: 'cartier-valentine-card',
      script: 'npm',
      args: 'start',
      cwd: '/home/site/wwwroot',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M',
      error_file: '/home/site/wwwroot/logs/err.log',
      out_file: '/home/site/wwwroot/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 8080,
        NEXT_PUBLIC_LINE_LIFF_BASEURL: process.env.NEXT_PUBLIC_LINE_LIFF_BASEURL,
        NEXT_PUBLIC_LINE_CLIENT_ID: process.env.NEXT_PUBLIC_LINE_CLIENT_ID,
        NEXT_PUBLIC_LINE_REDIRECT_URI: process.env.NEXT_PUBLIC_LINE_REDIRECT_URI,
        NEXT_PUBLIC_LINE_LIFF_ID: process.env.NEXT_PUBLIC_LINE_LIFF_ID,
        NEXT_PUBLIC_SUB_URL: process.env.NEXT_PUBLIC_SUB_URL,
      },
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.next'],
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
