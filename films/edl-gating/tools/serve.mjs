import { serve, options, number } from './runtime.mjs';
try {
  const a = options({ port: 'value', help: 'flag' });
  if (a.help) { console.log('Usage: node tools/serve.mjs [--port 8765]'); process.exit(0); }
  const server = await serve(number(a.port ?? 8765, 'port', { min: 0, max: 65535, integer: true }));
  console.log(`${server.url}/src/index.html (static scene; use render.mjs for film frames)`);
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { await server.close(); process.exit(0); });
} catch (error) { console.error(error.message); process.exitCode = 1; }
