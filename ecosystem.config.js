module.exports = {
    "apps": [
      {
        "name": "hook_server",
        "script": "src/index.js",
        "autorestart": true,
        "watch": false,
        "instances": 2,
        "exec_mode": "cluster",
        "ignore_watch": [
          "node_modules",
          "logs"
        ],
        "time": true,
        "env": {
          "PORT": 9487,
          "NODE_ENV": "development"
        }
      }
    ]
  }