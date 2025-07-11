// PM2 Log Behavior:
// - Logs are appended by default and not cleared on restart
// - Log rotation is enabled (max_size: "10M", max_files: 10)
// - All modes write to the same combined log file (admin.log)
// - Both stdout and stderr are merged into a single log file
// - PM2 also maintains process-specific log files with the process name prefix
//
// Process Management:
// - Only one mode should run at a time (admin, admin-watch, or admin-debug)
// - All modes use the same HTTP port (3000)
// - Each script stops any existing processes before starting
module.exports = {
  apps: [
    {
      name: "admin",
      script: "node",
      args: "server.js",
      watch: false,
      ignore_watch: ["node_modules", "logs", ".next"],
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "logs/admin.log",
      out_file: "logs/admin.log",
      merge_logs: true,
      max_size: "10M",
      max_files: 10,
    },
    {
      name: "admin-watch",
      script: "./node_modules/.bin/next",
      args: "dev",
      watch: false,
      ignore_watch: ["node_modules", "logs", ".next"],
      env: {
        NODE_ENV: "development",
        PORT: "4052",
        DOTENV_CONFIG_PATH: ".env.local",
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "logs/admin.log",
      out_file: "logs/admin.log",
      merge_logs: true,
      max_size: "10M",
      max_files: 10,
    },
    {
      name: "admin-debug",
      script: "./node_modules/.bin/next",
      args: "dev",
      node_args: "--inspect=localhost:9231",
      watch: false,
      ignore_watch: ["node_modules", "logs", ".next"],
      env: {
        NODE_ENV: "development",
        PORT: "4052",
        DOTENV_CONFIG_PATH: ".env.local",
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "logs/admin.log",
      out_file: "logs/admin.log",
      merge_logs: true,
      max_size: "10M",
      max_files: 10,
    },
  ],
};
