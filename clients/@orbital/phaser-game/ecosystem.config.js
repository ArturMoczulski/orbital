// PM2 Log Behavior:
// - Logs are appended by default and not cleared on restart
// - Log rotation is enabled (max_size: "10M", max_files: 10)
// - All modes write to the same combined log file (phaser-game.log)
// - Both stdout and stderr are merged into a single log file
// - PM2 also maintains process-specific log files with the process name prefix
//
// Process Management:
// - Only one mode should run at a time (phaser-game, phaser-game-watch, or phaser-game-debug)
// - All modes use the same HTTP port (3001)
// - Each script stops any existing processes before starting
module.exports = {
  apps: [
    {
      name: "phaser-game",
      script: "node",
      args: "server.js",
      watch: false,
      ignore_watch: ["node_modules", "logs", ".next"],
      env: {
        NODE_ENV: "production",
        PORT: "3001",
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "logs/phaser-game.log",
      out_file: "logs/phaser-game.log",
      merge_logs: true,
      max_size: "10M",
      max_files: 10,
    },
    {
      name: "phaser-game-watch",
      script: "yarn",
      args: "run dotenv -e .env.local next dev",
      watch: false,
      ignore_watch: ["node_modules", "logs", ".next"],
      env: {
        NODE_ENV: "development",
        PORT: "3001",
        NEXT_TELEMETRY_DISABLED: "1",
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "logs/phaser-game.log",
      out_file: "logs/phaser-game.log",
      merge_logs: true,
      max_size: "10M",
      max_files: 10,
    },
    {
      name: "phaser-game-debug",
      script: "yarn",
      args: "run dotenv -e .env.local next dev",
      watch: false,
      ignore_watch: ["node_modules", "logs", ".next"],
      node_args: "--inspect=localhost:9232",
      env: {
        NODE_ENV: "development",
        PORT: "3001",
        NEXT_TELEMETRY_DISABLED: "1",
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "logs/phaser-game.log",
      out_file: "logs/phaser-game.log",
      merge_logs: true,
      max_size: "10M",
      max_files: 10,
    },
  ],
};
