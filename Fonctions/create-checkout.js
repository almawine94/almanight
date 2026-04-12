const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const { items, delivery, freeOrder, customerName, customerPhone, customerAddress, customerCity, customerNotes } = data;

    let lineItems = [];
    let orderDescription = '';

    if (items && items.length >
