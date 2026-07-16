import { clone, finite, segmentInfo } from "./shared.mjs";
import { nearestRoad, nearestDepot } from "./world-base.mjs";

export function createLongHaulCourseKit(N) {
  const CourseState = N.defineResource("long-haul.course.state");
  const CourseLoad = N.defineEvent("long-haul.course.load.request");
  const CourseSample = N.defineEvent("long-haul.course.sample.request");
  const CourseReset = N.defineEvent("long-haul.course.reset.request");
  const initialCourseState = () => ({ course: null, exploredEdgeIds: [], discoveredDepotIds: [], sequence: 0 });
  const courseKit = N.defineDomainServiceKit({
    id: "long-haul-course-kit",
    domain: "long-haul-course",
    apiName: "longHaulCourse",
    services: ["course-package", "exploration", "route-query"],
    stability: "game-stable",
    version: "2.0.0",
    resources: { CourseState },
    events: { CourseLoad, CourseSample, CourseReset },
    systems: [{
      phase: "resolve",
      name: "longHaulCourseSystem",
      system(world) {
        let state = world.getResource(CourseState);
        for (const request of world.readEvents(CourseReset)) state = initialCourseState();
        for (const request of world.readEvents(CourseLoad)) state = { course: clone(request.course), exploredEdgeIds: [], discoveredDepotIds: [], sequence: state.sequence + 1 };
        for (const request of world.readEvents(CourseSample)) {
          if (!state.course) continue;
          const explored = new Set(state.exploredEdgeIds);
          const discovered = new Set(state.discoveredDepotIds);
          const point = { x: finite(request.x), z: finite(request.z) };
          for (const edge of state.course.edges) {
            if (explored.has(edge.id)) continue;
            const close = edge.samples.slice(1).some((sample, index) => segmentInfo(point, edge.samples[index], sample).distance < 75);
            if (close) explored.add(edge.id);
          }
          for (const depot of state.course.depots) if (Math.hypot(point.x - depot.x, point.z - depot.z) < 115) discovered.add(depot.id);
          state = { ...state, exploredEdgeIds: [...explored], discoveredDepotIds: [...discovered], sequence: state.sequence + 1 };
        }
        world.setResource(CourseState, state);
      }
    }],
    initWorld({ world }) { world.setResource(CourseState, initialCourseState()); },
    createApi({ world }) {
      const get = () => clone(world.getResource(CourseState));
      return {
        getState: get,
        load(course) { world.emit(CourseLoad, { course: clone(course) }); return get(); },
        sample(position) { world.emit(CourseSample, clone(position)); return get(); },
        reset() { world.emit(CourseReset, {}); return get(); },
        nearestRoad(point) { return nearestRoad(world.getResource(CourseState)?.course, point); },
        nearestDepot(point) { return nearestDepot(world.getResource(CourseState)?.course, point); },
        snapshot: get,
        loadSnapshot(snapshot = {}) { world.setResource(CourseState, { ...initialCourseState(), ...clone(snapshot) }); return get(); }
      };
    }
  });

  return Object.freeze({ kit: courseKit, resources: Object.freeze({CourseState}) });
}
