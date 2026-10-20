import { Router } from 'express';
import {
  createSession,
  getAvailableSessions,
  bookSession,
  completeSession,
} from '../controllers/session.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createSessionSchema,
  availableSessionsQuerySchema,
  bookSessionSchema,
  sessionIdParamSchema,
} from '../validators/session.validator.js';

const router = Router();

router.post('/', validate(createSessionSchema), createSession);
router.get('/available', validate(availableSessionsQuerySchema), getAvailableSessions);
router.post('/:id/book', validate(bookSessionSchema), bookSession);
router.patch('/:id/complete', validate(sessionIdParamSchema), completeSession);

export default router;
