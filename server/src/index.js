import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  console.log(`\n🚀 ${env.appName} API 🚀`);
  console.log(`   Local: http://localhost:${env.port}`);
  console.log(`   Environment: ${env.mode}`);

  if (env.mode === 'development') {
    console.log('   ⚠️  Development mode — not for production use. ⚠️');
  }

  console.log();
});
