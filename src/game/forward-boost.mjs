// Simulation-time burst; keyboard repeat and mixed-key presses are not double taps.
export function createForwardBoost() {
  const taps=new Map();let remaining=0;
  return {
    tap(code,now){
      if(remaining>0)return false;
      const previous=taps.get(code);taps.set(code,now);
      if(previous===undefined||now-previous>300||now<=previous)return false;
      taps.clear();remaining=5;return true;
    },
    advance(dt,{cancel=false}={}){if(cancel){remaining=0;taps.clear()}else remaining=Math.max(0,remaining-dt);return remaining>0},
    reset(){remaining=0;taps.clear()},
    clearTaps(){taps.clear()},
    get remaining(){return remaining}
  };
}
