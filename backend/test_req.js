const http = require('http');

const data = JSON.stringify({
  event: 'PAYMENT_APPROVED',
  payload: { amount: 5000 },
  userId: '99399b22-4abd-4611-ad55-d4cad6d682b4',
});

const options = {
  hostname: '127.0.0.1',
  port: 4000,
  path: '/api/dev/test-notification',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  },
};

const req = http.request(options, (res) => {
  let body = '';
  console.log(`Status Code: ${res.statusCode}`);
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    console.log('Response Body:', body);
  });
});

req.on('error', (error) => {
  console.error('Request Error:', error);
});

req.write(data);
req.end();
