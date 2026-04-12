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

    if (items && items.length > 0) {
      items.forEach(item => {
        lineItems.push({
          price_data: {
            currency: 'eur',
            product_data: { name: item.name },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.qty,
        });
        orderDescription += item.name + ' x' + item.qty + ' | ';
      });
    }

    if (delivery && delivery > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: 'Frais de livraison' },
          unit_amount: Math.round(delivery * 100),
        },
        quantity: 1,
      });
    }

    if (freeOrder) {
      orderDescription += 'COMMANDE LIBRE: ' + freeOrder + ' | ';
    }
    orderDescription += customerAddress + ', ' + customerCity;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: event.headers.origin + '?success=true',
      cancel_url: event.headers.origin + '?canceled=true',
      metadata: {
        client_name: customerName,
        client_phone: customerPhone,
        client_address: customerAddress + ', ' + customerCity,
        client_notes: customerNotes || '',
        free_order: freeOrder || '',
        order_details: orderDescription,
      },
      payment_intent_data: {
        description: 'AlmaNight - ' + customerName + ' - ' + customerPhone,
        metadata: {
          client_name: customerName,
          client_phone: customerPhone,
          client_address: customerAddress + ', ' + customerCity,
          client_notes: customerNotes || '',
          free_order: freeOrder || '',
        }
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    console.error('Stripe error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
