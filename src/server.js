const WebSocket = require('ws');
const fs = require('fs');
const Rx = require('rxjs/Rx');
const { exec } = require ('child_process');

const wss = new WebSocket.Server({port: 9091});

// Rx.Observable streams accepts just one argument. 'connection' event provides two arguments. There is a pre-processing function to merge the args into an array
var ConnectionsStream = Rx.Observable.fromEvent(wss,'connection', null, (ws,req) => [ws,req]).publish();

ConnectionsStream.filter(([ws,req]) => req.url.match(/^\/monitor\/(.*)/))
  .flatMap(([ws,req]) =>{

    let filename = req.url.replace(/^\/monitor\/+/,'/');
    let fileWatch = fs.watch(filename);

  	var msg = (name) => {
      return [ws, {"time": (new Date()).toJSON(),
                   "event": name,
                   "file": filename,
                   "content":fs.readFileSync(filename).toString('base64')}];
    };

  	return Rx.Observable.of(msg("open"))
      .merge(Rx.Observable.fromEvent(ws,'message').map((x) => { console.log("monitor request appeared: ",x);
                                                                return msg("pong"); }))
      .merge(Rx.Observable.fromEvent(fileWatch,'change').map((x) => { console.log("a change of a filename happened");
                                                                      return msg("change"); }));
  })
  .subscribe(
    ([ws,msg]) => {ws.send(JSON.stringify(msg));},
    (err) => {console.log('error: %s', err);},
    () => {console.log('completed');}
  );

ConnectionsStream.filter(([ws,req]) => req.url.match(/^\/execute\/(.*)/))
  .flatMap(([ws,req]) => {
    let cmd = req.url.replace(/^\/execute\/+/,'/');
  	var response = (name) => {
      return {"time": (new Date()).toJSON(),
              "event": name,
              "command": cmd};
    };
    return Rx.Observable.of([ws, response('hello, give me arguments to run the command')])
      .merge(Rx.Observable.fromEvent(ws,'message')
             .flatMap((x) => {
               let args = x.data;
               let actuallCmd = cmd + " " + args;
               console.log("a request arrived. cmd to execute:",actuallCmd);
               return Rx.Observable.bindCallback(exec, Array.of)(cmd + " " + x.data)
                 .map((x) => [ws, Object.assign(response('run'),
                                                {args: args,
                                                 output: x.toString()})]);
             }));
  })
  .subscribe(
    ([ws,msg]) => ws.send(JSON.stringify(msg)),
    (err) => console.log('error: %s', err),
    () => console.log('completed')
  );

ConnectionsStream.connect();

// wss.on('connection', (ws,req) => {
//   Rx.Observable.of([ws,req])
//     .flatMap(([ws,req]) =>{
//   	  var msg = (name) => {
//         console.log(req.url);
//         return {"socket": ws,
//   				      "time": (new Date()).toJSON(),
//   				      "event": name};};
//   	  return Rx.Observable.of(msg("open"))
//   	    .merge( Rx.Observable.fromEvent(ws,'message').map((x) => { return msg("pong"); }));
//     })
//     .subscribe(
//       (x) => {x.socket.send(JSON.stringify({"event":x.event,
//                                             "time": x.time,
//                                             "file":x.filename,
//                                             "content":x.filecontent}));},
//       (err) => {console.log('error: %s', err);},
//       () => {console.log('completed');}
//     );
// });
// Rx.Observable.fromEvent(wss,'connection')
//   .flatMap((ws,req) =>{
// 	  var msg = (name) => {
//       console.log(req);
//       console.log(ws);
//       return {"socket": ws,
// 				      "time": (new Date()).toJSON(),
// 				      "event": name};};
// 	  return Rx.Observable.of(msg("open"))
// 	    .merge( Rx.Observable.fromEvent(ws,'message').map((x) => { return msg("pong"); }));
//   })
//   .subscribe(
//     (x) => {x.socket.send(JSON.stringify({"event":x.event,
//                                           "time": x.time,
//                                           "file":x.filename,
//                                           "content":x.filecontent}));},
//     (err) => {console.log('error: %s', err);},
//     () => {console.log('completed');}
//   );

// server.listen(9091,function(){
//   console.log('Listening on %d', server.address().port);
// });

// Rx.Observable.fromEvent(wss,'connection')
//     .flatMap((ws) =>{
// 	    var msg = (name) => { return {"socket": ws,
// 				                            "time": (new Date()).toJSON(),
// 				                            "event": name,
// 				                            "filename": filename,
// 				                            "filecontent": fs.readFileSync(filename).toString('base64')};};
// 	    return Rx.Observable.of(msg("open"))
//         .merge( Rx.Observable.fromEvent(fileWatch,'change').map((x) => { return msg("change"); }))
// 	      .merge( Rx.Observable.fromEvent(ws,'message').map((x) => { return msg("pong"); }));
//     })
//     .subscribe(
//         (x) => {x.socket.send(JSON.stringify({"event":x.event,
//                                               "time": x.time,
//                                               "file":x.filename,
//                                               "content":x.filecontent}));},
//       (err) => {console.log('error: %s', err);},
//       () => {console.log('completed');}
//     );
