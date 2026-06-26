module.exports = {
  apps: [{
    name: 'zaneco-api',
    script: 'server.js',
    cwd: __dirname,
    instances: process.env.NODE_ENV === 'production' ? 2 : 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 8000,
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8000,
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: process.env.PM2_ERROR_LOG || '/tmp/zaneco-pm2-error.log',
    out_file: process.env.PM2_OUT_LOG || '/tmp/zaneco-pm2-out.log',
    merge_logs: true,
    max_memory_restart: '500M',
    restart_delay: 3000,
    max_restarts: 10,
  }],
}
