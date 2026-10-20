import { Router } from 'express';
import { createUser, getUserSessions } from '../controllers/user.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createUserSchema, userIdParamSchema } from '../validators/user.validator.js';

const router = Router();

router.post('/', validate(createUserSchema), createUser);
router.get('/:id/sessions', validate(userIdParamSchema), getUserSessions);

export default router;
