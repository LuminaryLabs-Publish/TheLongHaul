// Game-owned Three.js r165 presentation policy; not a NexusGL material contract.
export const TOON_STYLE=Object.freeze({
  id:'long-haul-illustrated-v5',
  levels:Object.freeze([.30,.52,.78,1.05]),
  thresholds:Object.freeze([.15,.45,.90]),
  softness:.018,
  // Clear weather and rain share one presentation-only illumination policy.
  illumination:Object.freeze({
    clear:Object.freeze({sun:1.85,hemisphere:1.14,fill:.65}),
    rain:Object.freeze({sun:1.17,hemisphere:1.05,fill:.56}),
    sunColor:0xffdba6,skyColor:0xe0edff,groundColor:0x849875,fillColor:0xd3e5ff,
    shadowedSunFactor:.34,weatherDesaturate:.08
  }),
  clouds:Object.freeze({levels:Object.freeze([.24,.58,.96]),thresholds:Object.freeze([.34,.70]),softness:.02,rimLimit:.3}),
  shadowTint:Object.freeze([.88,.94,1.08]),
  midTint:Object.freeze([.94,.98,1.04]),
  highlightTint:Object.freeze([1.04,1.01,.94]),
  outline:Object.freeze({strength:.62,depthGain:32,pixels:1,color:Object.freeze([.018,.031,.049])}),
  roles:Object.freeze(Object.fromEntries(Object.entries({
    structure:{bias:0,specular:.08,rim:.025},
    road:{bias:-.065,specular:.035,rim:0},
    terrain:{bias:.075,specular:.025,rim:0,shadeFloor:.62},
    vehicle:{bias:0,specular:.14,rim:.045},
    foliage:{bias:.02,specular:.025,rim:.015,shadeFloor:.58},
    metal:{bias:0,specular:.24,rim:.055},
    glass:{bias:0,specular:.18,rim:.035,blend:true},
    smoke:{bias:.02,specular:0,rim:0,blend:true}
  }).map(([key,value])=>[key,Object.freeze(value)])))
});
