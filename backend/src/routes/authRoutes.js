import express from 'express';
import { body } from 'express-validator';
import {
  register, login, refresh, logout, getProfile, updateProfile,
  changePassword, forgotPassword, resetPassword, deleteAccount,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Same email normalisation everywhere, so register/login/forgot always agree
const email = () => body('email').trim().isEmail().withMessage('Please enter a valid email').normalizeEmail();
const strongPassword = (field) => body(field)
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain an uppercase letter, a lowercase letter and a number');

router.post('/register', [
  email(),
  strongPassword('password'),
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
], validate, register);

router.post('/login', [
  email(),
  body('password').notEmpty().withMessage('Password is required'),
  body('rememberMe').optional().isBoolean(),
], validate, login);

router.post('/refresh', refresh);
router.post('/logout', logout);

router.post('/forgot-password', [email()], validate, forgotPassword);
router.post('/reset-password/:token', [strongPassword('password')], validate, resetPassword);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
], validate, updateProfile);
router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  strongPassword('newPassword'),
], validate, changePassword);
router.delete('/account', protect, [
  body('password').notEmpty().withMessage('Password is required to delete your account'),
], validate, deleteAccount);

export default router;
