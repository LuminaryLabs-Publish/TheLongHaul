import { generateRoadV3, ROAD_V3_VERSION } from './road-v3-geometry.mjs';
import { createRoadV3Journey, roadV3PointAt, roadV3Project, roadV3WorldStreaming, roadV3SceneryDescriptor, createRoadV3Stream, ensureRoadV3Ahead } from './road-v3-journey.mjs';
import { createPlayableRoadV3Course, advancePlayableRoadV3Course } from './road-v3-playable-course.mjs';

// Candidate-only service. It never changes the V1/V2 course, truck or streaming host.
export function createLongHaulRoadV3Kit(N) {
  const RoadV3State=N.defineResource('long-haul.road-v3.state');
  const Generate=N.defineEvent('long-haul.road-v3.generate.request');
  const Reset=N.defineEvent('long-haul.road-v3.reset.request');
  const Ensure=N.defineEvent('long-haul.road-v3.ensure.request');
  const empty=()=>({version:ROAD_V3_VERSION,graph:null,revision:0,error:null});
  const kit=N.defineDomainServiceKit({
    id:'long-haul-road-v3-kit',domain:'long-haul-road',
    apiName:'longHaulRoadV3',services:['candidate-road-graph','crossing-resolution','deterministic-regeneration','journey-projection','spatial-world-streaming','scenery-descriptor','bounded-road-growth','return-reconstruction','playable-terrain-road-adapter'],
    stability:'experimental',version:'0.1.0',
    resources:{RoadV3State},events:{Generate,Reset,Ensure},
    systems:[{phase:'resolve',name:'longHaulRoadV3System',system(world){
      let state=world.getResource(RoadV3State)??empty();
      let changed=false;
      for(const _ of world.readEvents(Reset)){state=empty();changed=true;}
      for(const request of world.readEvents(Generate)){
        changed=true;
        try {
          const graph=request.kind==='stream'?createRoadV3Stream(request.seed,request.options):
            request.kind==='journey'?createRoadV3Journey(request.seed,request.options):generateRoadV3(request.seed,request.options);
          state={version:ROAD_V3_VERSION,graph,revision:state.revision+1,error:null};
        } catch(error) {
          state={...state,error:String(error)};
        }
      }
      for(const request of world.readEvents(Ensure)) {
        if (!state.graph?.directory) continue;
        try {
          const graph=ensureRoadV3Ahead(state.graph,request.progress,request.options);
          if(graph!==state.graph){state={...state,graph,revision:state.revision+1,error:null};changed=true;}
        }catch(error){state={...state,error:String(error)};changed=true;}
      }
      if(changed)world.setResource(RoadV3State,state);
    }}],
    initWorld({world}){world.setResource(RoadV3State,empty());},
    createApi({world}){const snapshot=()=>structuredClone(world.getResource(RoadV3State)??empty());
      const graph=()=>world.getResource(RoadV3State)?.graph;
      return {getState:snapshot,snapshot,generate(seed,options={}){world.emit(Generate,{seed,options:structuredClone(options)});},
        prepareJourney(seed,options={}){world.emit(Generate,{kind:'journey',seed,options:structuredClone(options)});},
        prepareStream(seed,options={}){world.emit(Generate,{kind:'stream',seed,options:structuredClone(options)});},
        ensureAhead(progress,options={}){world.emit(Ensure,{progress,options:structuredClone(options)});},
        // Pure builders: the existing Course Kit remains the single live
        // authority. No second road/world state is installed during play.
        buildPlayable(seed,options={}){return createPlayableRoadV3Course(seed,options);},
        advancePlayable(course,progress){return advancePlayableRoadV3Course(course,progress);},
        sample(progress,lateral=0){return roadV3PointAt(graph(),progress,lateral);},
        locate(position,options={}){return roadV3Project(graph(),position,options);},
        stream(position,options={}){return roadV3WorldStreaming(graph(),position,options);},
        scenery(progress){return roadV3SceneryDescriptor(graph(),progress);},
        reset(){world.emit(Reset,{});}};
    }
  });
  return Object.freeze({kit,resources:Object.freeze({RoadV3State})});
}
