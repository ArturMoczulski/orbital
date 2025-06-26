// PM2 Log Behavior:
// - Logs are appended by default and not cleared on restart
// - Log rotation is enabled (max_size: "10M", max_files: 10)
// - All modes write to the same combined log file (phaser-maps.log)
// - Both stdout and stderr are merged into a single log file
// - PM2 also maintains process-specific log files with the process name prefix
//
// Process Management:
// - Only one mode should run at a time (phaser-maps, phaser-maps-watch, or phaser-maps-debug)
// - All modes use the same HTTP port (3000)
// - Each script stops any existing processes before starting
module.exports = {
  apps: [
    {
      name: "phaser-maps",
      script: "node",
      args: "server.js",
      watch: false,
      ignore_watch: ["node_modules", "logs", ".next"],
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "logs/phaser-maps.log",
      out_file: "logs/phaser-maps.log",
      merge_logs: true,
      max_size: "10M",
      max_files: 10,
    },
    {
      name: "phaser-maps-watch",
      script: "yarn",
      args: "run dotenv -e .env.local next dev",
      watch: false,
      ignore_watch: ["node_modules", "logs", ".next"],
      env: {
        NODE_ENV: "development",
        PORT: "3000",
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "logs/phaser-maps.log",
      out_file: "logs/phaser-maps.log",
      merge_logs: true,
      max_size: "10M",
      max_files: 10,
    },
    {
      name: "phaser-maps-debug",
      script: "yarn",
      args: "run dotenv -e .env.local next dev",
      watch: false,
      ignore_watch: ["node_modules", "logs", ".next"],
      node_args: "--inspect=localhost:9231",
      env: {
        NODE_ENV: "development",
        PORT: "3000",
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "logs/phaser-maps.log",
      out_file: "logs/phaser-maps.log",
      merge_logs: true,
      max_size: "10M",
      max_files: 10,
    },
  ],
};
