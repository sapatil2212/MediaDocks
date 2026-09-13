/**
 * PM2 Ecosystem Configuration for MediaDocks.
 *
 * Dedicated process configuration running the Next.js standalone server
 * on production port 3010 without interfering with any other application.
 */
module.exports = {
  apps: [
    {
      name: "mediadocks",
      script: ".next/standalone/server.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3010,
        HOSTNAME: "0.0.0.0",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3010,
        HOSTNAME: "0.0.0.0",
      },
      error_file: "logs/pm2-error.log",
      out_file: "logs/pm2-out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
