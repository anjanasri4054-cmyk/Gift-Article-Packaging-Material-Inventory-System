const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getAllOrders,
  getOrderById,
  createOrder,
  patchOrderStatus,
  deleteOrder,
  updateOrder
} = require('../controllers/orderController');

// All routes protected by authMiddleware
router.use(authMiddleware);

router.get('/', getAllOrders);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);
router.patch('/:id/status', patchOrderStatus);

module.exports = router;
