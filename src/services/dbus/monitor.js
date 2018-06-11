const { spawn } = require('child_process');
import { Observable } from 'rxjs/Rx';
import { merge } from 'rxjs/observable/merge';
import { map, flatMap } from 'rxjs/operators';

export function dbusSystemMonitor(){
  let cmd = "/usr/bin/dbus-monitor --system";
  console.log('running system monitor');
	var response = (event) => {
	  return {"time": (new Date()).toJSON(),
	          "type": "system dbus monitor",
            "event": event};
	};
  let proc = spawn('/usr/bin/dbus-monitor',['--system']);
  return merge(
    Observable.fromEvent(proc.stdout,'data').map((x) => response({'stdout': x.toString()})),
    Observable.fromEvent(proc.stderr,'data').map((x) => response({'stderr': x.toString()}))
  );
};
