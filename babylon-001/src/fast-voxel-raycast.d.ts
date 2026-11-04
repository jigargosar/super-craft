// Types for fast-voxel-raycast (package ships none). getVoxel returns a truthy value for solid voxels;
// the call returns that value for the first hit (0/falsy = no hit). hitNormal points out of the hit face.
declare module 'fast-voxel-raycast' {
  export default function raycast(
    getVoxel: (x: number, y: number, z: number) => number,
    origin: number[],
    direction: number[],
    maxDistance: number,
    hitPosition?: number[],
    hitNormal?: number[],
  ): number
}
