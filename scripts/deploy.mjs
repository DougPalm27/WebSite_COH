// Publica el build en la rama "produccion" (la que clona el servidor).
// Uso: npm run deploy  (genera el build en .deploy/ antes de llamar a este script;
// usa su propia carpeta para no chocar con dist/ si hay un "astro preview" abierto)
import ghpages from 'gh-pages';

ghpages.publish('.deploy', {
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
