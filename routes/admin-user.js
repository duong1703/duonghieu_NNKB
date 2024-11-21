const router = require('express').Router();
const multer = require('multer');
const BcryptJs = require('bcryptjs');
const Passport = require('../modules/passport');
const UserModel = require('../models/user');
const UserRole = require('../constants/user-role');

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/upload');
    },
    filename: function (req, file, cb) {
      cb(null, `${Date.now()}_${file.originalname}`);
    }
  })
});

// Route chính
router.get('/', Passport.requireAuth, (req, res) => {
  res.redirect('/admin/user/danh-sach.html');
});

// Lấy danh sách người dùng
router.get('/danh-sach.html', Passport.requireAuth, async (req, res) => {
  try {
    // Lấy tất cả người dùng không bị xóa
    const users = await UserModel.find({ isDeleted: { $ne: true } }).lean();
    console.log(users); // Log để kiểm tra
    res.render('admin/user/list', {
      data: users,
      response_message: req.flash('response_message') || '' // Khởi tạo response_message
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    req.flash('response_message', 'Lỗi xảy ra khi lấy danh sách người dùng');
    res.redirect('/admin/user/danh-sach.html');
  }
});



// Sửa thông tin người dùng
router.get('/sua/:id.html', Passport.requireAuth, async (req, res) => {
  const docUser = await UserModel.findById(req.params.id).lean();
  if (!docUser) {
    req.flash('response_message', 'Người dùng không tồn tại');
    return res.redirect('/admin/user/danh-sach.html');
  }

  docUser.password = '';
  const aRole = Object.values(UserRole);

  res.render('admin/user/edit', {
    errors: null,
    roles: aRole,
    user: docUser
  });
});

// Xử lý cập nhật thông tin người dùng
router.post('/sua/:id.html', Passport.requireAuth, upload.single('hinh'), async (req, res) => {
  const docUser = await UserModel.findById(req.params.id).lean();
  if (!docUser) {
    req.flash('response_message', 'Người dùng không tồn tại');
    return res.redirect('/admin/user/danh-sach.html');
  }

  req.checkBody('fullname', 'Họ tên không được rỗng').notEmpty();
  req.checkBody('fullname', 'Họ tên từ 5 đến 32 ký tự').isLength({ min: 5, max: 32 });
  req.checkBody('email', 'Email không được rỗng').notEmpty();
  req.checkBody('email', 'Định dạng email không hợp lệ').isEmail();
  const errors = req.validationErrors();

  if (errors) {
    return res.render('admin/user/edit', {
      errors,
      roles: Object.values(UserRole),
      user: docUser
    });
  }

  const sEmail = req.body.email.trim().toLowerCase();
  if (sEmail !== docUser.email) {
    const emailExists = await UserModel.findOne({ email: sEmail }).lean();
    if (emailExists) {
      return res.render('admin/user/edit', {
        errors: [{ msg: 'Email đã tồn tại' }],
        roles: Object.values(UserRole),
        user: docUser
      });
    }
  }

  const updateData = {
    fullname: req.body.fullname,
    email: sEmail,
    roles: req.body.role ? req.body.role.split('|').filter(x => x) : docUser.roles
  };

  if (req.body.password && req.body.password.length > 0) {
    const sHashSalt = BcryptJs.genSaltSync(16);
    updateData.password = BcryptJs.hashSync(req.body.password, sHashSalt);
  }

  if (req.file && req.file.filename) {
    updateData.photo = req.file.filename;
  }

  await UserModel.findByIdAndUpdate(req.params.id, updateData);
  req.flash('response_message', 'Đã Sửa Thành Công');
  res.redirect(`/admin/user/sua/${req.params.id}.html`);
});

// Xóa người dùng
router.get('/xoa/:id', Passport.requireAuth, async (req, res) => {
  const docUser = await UserModel.deleteOne(req.params.id).lean();
  if (!docUser) {
    req.flash('response_message', 'Người dùng không tồn tại');
  } else {
    await UserModel.findByIdAndUpdate(req.params.id, { isDeleted: true });
    req.flash('response_message', 'Đã Xoá Thành Công');
  }
  res.redirect('/admin/user/danh-sach.html');
});

module.exports = router;
