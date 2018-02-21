const WebSocket = require('ws');
const fs = require('fs');
const Rx = require('rxjs/Rx');

const filename = "/etc/rhsm/rhsm.conf";
const fileWatch = fs.watch(filename);
const wss = new WebSocket.Server({port: 9091,
                                  path:"/monitor/etc/rhsm/rhsm.conf"});
Rx.Observable.fromEvent(wss,'connection')
    .flatMap((ws) => Rx.Observable.of({"socket": ws,
                                       "event": "open",
                                       "filename": filename,
                                       "filecontent": fs.readFileSync(filename).toString('base64')})
                                     .merge( Rx.Observable.fromEvent(fileWatch,'change')
                                             .map((x) => { return {"socket": ws,
                                                                   "event": "change",
                                                                   "filename": filename,
                                                                   "filecontent": fs.readFileSync(filename).toString('base64')}})))
    .subscribe(
        (x) => {x.socket.send(JSON.stringify({"event":x.event,
                                              "file":x.filename,
                                              "content":x.filecontent}))},
        (err) => {console.log('error: %s', err)},
        () => {console.log('completed')}
    );

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
//     ws.send(JSON.stringify({"event": "open",
//                             "file-name": filename,
//                             "file-content": fs.readFileSync(filename).toString('base64')}));
// });
