const { Cashfree, CFEnvironment } = require("cashfree-pg");

const cashfree = new Cashfree(
  process.env.CASHFREE_ENV === "PRODUCTION"
    ? CFEnvironment.PRODUCTION
    : CFEnvironment.SANDBOX,
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_SECRET_KEY
);

module.exports = cashfree;