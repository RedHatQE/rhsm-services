const http = require('http');

var options = {
  host: "localhost",
  port: 9091,
  path: "/run/testing/scenario",
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  }
};

var req = http.request(options, function(res) {
  console.log('Status: ' + res.statusCode);
  console.log('Headers: ' + JSON.stringify(res.headers));
  res.setEncoding('utf8');
  res.on('data', function (body) {
    console.log('Body: ' + body);
  });
});
req.on('error', function(e) {
  console.log('problem with request: ' + e.message);
});
// write data to request body
req.write(JSON.stringify({scenario:"user-changes-a-config-value"}));
req.end();
