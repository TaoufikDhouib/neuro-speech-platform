// Runs before every test file (pool: 'forks' → fresh process, so these land
// before any module is evaluated and Prisma client is instantiated).
process.env['DATABASE_URL'] = 'file:./test.db';
process.env['JWT_SECRET']   = 'test-secret-minimum-sixteen-chars!!';
process.env['NODE_ENV']     = 'test';
process.env['GROQ_API_KEY'] = 'test-groq-key';
process.env['PORT']         = '0';
