const fs = require('fs');
import { Observable } from 'rxjs/Rx';
import { merge } from 'rxjs/observable/merge';
import { map, flatMap } from 'rxjs/operators';

export function monitorFile(prefix) {
  let handler = ([ws,req]) => {
    let regex = `^\/${prefix}\/`;
    let filename = req.url.replace(new RegExp(regex),'/');
    console.log(`starting monitor service for: ${filename} with url prefix: ${prefix}`);
    let fileWatch = fs.watch(filename);
    var msg = (name) => {
      return [ws, req, {"time": (new Date()).toJSON(),
                        "event": name,
                        "file": filename,
                        "content": fs.readFileSync(filename).toString('base64')}];
    };
    return merge(Observable.of(msg('open')),
                 Observable.fromEvent(ws,'message')
                 .map((x) => { console.log("monitor request appeared: ");
                               return msg("pong");}),
                 Observable.fromEvent(fileWatch,'change')
                 .map((x) => { console.log('a change of a file happened');
                               return msg('change');})
                );
  };
  return handler;
}
