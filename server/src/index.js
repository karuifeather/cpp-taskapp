import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  // if set, use the NODE_ENV from the environment variables;
  // otherwise, use the value from env.nodeEnv;
  // if neither is set, default to 'development'
  const mode = env.nodeEnv ?? process.env.NODE_ENV ?? 'development';

  console.log(`\n🚀 ${env.appName} API 🚀`);
  console.log(`   Local: http://localhost:${env.port}`);
  console.log(`   Environment: ${mode}`);

  if (mode === 'development') {
    console.log('   ⚠️  Development mode — not for production use. ⚠️');
  }

  console.log();
});
