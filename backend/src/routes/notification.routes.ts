import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', requireAuth, NotificationController.getNotifications);
router.post('/:id/accept', requireAuth, NotificationController.acceptInvite);
router.post('/:id/decline', requireAuth, NotificationController.declineInvite);
router.patch('/mark-read', requireAuth, NotificationController.markAllAsRead);

export default router;
