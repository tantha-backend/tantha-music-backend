const PremiumSubscription = require("../models/PremiumSubscription");
const User = require("../models/User");
const cashfree = require("../config/cashfree");

const subscribePremium = async (req, res) => {
  try {
    const { plan } = req.body;

    const selectedPlan = plan === "yearly" ? "yearly" : "monthly";
    const amount = selectedPlan === "yearly" ? 999 : 99;

    const user = await User.findById(req.user.id);

    const orderId = `premium_${req.user.id}_${selectedPlan}_${Date.now()}`;

    const request = {
      order_amount: amount,
      order_currency: "INR",
      order_id: orderId,

      customer_details: {
        customer_id: req.user.id,
        customer_name: user.name,
        customer_email: user.email,
        customer_phone: "9999999999",
      },

      order_meta: {
        return_url: `https://www.google.com?order_id=${orderId}`,
      },

      order_note: `Tantha Music Premium ${selectedPlan}`,
    };

    const response = await cashfree.PGCreateOrder(request);

    res.status(201).json({
      success: true,
      message: "Cashfree order created",
      orderId,
      amount,
      plan: selectedPlan,
      paymentSessionId: response.data.payment_session_id,
      order: response.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create premium payment",
      error: error.response?.data || error.message,
    });
  }
};

const verifyPremiumPayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    const response = await cashfree.PGOrderFetchPayments(orderId);

    const payments = response.data;

    const successfulPayment = payments.find(
      (payment) => payment.payment_status === "SUCCESS"
    );

    if (!successfulPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment not completed",
        payments,
      });
    }

    const parts = orderId.split("_");
    const userId = parts[1];
    const plan = parts[2] === "yearly" ? "yearly" : "monthly";

    const expiresAt = new Date();

    if (plan === "yearly") {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    const subscription = await PremiumSubscription.create({
      userId,
      amount: successfulPayment.payment_amount,
      plan,
      status: "active",
      expiresAt,
    });

    await User.findByIdAndUpdate(userId, {
      isPremium: true,
      premiumExpiresAt: expiresAt,
    });

    res.status(200).json({
      success: true,
      message: "Premium activated after payment",
      subscription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.response?.data || error.message,
    });
  }
};

const getPremiumStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name email isPremium premiumExpiresAt"
    );

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch premium status",
      error: error.message,
    });
  }
};

module.exports = {
  subscribePremium,
  verifyPremiumPayment,
  getPremiumStatus,
};