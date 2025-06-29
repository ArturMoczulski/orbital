// PM2 Log Behavior:
// - Logs are appended by default and not cleared on restart
// - Log rotation is enabled (max_size: "10M", max_files: 10)
// - All modes write to the same combined log file (world.log)
// - Both stdout and stderr are merged into a single log file
// - PM2 also maintains process-specific log files with the process name prefix
//
// Process Management:
// - Only one mode should run at a time (world, world-watch, or world-debug)
// - All modes use the same HTTP port (4053)
// - Each script stops any existing processes before starting
module.exports = {
  apps: [
    {
      name: "world",
      script: "nest",
      args: "start",
      watch: false,
      ignore_watch: ["node_modules", "logs"],
      env: {
        NODE_ENV: "production",
        PORT: "4053",
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "logs/world.log",
      out_file: "logs/world.log",
      merge_logs: true,
      max_size: "10M",
      max_files: 10,
    },
    {
      name: "world-watch",
      script: "nest",
      args: "start --watch --preserveWatchOutput",
      watch: false,
      ignore_watch: ["node_modules", "logs"],
      node_args: "--inspect=localhost:9230",
      kill_timeout: 3000,
      wait_ready: true,
      listen_timeout: 5000,
      env: {
        NODE_ENV: "development",
        PORT: "4053",
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "logs/world.log",
      out_file: "logs/world.log",
      merge_logs: true,
      max_size: "10M",
      max_files: 10,
    },
    {
      name: "world-debug",
      script: "nest",
      args: "start --preserveWatchOutput",
      watch: false,
      ignore_watch: ["node_modules", "logs"],
      node_args: "--inspect-brk=localhost:9229",
      kill_timeout: 3000,
      wait_ready: true,
      listen_timeout: 5000,
      env: {
        NODE_ENV: "development",
        PORT: "4053",
        NODE_OPTIONS: "--max-old-space-size=4096",
      },
      env: {
        NODE_ENV: "development",
        PORT: "4053",
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "logs/world.log",
      out_file: "logs/world.log",
      merge_logs: true,
      max_size: "10M",
      max_files: 10,
    },
  ],
};
