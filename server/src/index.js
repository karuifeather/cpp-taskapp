import { app } from './app.js';
import { env } from './config/env.js';
import { pool } from './db/pool.js';

const server = app.listen(env.port, () => {
  console.log(`\n🚀 ${env.appName} API 🚀`);
  console.log(`   Local: http://localhost:${env.port}`);
  console.log(`   Environment: ${env.mode}`);

  if (env.mode === 'development') {
    console.log('   ⚠️  Development mode — not for production use. ⚠️');
  }

  console.log();
});

// Finish in-flight requests and close DB connections when the host stops the app.
function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
