// Publica dist/ en la rama "produccion" (la que clona el servidor).
// Uso: npm run deploy  (genera el build antes de llamar a este script)
import ghpages from 'gh-pages';

ghpages.publish('dist', {
  branch: 'produccion',
  message: `Publicación del sitio — ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
  // Borra todo lo que había en la rama antes de copiar dist/, incluidos los
  // archivos que empiezan con punto (p. ej. .agents/), pero sin tocar .git
  remove: ['**', '.*', '.*/**', '!.git', '!.git/**'],
}, (err) => {
  if (err) {
    console.error('Error al publicar:', err.message || err);
    process.exit(1);
  }
  console.log('Publicado en la rama produccion.');
});
