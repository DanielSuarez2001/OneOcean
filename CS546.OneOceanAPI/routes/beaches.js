import { Router } from 'express';
import beachData from '../data/beaches.js';

const router = Router();

// ==========================================
// 1. GET /beaches (List + Search & Filter)
// ==========================================
router.get('/', async (req, res) => {
  try {
    let allBeaches = await beachData.getAllBeaches();

    const { 
      search, 
      county, 
      city, 
      status, 
      minLength, 
      maxLength,
      waterQuality,
      minUserRating,
      maxUserRating,
      minAutoRating,
      maxAutoRating,
      minSize,
      maxSize
    } = req.query;

    if (search && search.trim().length > 0) {
      const query = search.trim().toLowerCase();
      allBeaches = allBeaches.filter(
        (beach) =>
          (beach.beachName && beach.beachName.toLowerCase().includes(query)) ||
          (beach.county && beach.county.toLowerCase().includes(query)) ||
          (beach.city && beach.city.toLowerCase().includes(query))
      );
    }

    if (county && county.trim().length > 0) {
      const countyQuery = county.trim().toLowerCase();
      allBeaches = allBeaches.filter((b) =>
        b.county && b.county.toLowerCase().includes(countyQuery)
      );
    }

    if (city && city.trim().length > 0) {
      const cityQuery = city.trim().toLowerCase();
      allBeaches = allBeaches.filter((b) =>
        b.city && b.city.toLowerCase().includes(cityQuery)
      );
    }

    if (status && status.trim().length > 0) {
      const statusQuery = status.trim().toLowerCase();
      allBeaches = allBeaches.filter(
        (b) => b.status && b.status.toLowerCase() === statusQuery
      );
    }

    if (waterQuality && waterQuality.trim().length > 0) {
      const wqQuery = waterQuality.trim().toLowerCase();
      allBeaches = allBeaches.filter((b) => 
        b.waterQuality !== null && b.waterQuality !== undefined &&
        b.waterQuality.toString().toLowerCase() === wqQuery
      );
    }

    const effectiveMinLength = minLength || minSize;
    if (effectiveMinLength && !isNaN(+effectiveMinLength)) {
      allBeaches = allBeaches.filter((b) => b.beachLength >= parseFloat(effectiveMinLength));
    }

    const effectiveMaxLength = maxLength || maxSize;
    if (effectiveMaxLength && !isNaN(+effectiveMaxLength)) {
      allBeaches = allBeaches.filter((b) => b.beachLength <= parseFloat(effectiveMaxLength));
    }

    if (minUserRating && !isNaN(+minUserRating)) {
      allBeaches = allBeaches.filter((b) => b.userRating !== null && b.userRating !== undefined && b.userRating >= parseFloat(minUserRating));
    }
    if (maxUserRating && !isNaN(+maxUserRating)) {
      allBeaches = allBeaches.filter((b) => b.userRating !== null && b.userRating !== undefined && b.userRating <= parseFloat(maxUserRating));
    }

    if (minAutoRating && !isNaN(+minAutoRating)) {
      allBeaches = allBeaches.filter((b) => b.autoRating !== null && b.autoRating !== undefined && b.autoRating >= parseFloat(minAutoRating));
    }
    if (maxAutoRating && !isNaN(+maxAutoRating)) {
      allBeaches = allBeaches.filter((b) => b.autoRating !== null && b.autoRating !== undefined && b.autoRating <= parseFloat(maxAutoRating));
    }

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
// 2. GET /beaches/map (Get Mapped Beaches Page)
// ==========================================
router.get('/map', async (req, res) => {
  try {
    let allBeaches = await beachData.getAllBeaches();

    return res.render('beaches/map', {
      title: 'View Beaches',
      beaches: JSON.stringify(allBeaches)
    });
  } catch (e) {
    return res.status(404).json(e);
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