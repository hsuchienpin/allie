/* Use the real persistent shell, while game assertions target its same-origin frame. */
async function gamePage(context) {
  const raw = await context.newPage();
  const game = () => raw.frame({name:'allie-game'});
  const frameMethods = new Set(['evaluate','evaluateHandle','waitForFunction','locator','getByRole','getByText','getByLabel','getByTestId','click','fill','press','waitForSelector','$','$$','$eval','$$eval','selectOption','check','uncheck']);
  async function loaded() { await raw.waitForSelector('#allie-game'); await raw.waitForFunction(()=>{const w=document.getElementById('allie-game').contentWindow;return w.AllieScreen&&!w.AllieScreen.isHost&&w.document.readyState==='complete';}); }
  return new Proxy(raw, {get(target,key) {
    if(key==='shell')return raw;
    if(key==='gameFrame')return game;
    if(key==='goto')return async(...args)=>{const result=await raw.goto(...args);await loaded();return result;};
    if(key==='reload')return async(...args)=>{const result=await raw.reload(...args);await loaded();return result;};
    if(frameMethods.has(key))return (...args)=>game()[key](...args);
    const value=target[key];return typeof value==='function'?value.bind(target):value;
  }});
}
module.exports={gamePage};
