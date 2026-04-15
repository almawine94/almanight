var crypto = require('crypto');
var stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  
  try {
    var data = JSON.parse(event.body);
    var token = data.token || '';
    
    // Verify token
    var correctPassword = process.env.DASHBOARD_PASSWORD || '';
    var today = new Date().toISOString().split('T')[0];
    var expectedToken = crypto.createHash('sha256').update(correctPassword + today + 'streetnight').digest('hex');
    
    if (token !== expectedToken) {
      return { statusCode: 200, body: JSON.stringify({ error: 'Invalid token' }) };
    }
    
    // Fetch last 50 payment intents from Stripe
    var payments = await stripe.paymentIntents.list({
      limit: 50,
      expand: ['data.charges']
    });
    
    var orders = [];
    payments.data.forEach(function(pi) {
      if (pi.status === 'succeeded' || pi.status === 'requires_payment_method') {
        var meta = pi.metadata || {};
        orders.push({
          id: pi.id,
          amount: pi.amount / 100,
          status: pi.status === 'succeeded' ? 'succeeded' : 'pending',
          created: pi.created,
          client_name: meta.client_name || '',
          client_phone: meta.client_phone || '',
          client_address: meta.client_address || '',
          client_notes: meta.client_notes || '',
          free_order: meta.free_order || '',
          suggestion: meta.suggestion || '',
          description: pi.description || '',
          articles: meta.articles || ''
        });
      }
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({ orders: orders })
    };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
