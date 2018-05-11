const { exec } = require('child_process');
import { Observable } from 'rxjs/Rx';
import { merge } from 'rxjs/observable/merge';
import { map, flatMap } from 'rxjs/operators';

export function executeBinary (prefix) {
  let handler = ([ws,req]) => {
    let regex = `^/${prefix}/`;
    let cmd = req.url.replace(new RegExp(regex),'/');
    console.log(`starting execute binary service for a binary: ${cmd}`);
	  var response = (name) => {
	    return {"time": (new Date()).toJSON(),
	            "event": name,
	            "command": cmd};
	  };
	  return Observable.of([ws, req, response('hello, give me arguments to run the command')])
	    .merge(Observable.fromEvent(ws,'message')
	           .flatMap((x) => {
	             let args = x.data;
	             let actuallCmd = cmd + " " + args;
	             console.log("a request arrived. cmd to execute:",actuallCmd);
	             return Observable.bindCallback(exec, Array.of)(cmd + " " + x.data)
	               .map((x) => [ws, req, Object.assign(response('run'),
	                                                   {args: args,
	                                                    error: x[0],
							                                        stdout: x[1],
							                                        stderr: x[2]})]);
	           }));
  };
  return handler;
}
