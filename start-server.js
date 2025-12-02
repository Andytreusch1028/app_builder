// Simple server starter with error handling
import('./dist/index.js').catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

