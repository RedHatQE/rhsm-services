const WebSocket = require('ws');
const fs = require('fs');
const Rx = require('rxjs/Rx');
const { exec } = require ('child_process');

const wss = new WebSocket.Server({port: 9091});

// Rx.Observable streams accepts just one argument. 'connection' event provides two arguments. There is a pre-processing function to merge the args into an array
var connectionsStream = Rx.Observable.fromEvent(wss,'connection', null, (ws,req) => [ws,req]).publish();

connectionsStream.filter(([ws,req]) => req.url.match(/^\/monitor\/(.*)/))
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
	    .merge(Rx.Observable.fromEvent(ws,'message').map((x) => { console.log("monitor request appeared: ");
                                                                return msg("pong"); }))
	    .merge(Rx.Observable.fromEvent(fileWatch,'change').map((x) => { console.log("a change of a filename happened");
									                                                    return msg("change"); }));
  }).merge(
	connectionsStream.filter(([ws,req]) => req.url.match(/^\/execute\/(.*)/))
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
	                                                 error: x[0],
							                                     stdout: x[1],
							                                     stderr: x[2]})]);
	             }));
  })).merge(require('./services/rhsm/status.js')(connectionsStream))
.subscribe(
    ([ws,msg]) => ws.send(JSON.stringify(msg), (error) => {console.log('error when sending a response');
							    console.log(error)}),
    (err) => {console.log('error: %s', err);},
    () => {console.log('completed');}
  );

connectionsStream.connect();
