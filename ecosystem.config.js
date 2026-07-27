module.exports = {
  apps: [
    {
      name: 'eccp-web',
      cwd: '/opt/eccp',
      script: 'dist/server.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        COZE_PROJECT_ENV: 'production',
        PORT: '5000',
        HOSTNAME: 'localhost',
      },
      // Restart if memory exceeds 512 MB
      max_memory_restart: '512M',
      // Restart on crash (max 5 restarts within 10s, then pause)
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 3000,
      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Graceful shutdown
      kill_timeout: 10000,
      wait_ready: false,
      // Auto-restart on file change (disable in production)
      watch: false,
      autorestart: true,
    },
  ],
};
