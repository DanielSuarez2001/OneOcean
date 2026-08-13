import authRoutes from './auth.js';
import beachesRoutes from './beaches.js';
import communityRoutes from './community.js';
import usersRoutes from './users.js';

const constructorMethod = (app) => {
  app.get('/', (req, res) => {
    res.render('home', { title: 'One Ocean' });
  });

  app.use('/', authRoutes);
  app.use('/', usersRoutes);
  app.use('/beaches', beachesRoutes);
  app.use('/community', communityRoutes);

  app.use('/{*splat}', (req, res) => {
    res.status(404).render('error', { error: 'Page Not Found' });
  });
};

export default constructorMethod;