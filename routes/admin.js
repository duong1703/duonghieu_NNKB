// routes/admin.js

const router = require('express').Router();
const OrderModel = require('../models/order');
const OrderStatus = require('../constants/order-status');
const Passport = require('../modules/passport');
const ProductModel = require('../models/product');
const UserModel = require('../models/user');

// routes/admin.js

router.get('/', Passport.requireAuth, async (req, res) => {
  try {
    const data = {
      order: await OrderModel.countDocuments(),
      product: await ProductModel.countDocuments(),
      user: await UserModel.countDocuments(),
      profit: 0 // Khởi tạo giá trị profit
    };

    // Lấy danh sách đơn hàng đã thanh toán và tính tổng profit
    const paidOrders = await OrderModel.find({ status: OrderStatus.paid }).lean();

    // Tính tổng profit từ các đơn hàng đã thanh toán
    data.profit = paidOrders.reduce((total, order) => {
      const orderTotal = order.details.reduce((sum, detail) => {
        const price = detail.item.discountedPrice ? parseFloat(detail.item.discountedPrice) : parseFloat(detail.item.price);
        return sum + (price * detail.quantity);
      }, 0);
      return total + orderTotal;
    }, 0);

    res.render('admin/index', data);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    req.flash('response_message', 'Lỗi xảy ra khi lấy dữ liệu dashboard');
    res.redirect('/admin');
  }
});


// User info route
router.post('/getUser', Passport.requireAuth, (req, res) => {
  res.json(req.user);
});

module.exports = router;
