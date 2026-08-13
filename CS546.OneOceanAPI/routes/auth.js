import { Router } from 'express';
import usersData from '../data/users.js';

const router = Router();

// ==========================================
// 1. GET /signup (Show Signup Form)
// ==========================================
router.get('/signup', (req, res) => {
  //if already logged in, send to homepage
  if (req.session && req.session.user) {
    return res.redirect('/');
  }
  return res.render('signup', { title: 'Sign Up' });
});

// ==========================================
// 2. GET /login (Show Login Form)
// ==========================================
router.get('/login', (req, res) => {
  //if already logged in, send to homepage
  if (req.session && req.session.user) {
    return res.redirect('/');
  }
  return res.render('login', { title: 'Log In' });
});

// ==========================================
// 3. POST /signup (Handle Signup Form)
// ==========================================
router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, gender, city, state, age, password } = req.body;

  try {
    const parsedAge = parseInt(age, 10);
    const newUser = await usersData.createUser(
      firstName,
      lastName,
      email,
      gender,
      city,
      state,
      parsedAge,
      password
    );

    req.session.user = {
      _id: newUser._id.toString(),
      email: newUser.email,
      firstName: newUser.firstName
    };

    return res.redirect('/');
  } catch (e) {
    return res.status(400).render('signup', {
      title: 'Sign Up',
      error: typeof e === 'string' ? e : 'Could not create user',
      hasErrors: true,
      userInputs: req.body
    });
  }
});

// ==========================================
// 4. POST /login (Handle Login Form)
// ==========================================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await usersData.checkLogin(email, password);
    req.session.user = {
      _id: user._id.toString(),
      email: user.email,
      firstName: user.firstName
    };

    return res.redirect('/');
  } catch (e) {
    return res.status(400).render('login', {
      title: 'Log In',
      error: 'Invalid email or password.',
      hasErrors: true,
      email: email
    });
  }
});

// ==========================================
// 5. GET /logout (Handle Logout)
// ==========================================
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).render('error', { error: 'Could not log out.' });
    }
    return res.redirect('/login');
  });
});

export default router;