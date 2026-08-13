import { Router } from 'express';
import beachData from '../data/beaches.js';

const router = Router();

// ==========================================
// 1. GET /beaches (List + Search & Filter)
// ==========================================
router.get('/', async (req, res) => {
  try {
    const { search, county, city, status, waterQuality, minLength, maxLength } = req.query;

    const filteredBeaches = await beachData.getBeachesByFilter({
      search,
      county,
      city,
      status: status || waterQuality,
      minLength,
      maxLength
    });

    return res.render('beaches/index', {
      title: 'Explore Beaches',
      beaches: filteredBeaches,
      searchQuery: search || ''
    });
  } catch (e) {
    return res.status(500).render('error', { error: 'Could not fetch beaches.' });
  }
});

// ==========================================
// 2. GET /beaches/:id (Get Single Beach Page)
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const beachId = req.params.id;
    const beach = await beachData.getBeachById(beachId);

    return res.render('beaches/single', {
      title: beach.beachName,
      beach: beach
    });
  } catch (e) {
    return res.status(404).render('error', { error: 'Beach not found.' });
  }
});

// ==========================================
// 3. POST /beaches/:id/comments (Add Comment)
// ==========================================
router.post('/:id/comments', async (req, res) => {
  // Must be logged in to leave a comment
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  try {
    const beachId = req.params.id;
    const userId = req.session.user._id;
    const commentText = req.body.comment;

    await beachData.addBeachComment(beachId, userId, commentText);

    return res.redirect(`/beaches/${beachId}`);
  } catch (e) {
    return res.status(400).render('error', { error: 'Could not post comment.' });
  }
});

export default router;