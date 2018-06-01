export function sendMessage (signals$){
  let handler = (req,res) => {
    signals$.next(req.body);
    res.send('Thanks, message received.');
  };
  return handler;
};
