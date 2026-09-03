import { startStaticServer } from './static-server.mjs';

const server = await startStaticServer({ port: Number(process.env.PORT || 4173) });
console.log(`ABC Tutoring is available at ${server.url}`);

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
