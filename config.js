module.exports = {
  app: {
    port: 3000
  },
  database: {
    connection: 'mongodb://127.0.0.1:27017/shopping',
    option: {
      autoIndex: false
    }
  },
  session: {
    key: '27bda112-99dd-4496-8015-ea20d1034228'
  }
};
