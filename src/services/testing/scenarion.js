export function runScenario (req,res){
  console.log('run scenario');
  console.log(req.body);
  res.send('ahoj');
};
