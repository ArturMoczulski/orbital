// PM2 Log Behavior:
// - Logs are appended by default and not cleared on restart
// - Log rotation is enabled (max_size: "10M", max_files: 10)
// - All modes write to the same combined log file (admin-gateway.log)
// - Both stdout and stderr are merged into a single log file
// - PM2 also maintains process-specific log files with the process name prefix
//
// Process Management:
// - Only one mode should run at a time (admin-gateway, admin-gateway-watch, or admin-gateway-debug)
// - All modes use the same HTTP port (4051)
// - Each script stops any existing processes before starting
module.exports = {
  apps: [
    {
      name: "orbital/admin-gateway",
      script: "nest",
      args: "start",
      watch: false,
      ignore_watch: ["node_modules", "logs"],
      env: {
        NODE_ENV: "production",
        PORT: "4051",
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "logs/admin-gateway.log",
      out_file: "logs/admin-gateway.log",
      merge_logs: true,
      max_size: "10M",
      max_files: 10,
    },
    {
      name: "orbital/admin-gateway-watch",
      script: "nest",
      args: "start --watch --preserveWatchOutput",
      watch: false,
      ignore_watch: ["node_modules", "logs"],
      node_args: "--inspect=localhost:9230",
      env: {
        NODE_ENV: "development",
        PORT: "4051",
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "logs/admin-gateway.log",
      out_file: "logs/admin-gateway.log",
      merge_logs: true,
      max_size: "10M",
      max_files: 10,
    },
    {
      name: "orbital/admin-gateway-debug",
      script: "nest",
      args: "start --watch --preserveWatchOutput",
      watch: false,
      ignore_watch: ["node_modules", "logs"],
      node_args: "--inspect-brk=localhost:9230",
      env: {
        NODE_ENV: "development",
        PORT: "4051",
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "logs/admin-gateway.log",
      out_file: "logs/admin-gateway.log",
      merge_logs: true,
      max_size: "10M",
      max_files: 10,
    },
  ],
};
