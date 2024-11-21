const mongoose = require('mongoose');

const Model = new mongoose.Schema(
  {
      id: { type: String, required: true, unique: true },
      name: { type: String, required: true },
      urlRewriteName: { type: String, required: true },
      isDeleted: { type: Boolean, default: false }
  },
  {
    collection: 'category'
  }
);
    
module.exports = mongoose.model('category', Model);
