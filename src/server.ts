import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

// Treat either standard Node or platform-specific production values as production.
const nodeEnvironment = process.env.NODE_ENV?.trim().toLowerCase();
const projectEnvironment = process.env.COZE_PROJECT_ENV?.trim().toLowerCase();
const dev =
  nodeEnvironment !== 'production' &&
  projectEnvironment !== 'production' &&
  projectEnvironment !== 'prod';
if (!dev) {
  const envPath = resolve(process.cwd(), '.env.production');
  if (existsSync(envPath)) {
    config({ path: envPath });
  } else {
    config(); // fallback to .env
  }
}

const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '5000', 10);

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });
  server.once('error', err => {
    console.error(err);
    process.exit(1);
  });
  server.listen(port, hostname, () => {
    console.log(
      `> Server listening at http://${hostname}:${port} as ${
        dev ? 'development' : 'production'
      }`,
    );
  });
});
