import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { getProfile } from '../services/profileService.js';

// @desc    Get role-specific profile for logged-in user
// @route   GET /api/profile/me
// @access  Private (all roles)
export const getMyProfile = asyncHandler(async (req, res) => {
  const data = await getProfile(req.user);
  sendSuccess(res, data);
});
