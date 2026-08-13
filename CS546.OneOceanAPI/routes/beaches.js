import { Router } from 'express';
import beachData from '../data/beaches.js';

const router = Router();

// ==========================================
// 1. GET /beaches (List + Search & Filter)
// ==========================================
router.get('/', async (req, res) => {
  try {
    let allBeaches = await beachData.getAllBeaches();

    const { search, county, city, status, minLength, maxLength } = req.query;

    // Search query matching across name, county, or city
    if (search && search.trim().length > 0) {
      const query = search.trim().toLowerCase();
      allBeaches = allBeaches.filter(
        (beach) =>
          beach.beachName.toLowerCase().includes(query) ||
          beach.county.toLowerCase().includes(query) ||
          beach.city.toLowerCase().includes(query)
      );
    }

    //direct filter by County
    if (county && county.trim().length > 0) {
      const countyQuery = county.trim().toLowerCase();
      allBeaches = allBeaches.filter((b) =>
        b.county.toLowerCase().includes(countyQuery)
      );
    }

    //direct filter by City
    if (city && city.trim().length > 0) {
      const cityQuery = city.trim().toLowerCase();
      allBeaches = allBeaches.filter((b) =>
        b.city.toLowerCase().includes(cityQuery)
      );
    }

    //direct filter by Status ('Active', 'Closed', 'Unknown')
    if (status && status.trim().length > 0) {
      const statusQuery = status.trim().toLowerCase();
      allBeaches = allBeaches.filter(
        (b) => b.status.toLowerCase() === statusQuery
      );
    }

    //filter by Length Range
    if (minLength && !isNaN(+minLength)) {
      allBeaches = allBeaches.filter((b) => b.beachLength >= parseFloat(minLength));
    }
    if (maxLength && !isNaN(+maxLength)) {
      allBeaches = allBeaches.filter((b) => b.beachLength <= parseFloat(maxLength));
    }

    //render the beaches index page with our filtered list
    return res.render('beaches/index', {
      title: 'Explore Beaches',
      beaches: allBeaches,
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

    //refresh the single beach detail page
    return res.redirect(`/beaches/${beachId}`);
  } catch (e) {
    return res.status(400).render('error', { error: 'Could not post comment.' });
  }
});

export default router;