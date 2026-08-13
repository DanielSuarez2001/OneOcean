import authRoutes from './auth.js';
import beachesRoutes from './beaches.js';
import communityRoutes from './community.js';
import usersRoutes from './users.js';

const constructorMethod = (app) => {
  // Home Page
  app.get('/', (req, res) => {
    res.render('home', { title: 'One Ocean' });
  });

  // Attach Routers
  app.use('/', authRoutes);
  app.use('/', usersRoutes);
  app.use('/beaches', beachesRoutes);
  app.use('/community', communityRoutes);

  // Catch-all 404 handler for unknown routes (Express v5 syntax)
  app.use('/{*splat}', (req, res) => {
    res.status(404).render('error', { error: 'Page Not Found' });
  });
};

export default constructorMethod;