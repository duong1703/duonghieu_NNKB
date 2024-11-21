const router = require('express').Router();
const CategoryModel = require('../models/category');
const Charset = require('../modules/charset');
const Passport = require('../modules/passport');
const {v4: uuidv4} = require('uuid');

// Redirect root to category list
router.get('/', Passport.requireAuth, (req, res) => {
    res.redirect('/admin/category/danh-sach.html');
});

// Category List
router.get('/danh-sach.html', Passport.requireAuth, async (req, res) => {
    const model = {
        data: await CategoryModel.find({isDeleted: false}).lean()
    };
    res.render('admin/category/list', model);
});

// Create Category (GET)
router.get('/them.html', Passport.requireAuth, (req, res) => {
    res.render('admin/category/create', {errors: null});
});

// Create Category (POST)
router.post('/them.html', Passport.requireAuth, async (req, res) => {
    req.checkBody('name', 'Giá Trị không được rỗng').notEmpty();
    req.checkBody('name', 'Name từ 5 đến 32 ký tự').isLength({min: 5, max: 32});
    const errors = req.validationErrors();

    if (errors) {
        return res.render('admin/category/create', {
            errors,
            response_message: null // Không có thông báo thành công khi có lỗi
        });
    }

    await CategoryModel.create({
        id: uuidv4(), // Nếu sử dụng id
        name: req.body.name,
        urlRewriteName: Charset.removeUnicode(req.body.name),
        isDeleted: false
    });

    req.flash('response_message', 'Đã Thêm Thành Công');
    res.redirect('/admin/category/them.html');
});
// Edit Category (GET)
// Route GET để hiển thị form sửa danh mục
router.get('/sua/:id.html', async (req, res) => {
    try {
        const docCategory = await CategoryModel.findOne({
            _id: req.params.id,
            isDeleted: false
        }).lean();

        // Kiểm tra xem danh mục có tồn tại không
        if (!docCategory) {
            return res.render('admin/category/edit', {
                errors: [{msg: 'Danh mục không tồn tại hoặc đã bị xóa'}],
                data: null // Truyền null nếu không tìm thấy danh mục
            });
        }

        // Nếu tìm thấy, truyền dữ liệu danh mục
        res.render('admin/category/edit', {
            data: docCategory,
            errors: null
        });
    } catch (error) {
        console.error('Error retrieving category:', error);
        res.render('admin/category/edit', {
            errors: [{msg: 'Có lỗi xảy ra khi lấy danh mục'}],
            data: null // Truyền null nếu có lỗi
        });
    }
});

// Route POST để xử lý cập nhật danh mục
router.post('/sua/:id.html', async (req, res) => {
    try {
        const docCategory = await CategoryModel.findOne({
            _id: req.params.id,
            isDeleted: false
        }).lean();

        // Kiểm tra xem danh mục có tồn tại không
        if (!docCategory) {
            return res.render('admin/category/edit', {
                errors: [{msg: 'Danh mục không tồn tại hoặc đã bị xóa'}],
                data: null // Truyền null nếu không tìm thấy danh mục
            });
        }

        // Thực hiện kiểm tra và xử lý cập nhật
        req.checkBody('name', 'Tên không được rỗng').notEmpty();
        const errors = req.validationErrors();

        if (errors) {
            return res.render('admin/category/edit', {
                errors,
                data: docCategory // Truyền lại dữ liệu để hiển thị
            });
        }

        // Thực hiện cập nhật danh mục
        await CategoryModel.updateOne({_id: docCategory._id}, {
            name: req.body.name,
            urlRewriteName: req.body.urlRewriteName // Cập nhật các trường khác nếu cần
        });

        req.flash('response_message', 'Đã cập nhật thành công');
        res.redirect('/admin/category/danh-sach.html'); // Redirect đến danh sách danh mục
    } catch (error) {
        console.error('Error updating category:', error);
        req.flash('response_message', 'Có lỗi xảy ra khi cập nhật danh mục');
        res.redirect(`/admin/category/sua/${req.params.id}.html`);
    }
});

// Delete Category
router.get('/xoa/:id', Passport.requireAuth, async (req, res) => {
    try {
        // Tìm danh mục theo ID và đảm bảo không bị xóa
        const docCategory = await CategoryModel.findOne({
            _id: req.params.id,
            isDeleted: false
        }).lean();

        // Kiểm tra nếu danh mục không tồn tại hoặc đã bị xóa
        if (!docCategory) {
            req.flash('response_message', 'Tham số đầu vào không hợp lệ');
        } else {
            // Cập nhật trạng thái isDeleted
            await CategoryModel.updateOne({_id: docCategory._id}, {isDeleted: true});
            req.flash('response_message', 'Đã xóa thành công');
        }
    } catch (error) {
        req.flash('response_message', 'Lỗi xảy ra khi xóa');
        console.error('Error deleting category:', error);
    }

    // Chuyển hướng đến danh sách danh mục
    res.redirect('/admin/category/danh-sach.html');
});

module.exports = router;
