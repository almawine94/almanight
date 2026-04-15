var crypto = require('crypto');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  
  try {
    var data = JSON.parse(event.body);
    var password = data.password || '';
    var correctPassword = process.env.DASHBOARD_PASSWORD || '';
    
    if (password === correctPassword) {
      var today = new Date().toISOString().split('T')[0];
      var token = crypto.createHash('sha256').update(correctPassword + today + 'streetnight').digest('hex');
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, token: token })
      };
    } else {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: false })
      };
    }
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};