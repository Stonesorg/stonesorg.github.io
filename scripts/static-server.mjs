import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, normalize, resolve } from 'node:path';

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
};

export async function startStaticServer({ root = process.cwd(), port = 0 } = {}) {
  const resolvedRoot = resolve(root);
  const server = createServer(async (request, response) => {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
    const filePath = normalize(resolve(resolvedRoot, `.${pathname}`));

    if (!filePath.startsWith(`${resolvedRoot}/`) && filePath !== resolvedRoot) {
      response.writeHead(403).end('Forbidden');
      return;
    }

    try {
      const file = await stat(filePath);
      if (!file.isFile()) throw new Error('Not a file');
      response.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream' });
      createReadStream(filePath).pipe(response);
    } catch {
      response.writeHead(404).end('Not found');
    }
  });

  await new Promise((resolveListening, rejectListening) => {
    server.once('error', rejectListening);
    server.listen(port, '127.0.0.1', resolveListening);
  });

  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Could not determine local server address.');

  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolveClose, rejectClose) => server.close((error) => (error ? rejectClose(error) : resolveClose()))),
  };
}
