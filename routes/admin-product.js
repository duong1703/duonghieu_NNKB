const router = require('express').Router();

const multer = require('multer');

const upload = multer(
    {
        storage: multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, './public/upload');
            },
            filename: function (req, file, cb) {
                cb(null, `${Date.now()}_${file.originalname}`);
            }
        })
    }
);

const CategoryModel = require('../models/category');
const Charset = require('../modules/charset');
const Passport = require('../modules/passport');
const ProductModel = require('../models/product');

router.get('/', Passport.requireAuth, (req, res) => {
    res.redirect('/admin/product/danh-sach.html');
});

router.get('/danh-sach.html', Passport.requireAuth, async (req, res) => {
    const model = {};

    model.data = await ProductModel.find(
        {
            isDeleted: false
        }
    ).lean();

    res.render('admin/product/list', model);
});

router.get('/them.html', Passport.requireAuth, async (req, res) => {
    const model = {
        errors: null
    };

    model.category = await CategoryModel.find(
        {
            isDeleted: false
        }
    ).lean();

    res.render('admin/product/create', model);
});

router.post('/them.html', Passport.requireAuth, upload.single('hinh'), async (req, res) => {
    const lstCategory = await CategoryModel.find(
        {
            isDeleted: false
        }
    ).lean();

    req.checkBody('name', 'Tên không được rỗng').notEmpty();

    //req.checkBody('hinh', 'Hình không được rỗng').notEmpty();

    req.checkBody('price', 'Giá phải là số').isInt();
    //req.checkBody('SL', 'số lượng phải là số').isInt();

    req.checkBody('description', 'Chi tiết không được rỗng').notEmpty();

    const errors = req.validationErrors();

    if (errors) {
        const model = {
            errors,
            category: lstCategory
        };

        return res.render('admin/product/create', model);
    }

    const createData = {
        name: req.body.name,
        urlRewriteName: Charset.removeUnicode(req.body.name),
        categoryId: req.body.categoryId,
        description: req.body.description,
        price: req.body.price,
        sale: req.body.sale,
        sale1: req.body.sale1,
        isDeleted: false
    };

    createData.salePrice = createData.price - (createData.sale * createData.price) / 100;

    createData.urlRewriteName = Charset.removeUnicode(req.body.name);

    if (req.file && req.file.filename) {
        createData.photo = req.file.filename;
    }

    await ProductModel.create(createData);

    req.flash('response_message', 'Đã Thêm Thành Công');

    res.redirect('/admin/product/them.html');
});

router.get('/sua/:id.html', Passport.requireAuth, async (req, res) => {
    const model = {
        errors: null
    };

    model.category = await CategoryModel.find(
        {
            isDeleted: false
        }
    ).lean();

    model.product = await ProductModel.findOne(
        {
            id: req.params.id
        }
    ).lean();

    res.render('admin/product/edit', model);
});

router.post('/sua/:id.html', upload.single('hinh'), async (req, res) => {
    try {
        // Lấy danh sách danh mục không bị xóa
        const lstCategory = await CategoryModel.find({isDeleted: false}).lean();

        // Tìm sản phẩm theo id
        const docProduct = await ProductModel.findOne({id: req.params.id}).lean();

        // Kiểm tra nếu sản phẩm không tồn tại
        if (!docProduct) {
            return res.render('admin/product/edit', {
                errors: [{msg: 'Tham số đầu vào không hợp lệ'}],
                category: lstCategory,
            });
        }

        // Kiểm tra các trường trong body
        req.checkBody('name', 'Tên không được rỗng').notEmpty();
        req.checkBody('price', 'Giá phải là số').isInt();
        req.checkBody('description', 'Chi tiết không được rỗng').notEmpty();

        // Lấy danh sách lỗi từ các kiểm tra
        const errors = req.validationErrors();
        if (errors) {
            return res.render('admin/product/edit', {
                errors,
                category: lstCategory,
                product: docProduct,
            });
        }

        // Tạo dữ liệu cập nhật
        const updateData = {
            name: req.body.name,
            categoryId: req.body.categoryId,
            description: req.body.description,
            price: req.body.price,
            sale: req.body.sale,
            // Tính giá sau khi giảm giá
            salePrice: req.body.sale ? req.body.price - (req.body.sale * req.body.price) / 100 : req.body.price,
            urlRewriteName: Charset.removeUnicode(req.body.name),
            // Xử lý hình ảnh
            photo: req.file && req.file.filename ? req.file.filename : docProduct.photo,
        };

        // Cập nhật sản phẩm
        await ProductModel.findOneAndUpdate(
            {id: docProduct.id},
            updateData,
            {new: true} // Trả về tài liệu đã cập nhật
        );

        req.flash('response_message', 'Đã sửa thành công');
        res.redirect(`/admin/product/sua/${req.params.id}.html`);
    } catch (error) {
        console.error('Error updating product:', error);
        req.flash('response_message', 'Có lỗi xảy ra khi cập nhật sản phẩm');
        res.redirect(`/admin/product/sua/${req.params.id}.html`);
    }
});

router.get('/xoa/:id', Passport.requireAuth, async (req, res) => {
    try {
        // Tìm sản phẩm theo id và kiểm tra xem nó có bị xoá chưa
        const docProduct = await ProductModel.deleteOne({
            id: req.params.id,
            isDeleted: false
        }).lean();

        if (!docProduct) {
            req.flash('response_message', 'Tham Số Đầu Vào Không Hợp Lệ');
        } else {
            // Sử dụng updateOne để cập nhật trạng thái isDeleted
            await ProductModel.updateOne(
                {id: docProduct.id},
                {$set: {isDeleted: true}}
            );

            req.flash('response_message', 'Đã Xoá Thành Công');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        req.flash('response_message', 'Lỗi xảy ra khi xóa sản phẩm');
    }

    res.redirect('/admin/product/danh-sach.html');
});

module.exports = router;
