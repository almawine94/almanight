const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  try {
    const data = JSON.parse(event.body);
    const items = data.items || [];
    const delivery = data.delivery || 0;
    const freeOrder = data.freeOrder || '';
    const customerName = data.customerName || '';
    const customerPhone = data.customerPhone || '';
    const customerAddress = data.customerAddress || '';
    const customerCity = data.customerCity || '';
    const customerNotes = data.customerNotes || '';
    const suggestion = data.suggestion || '';
    let lineItems = [];
    let articlesList = [];
    items.forEach(function(item) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100)
        },
        quantity: item.qty
      });
      articlesList.push(item.name + ' x' + item.qty + ' (' + item.price + '€)');
    });
    if (delivery > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: 'Frais de livraison' },
          unit_amount: Math.round(delivery * 100)
        },
        quantity: 1
      });
    }
    const desc = 'StreetNight - ' + customerName + ' - ' + customerPhone;
    const articlesStr = articlesList.join(' | ');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: event.headers.origin + '/?success=true',
      cancel_url: event.headers.origin + '/?canceled=true',
      metadata: {
        client_name: customerName,
        client_phone: customerPhone,
        client_address: customerAddress + ', ' + customerCity,
        client_notes: customerNotes,
        free_order: freeOrder,
        suggestion: suggestion,
        articles: articlesStr.substring(0, 500)
      },
      payment_intent_data: {
        description: desc,
        metadata: {
          client_name: customerName,
          client_phone: customerPhone,
          client_address: customerAddress + ', ' + customerCity,
          client_notes: customerNotes,
          free_order: freeOrder,
          suggestion: suggestion,
          articles: articlesStr.substring(0, 500)
        }
      }
    });
    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
