import { Router } from 'express';
import userData from '../data/users.js';
import beachData from '../data/beaches.js';

const router = Router();

// ==========================================
// 1. GET /profile (Show current logged-in profile)
// ==========================================
router.get('/profile', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  try {
    const userId = req.session.user._id;
    const user = await userData.getUserById(userId);

    return res.render('users/profile', {
      title: 'My Profile',
      user: user
    });
  } catch (e) {
    return res.status(500).render('error', { error: 'Could not load profile.' });
  }
});

// ==========================================
// 2. GET /bookmarks (Show current user's saved beaches)
// ==========================================
router.get('/bookmarks', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  try {
    const userId = req.session.user._id;
    const user = await userData.getUserById(userId);

    const favoriteIds = user.favoriteBeaches || user.favorites || [];
    let savedBeaches = [];

    for (let i = 0; i < favoriteIds.length; i++) {
      try {
        let beach = await beachData.getBeachById(favoriteIds[i]);
        if (beach) savedBeaches.push(beach);
      } catch (err) {
        // Skip if beach no longer exists
      }
    }

    return res.render('users/bookmarks', {
      title: 'My Saved Beaches',
      beaches: savedBeaches
    });
  } catch (e) {
    return res.status(500).render('error', { error: 'Could not load bookmarks.' });
  }
});

// ==========================================
// 3. POST /bookmarks/:beachId (Add bookmark)
// ==========================================
router.post('/bookmarks/:beachId', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  try {
    const userId = req.session.user._id;
    const beachId = req.params.beachId;

    await userData.addFavoriteBeach(userId, beachId);

    return res.redirect('/bookmarks');
  } catch (e) {
    return res.status(400).render('error', { error: 'Could not add bookmark.' });
  }
});

// ==========================================
// 4. POST /bookmarks/:beachId/delete (Remove bookmark via HTML Form)
// ==========================================
router.post('/bookmarks/:beachId/delete', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  try {
    const userId = req.session.user._id;
    const beachId = req.params.beachId;

    await userData.removeFavoriteBeach(userId, beachId);

    return res.redirect('/bookmarks');
  } catch (e) {
    return res.status(400).render('error', { error: 'Could not delete bookmark.' });
  }
});

// ======================================================
// 5. GET /users/:id/favorites (List target user's favorites + Privacy)
// ======================================================
router.get('/users/:id/favorites', async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.session?.user?._id;

    const targetUser = await userData.getUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).render('error', { error: 'User not found.' });
    }

    const isOwner = currentUserId && currentUserId.toString() === targetUserId.toString();
    if (targetUser.isBookmarksPrivate && !isOwner) {
      return res.status(403).render('error', {
        error: 'This user’s bookmarked beaches are private.'
      });
    }

    const favoriteIds = targetUser.favoriteBeaches || targetUser.favorites || [];
    const favoriteBeaches = await Promise.all(
      favoriteIds.map(async (beachId) => {
        try {
          return await beachData.getBeachById(beachId);
        } catch {
          return null;
        }
      })
    );

    return res.render('users/favorites', {
      title: `${targetUser.firstName}'s Saved Beaches`,
      beaches: favoriteBeaches.filter((b) => b !== null),
      isOwner: isOwner,
      isPrivate: targetUser.isBookmarksPrivate || false,
      targetUser: targetUser
    });
  } catch (e) {
    return res.status(500).render('error', {
      error: typeof e === 'string' ? e : 'Could not retrieve favorites.'
    });
  }
});

// ======================================================
// 6. POST /users/:id/favorites (RESTful Add Favorite)
// ======================================================
router.post('/users/:id/favorites', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  const targetUserId = req.params.id;
  const currentUserId = req.session.user._id;

  if (currentUserId.toString() !== targetUserId.toString()) {
    return res.status(403).render('error', { error: 'You can only manage your own bookmarks.' });
  }

  const { beachId } = req.body;
  try {
    await userData.addFavoriteBeach(currentUserId, beachId.trim());
    return res.redirect(`/users/${currentUserId}/favorites`);
  } catch (e) {
    return res.status(400).render('error', { error: typeof e === 'string' ? e : 'Could not add favorite.' });
  }
});

// ======================================================
// 7. DELETE /users/:id/favorites/:beachId (RESTful Remove Favorite)
// ======================================================
router.delete('/users/:id/favorites/:beachId', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'You must be logged in.' });
  }

  const { id: targetUserId, beachId } = req.params;
  const currentUserId = req.session.user._id;

  if (currentUserId.toString() !== targetUserId.toString()) {
    return res.status(403).json({ error: 'You can only modify your own bookmarks.' });
  }

  try {
    await userData.removeFavoriteBeach(currentUserId, beachId);
    return res.status(200).json({ success: true, removedBeachId: beachId });
  } catch (e) {
    return res.status(400).json({ error: typeof e === 'string' ? e : 'Could not remove favorite.' });
  }
});

// ======================================================
// 8. PATCH /users/:id/favorites/visibility (Toggle Privacy)
// ======================================================
router.patch('/users/:id/favorites/visibility', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'You must be logged in.' });
  }

  const targetUserId = req.params.id;
  const currentUserId = req.session.user._id;

  if (currentUserId.toString() !== targetUserId.toString()) {
    return res.status(403).json({ error: 'You can only update your own settings.' });
  }

  try {
    const { isPrivate } = req.body;
    const updatedUser = await userData.setBookmarkVisibility(currentUserId, Boolean(isPrivate));

    return res.status(200).json({
      success: true,
      isBookmarksPrivate: updatedUser.isBookmarksPrivate
    });
  } catch (e) {
    return res.status(400).json({ error: typeof e === 'string' ? e : 'Could not update visibility.' });
  }
});

export default router;