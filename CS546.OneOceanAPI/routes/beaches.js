import { Router } from 'express';
import beachData from '../data/beaches.js';
import advisoryData from '../data/advisories.js';
import userData from '../data/users.js';
import beachUtils from '../utils/beach_utils.js';
import advisoryUtils from '../utils/advisory_utils.js';
import { checkId, checkString, checkNumber, errorMessage } from '../helpers.js';

const router = Router();

const LONG_BEACH_CENTER = {
  longitude: -118.149475,
  latitude: 33.7543085
};

const toMapBeach = (b) => ({
  _id: b._id,
  beachName: b.beachName,
  city: b.city,
  county: b.county,
  beachLength: b.beachLength,
  waterQuality: b.waterQuality,
  userRating: b.userRating,
  autoRating: b.autoRating,
  status: b.status,
  geoObject: b.geoObject
});

const serializeForScriptTag = (value) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/[\u2028\u2029]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));

// ==========================================
// 1. GET /beaches (List + Search & Filter)
// ==========================================
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      name,
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
      maxSize,
      proximityDistance
    } = req.query;

    const effectiveMinLength = minLength || minSize;
    const effectiveMaxLength = maxLength || maxSize;
    const filters = {
      name,
      county,
      city,
      status,
      waterQuality,
      minLength: effectiveMinLength,
      maxLength: effectiveMaxLength,
      minUserRating,
      maxUserRating,
      minAutoRating,
      maxAutoRating
    };

    if (proximityDistance && !isNaN(+proximityDistance) && +proximityDistance > 0) {
      filters.proximity = {
        longitude: LONG_BEACH_CENTER.longitude,
        latitude: LONG_BEACH_CENTER.latitude,
        distance: +proximityDistance * 1609.34
      };
    }

    let allBeaches = await beachData.getBeachesByFilter(filters);

    const currentUser = req.session && req.session.user
      ? await userData.getUserById(req.session.user._id)
      : null;
    const favoriteBeachIds = new Set(
      (currentUser?.favoriteBeaches || []).map((beachId) => beachId.toString())
    );
    allBeaches = allBeaches.map((beach) => ({
      ...beach,
      isBookmarked: favoriteBeachIds.has(beach._id.toString())
    }));

    return res.render('beaches/search', {
      title: 'Explore Beaches',
      beaches: allBeaches,
      searchQuery: search || name || county || city || proximityDistance || '',
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
    const { 
      proximityCenter,
      proximityDistance,
      city, 
      county, 
      status,
      minLength, 
      maxLength,
      minUserRating,
      maxUserRating,
      minAutoRating,
      maxAutoRating,
      activeAdvisories
    } = req.query;

    let allBeaches;
    //filter by proximity
    if (proximityCenter && proximityDistance && proximityCenter.trim().length > 0 && proximityDistance.trim().length > 0) {
      let sanatizedProximityCenter = proximityCenter.split(',')
      let sanatizedProximityDistance = parseFloat(proximityDistance) * 1609.34
      allBeaches = await beachData.getBeachesByDistance(sanatizedProximityCenter[0], sanatizedProximityCenter[1], sanatizedProximityDistance)
    }
    else {
      allBeaches = await beachData.getAllBeaches();
    }

    //filter by city
    if (city && city.trim().length > 0) {
      const queryCity = city.trim().toLowerCase();
      allBeaches = allBeaches.filter((beach) => beach.city.trim().toLowerCase() === queryCity);
    }

    //filter by county
    if (county && county.trim().length > 0) {
      const queryCounty = county.trim().toLowerCase()
      allBeaches = allBeaches.filter((beach) => beach.county.trim().toLowerCase() === queryCounty);
    }

    //filter by status
    if (status && status.trim().length > 0) {
      const queryStatus = status.trim().toLowerCase();
      allBeaches = allBeaches.filter((beach) => beach.status.trim().toLowerCase() === queryStatus);
    }

    //filter by min length
    if (minLength) {
      const queryMinLength = beachUtils.validateBeachLength(minLength)
      allBeaches = allBeaches.filter((beach) => beach.beachLength >= queryMinLength);
    }

    //filter by max length
    if (maxLength) {
      const queryMaxLength = beachUtils.validateBeachLength(maxLength)
      allBeaches = allBeaches.filter((beach) => beach.beachLength <= queryMaxLength);
    }

    //filter by min user rating
    if (minUserRating) {
      const queryMinUserRating = beachUtils.validateRating(minUserRating)
      allBeaches = allBeaches.filter((beach) => beach.userRating >= queryMinUserRating);
    }

    //filter by max user rating
    if (maxUserRating) {
      const queryMaxUserRating = beachUtils.validateRating(maxUserRating)
      allBeaches = allBeaches.filter((beach) => beach.userRating <= queryMaxUserRating);
    }

    //filter by min auto rating
    if (minAutoRating && !isNaN(+minAutoRating)) {
      const queryMinAutoRating = parseFloat(minAutoRating);
      allBeaches = allBeaches.filter((beach) => beach.autoRating !== null && beach.autoRating !== undefined && beach.autoRating >= queryMinAutoRating);
    }

    //filter by max auto rating
    if (maxAutoRating && !isNaN(+maxAutoRating)) {
      const queryMaxAutoRating = parseFloat(maxAutoRating);
      allBeaches = allBeaches.filter((beach) => beach.autoRating !== null && beach.autoRating !== undefined && beach.autoRating <= queryMaxAutoRating);
    }

    //filter by has active advisories
    if (activeAdvisories && activeAdvisories.trim().length > 0) {
      let allAdvisories = await Promise.all(allBeaches.map(async (beach) => await advisoryData.getActiveAdvisoriesByBeachId(beach._id)));
      const queryAdvisories = activeAdvisories.trim().toLowerCase();
      if (queryAdvisories === 'yes') {
        allBeaches = allBeaches.filter((beach, index) => allAdvisories[index].length > 0);
      }
      else if (queryAdvisories === 'no') {
        allBeaches = allBeaches.filter((beach, index) => allAdvisories[index].length === 0);
      }
    }

    return res.render('beaches/map', {
      title: 'View Beaches',
      beaches: serializeForScriptTag(allBeaches.map(toMapBeach)),
      filters: req.query
    });
  } catch (e) {
    console.log(e)
    return res.status(500).render('error', { error: 'Could not fetch beaches map.' });
  }
});

// ==========================================
// 2. GET /beaches/:id (Get Single Beach Page)
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const beachId = req.params.id;
    const beach = await beachData.getBeachById(beachId);
    const activeAdvisories = await advisoryData.getActiveAdvisoriesByBeachId(beachId);

    const userId = req.session && req.session.user ? req.session.user._id.toString() : null;
    const ownRating = userId && Array.isArray(beach.BeachRatings)
      ? beach.BeachRatings.find((r) => r.raterId.toString() === userId)
      : null;
    const currentUser = userId ? await userData.getUserById(userId) : null;
    const isBookmarked = Boolean(currentUser?.favoriteBeaches?.some(
      (favoriteBeachId) => favoriteBeachId.toString() === beach._id
    ));

    return res.render('beaches/detail', {
      title: beach.beachName,
      beach: beach,
      activeAdvisories: activeAdvisories,
      hasActiveAdvisories: activeAdvisories.length > 0,
      ownRating: ownRating || null,
      isBookmarked: isBookmarked
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
    const beachId = checkId(req.params.id, 'Beach ID');
    const userId = req.session.user._id;
    const commentText = checkString(req.body.comment, 'Comment');

    await beachData.addBeachComment(beachId, userId, commentText);
    return res.redirect(`/beaches/${beachId}`);
  } catch (e) {
    return res.status(400).render('error', { error: errorMessage(e, 'Could not post comment.') });
  }
});

router.post('/:id/ratings', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  try {
    const beachId = checkId(req.params.id, 'Beach ID');
    const userId = req.session.user._id;
    const rating = checkString(req.body.rating, 'Rating');
    checkNumber(rating, 'Rating', 1, 5);

    await beachData.addBeachRating(beachId, userId, rating);
    return res.redirect(`/beaches/${beachId}`);
  } catch (e) {
    return res.status(400).render('error', { error: errorMessage(e, 'Could not submit rating.') });
  }
});

router.patch('/:id/ratings', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'You must be logged in to update a rating.' });
  }

  try {
    const beachId = checkId(req.params.id, 'Beach ID');
    const userId = req.session.user._id;
    const rating = checkString(req.body.rating, 'Rating');
    checkNumber(rating, 'Rating', 1, 5);

    const updatedBeach = await beachData.patchBeachRating(beachId, userId, rating);
    return res.status(200).json({ userRating: updatedBeach.userRating, BeachRatings: updatedBeach.BeachRatings });
  } catch (e) {
    return res.status(400).json({ error: errorMessage(e, 'Could not update rating.') });
  }
});

router.delete('/:id/ratings', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'You must be logged in to remove a rating.' });
  }

  try {
    const beachId = req.params.id;
    const userId = req.session.user._id;

    const updatedBeach = await beachData.removeBeachRating(beachId, userId);
    return res.status(200).json({ userRating: updatedBeach.userRating, BeachRatings: updatedBeach.BeachRatings });
  } catch (e) {
    return res.status(400).json({ error: typeof e === 'string' ? e : 'Could not remove rating.' });
  }
});

export default router;