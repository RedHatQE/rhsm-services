const WebSocket = require('ws');
const fs = require('fs');
const Rx = require('rxjs/Rx');

const filename = "/etc/rhsm/rhsm.conf";
const fileWatch = fs.watch(filename);
const wss = new WebSocket.Server({port: 9091});
Rx.Observable.fromEvent(wss,'connection')
    .flatMap((ws) => {
        console.log('connection openned');
        return Rx.Observable.fromEvent(fileWatch,'change')
            .map((x) => { console.log('change');
                          return {"event": "change",
                                  "file-name": filename,
                                  "file-content": fs.readFileSync(filename).toString('base64')}})
    })
    .subscribe((x) => {
        console.log(x);
    });

// const wss = new WebSocket.Server({port: 9091});
// wss.on('connection', function connection(ws) {
//     const filename = "/etc/rhsm/rhsm.conf";
//     ws.on('message', function incoming(message){
//     });
//     fs.watch(filename, (event, fname) => {
//         ws.send(JSON.stringify({"event": event,
//                                 "file-name": filename,
//                                 "file-content": fs.readFileSync(filename).toString('base64')}));
//     });
//     ws.send(JSON.stringify({"event": "init",
//                             "file-name": filename,
//                             "file-content": fs.readFileSync(filename).toString('base64')}));
// });
