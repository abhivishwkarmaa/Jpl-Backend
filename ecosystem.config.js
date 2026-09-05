require('dotenv').config();

module.exports = {
  apps: [
    {
      name: 'jpl-backend',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: process.env.PORT,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT,
      },
      error_file: './logs/pm2-err.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
    },
  ],
};
