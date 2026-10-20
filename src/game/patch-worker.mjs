import { createCourseCellDescriptor } from './cell-descriptor.mjs';
import { prepareTreeData } from './patch-geometry.mjs';
let course,quality=true;
self.onmessage=({data})=>{
  if(data.type==='init'){course=data.course;quality=data.quality;return}
  try {
    const patch=prepareTreeData(createCourseCellDescriptor(course,data.cell,{terrainSegments:course.geography?12:16}),quality);
    const transfer=[];for(const key of ['nearTrees','farTrees'])for(const field of ['positions','colors','indices','normals'])transfer.push(patch[key][field].buffer);
    self.postMessage({id:data.id,patch},transfer);
  }catch(error){self.postMessage({id:data.id,error:String(error.message||error)})}
};
