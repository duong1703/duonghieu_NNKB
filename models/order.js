const mongoose = require('mongoose');

const Model = new mongoose.Schema(
  {
    id: Number,
    name: String,
    email: String,
    phone: String,
    msg: String,
    details: Object,
    total: Number,
    status: Number,
    payment: String,
    ship: String,
    isDeleted: Boolean,
    userId : Number,
    created_at: {
      type: Date,
      require: true
    },
  },
  {
    collection: 'order'
  }
);
    

module.exports = mongoose.model('order', Model);
