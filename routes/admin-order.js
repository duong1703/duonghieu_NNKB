const router = require('express').Router();
const OrderModel = require('../models/order');
const OrderStatus = require('../constants/order-status');
const Passport = require('../modules/passport');
const moment = require('moment');

// Redirect to order list
router.get('/', Passport.requireAuth, (req, res) => res.redirect('/admin/order/danh-sach.html'));


router.get('/danh-sach.html', Passport.requireAuth, async (req, res) => {
    try {
        const orders = await OrderModel.find({ isDeleted: false }).lean();

        const ordersWithTotal = orders.map(order => {
            const totalPrice = order.details.reduce((total, detail) => {
                const price = detail.item.discountedPrice ? parseFloat(detail.item.discountedPrice) : parseFloat(detail.item.price);
                return total + (price * detail.quantity);
            }, 0);
            return { ...order, total: totalPrice };
        });

        const totalProfit = ordersWithTotal
            .filter(order => order.status === OrderStatus.paid)
            .reduce((total, order) => total + (order.total || 0), 0);

        // Lưu tổng doanh thu vào session
        req.session.totalProfit = totalProfit;

        res.render('admin/order/list', {
            data: ordersWithTotal,
            totalProfit,
            moment,
            response_message: req.flash('response_message')
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        req.flash('response_message', 'Lỗi xảy ra khi lấy danh sách đơn hàng');
        res.redirect('/admin/order/danh-sach.html');
    }  
});

// Route chi tiết đơn hàng
router.get('/chi-tiet/:id.html', Passport.requireAuth, async (req, res) => {
    try {
        const order = await OrderModel.findOne({_id: req.params.id, isDeleted: false}).lean();
        if (!order) {
            req.flash('response_message', 'Đơn hàng không tồn tại');
            return res.redirect('/admin/order/danh-sach.html');
        }

        // Tính tổng giá trị với giá đã giảm
        const totalPrice = order.details.reduce((total, detail) => {
            const price = detail.item.discountedPrice ? parseFloat(detail.item.discountedPrice) : parseFloat(detail.item.price);
            return total + (price * detail.quantity);
        }, 0);

        // Gán giá đã giảm cho từng detail
        order.details = order.details.map(detail => {
            const price = detail.item.discountedPrice ? parseFloat(detail.item.discountedPrice) : parseFloat(detail.item.price);
            return {
                ...detail,
                total: price * detail.quantity // Tính tổng cho từng chi tiết
            };
        });

        res.render('admin/order/detail', {order, totalPrice, moment});
    } catch (error) {
        console.error('Error fetching order detail:', error);
        req.flash('response_message', 'Lỗi xảy ra khi lấy thông tin đơn hàng');
        res.redirect('/admin/order/danh-sach.html');
    }
});

// Update payment status
router.get('/thanh-toan/:id', Passport.requireAuth, async (req, res) => {
    try {
        const order = await OrderModel.findOne({
            _id: req.params.id,
            isDeleted: false,
            status: OrderStatus.submit
        }).lean();

        if (!order) {
            req.flash('response_message', 'Tham số đầu vào không hợp lệ');
        } else {
            await OrderModel.updateOne({_id: req.params.id}, {status: OrderStatus.paid});
            req.flash('response_message', 'Cập nhật thành công');
        }
    } catch (error) {
        console.error('Error updating payment status:', error);
        req.flash('response_message', 'Lỗi xảy ra khi cập nhật trạng thái thanh toán');
    }
    res.redirect(`/admin/order/chi-tiet/${req.params.id}.html`);
});

// Delete order
router.get('/xoa/:id', Passport.requireAuth, async (req, res) => {
    try {
        // Tìm đơn hàng không bị đánh dấu là đã xóa
        const order = await OrderModel.deleteOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!order) {
            // Nếu không tìm thấy đơn hàng, thêm thông báo và chuyển hướng
            req.flash('response_message', {type: 'error', message: 'Đơn hàng không tồn tại hoặc đã bị xóa'});
        } else {
            // Đánh dấu đơn hàng là đã xóa
            await OrderModel.updateOne({_id: req.params.id}, {isDeleted: true});
            req.flash('response_message', {type: 'success', message: 'Đơn hàng đã được xóa thành công'});
        }
    } catch (error) {
        // Xử lý lỗi và thêm thông báo lỗi
        req.flash('response_message', {type: 'error', message: 'Lỗi xảy ra khi xóa đơn hàng'});
        console.error('Error deleting order:', error);
    }

    // Chuyển hướng về trang danh sách đơn hàng
    res.redirect('/admin/order/danh-sach.html');
});

// Search orders by phone number
router.get('/search.html', Passport.requireAuth, async (req, res) => {
    const {phone} = req.query;
    let orders = [];

    if (phone) {
        try {
            orders = await OrderModel.find({isDeleted: false, phone}).lean();
        } catch (error) {
            console.error('Error searching orders:', error);
            req.flash('response_message', 'Lỗi xảy ra khi tìm kiếm đơn hàng');
        }
    }

    res.render('admin/order/list', {data: orders, moment, response_message: req.flash('response_message')});
});

module.exports = router;
