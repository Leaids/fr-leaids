import { Router } from 'express';

const router = Router();

router.get('/test', (req, res) => {
  res.json({ message: 'Auth route is working' });
});

export default router;
