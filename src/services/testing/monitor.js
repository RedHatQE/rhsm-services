import { Observable } from 'rxjs/Rx';
import { merge } from 'rxjs/observable/merge';
import { zip } from 'rxjs/observable/zip';
import { map, flatMap } from 'rxjs/operators';

export function testingSignals (testingSignals, websocketsToBroadcast){
  let handler = ([ws,req]) => Observable.fromEvent(ws,'message').flatMap(
    (x) => {
      return [ws,req,'msg'];
    });
  return handler;
};
