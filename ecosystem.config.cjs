module.exports = {
  apps: [
    {
      name: 'mix-bitch',
      script: 'server.cjs',
      cwd: __dirname,
      env: { NODE_ENV: 'production', PORT: 1233 },
      instances: 1,
      autorestart: true,
      watch: false,
    },
  ],
}
