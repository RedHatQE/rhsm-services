import { Observable } from 'rxjs/Rx';
import { merge } from 'rxjs/observable/merge';
import { zip } from 'rxjs/observable/zip';
import { map, flatMap } from 'rxjs/operators';

export function testingSignals ([ws,req]){
  console.log('testing signals openned');
  Observable.fromEvent(ws,'message').flatMap(
    (x) => {

    });
}
