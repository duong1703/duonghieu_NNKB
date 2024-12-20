const mongoose = require('mongoose');

const Model = new mongoose.Schema(
  {
    id: Number,
    categoryId: Number,
    name: String,
    urlRewriteName: String,
    photo: String,
    description: String,
    price: Number,
    sale: Number,
    sale1: Number,
    salePrice: Number,
    isDeleted: Boolean,

  },
  {
    collection: 'product'
  }
);



module.exports = mongoose.model('product', Model);
