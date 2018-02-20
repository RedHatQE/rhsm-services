const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:9091/');
ws.on('open', function open(){
    ws.send('hello server, I am a client');
})
ws.on('message', function incoming(data){
    console.log(data);
});
