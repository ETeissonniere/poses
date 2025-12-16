import { Matrix4, Quaternion, Vector3, Euler } from 'three'

export interface Pose {
  position: { x: number; y: number; z: number }
  quaternion: { x: number; y: number; z: number; w: number }
}

/**
 * Creates a 4x4 transformation matrix from position and quaternion
 */
export function createTransformMatrix(pose: Pose): Matrix4 {
  const matrix = new Matrix4()
  const position = new Vector3(pose.position.x, pose.position.y, pose.position.z)
  const quaternion = new Quaternion(
    pose.quaternion.x,
    pose.quaternion.y,
    pose.quaternion.z,
    pose.quaternion.w
  )
  const scale = new Vector3(1, 1, 1)

  matrix.compose(position, quaternion, scale)
  return matrix
}

/**
 * Applies a transform to a pose (local frame: result = pose × transform)
 */
export function applyTransform(poseMatrix: Matrix4, transformMatrix: Matrix4): Matrix4 {
  return poseMatrix.clone().multiply(transformMatrix)
}

/**
 * Extracts position and quaternion from a 4x4 transformation matrix
 */
export function matrixToPose(matrix: Matrix4): Pose {
  const position = new Vector3()
  const quaternion = new Quaternion()
  const scale = new Vector3()

  matrix.decompose(position, quaternion, scale)

  return {
    position: { x: position.x, y: position.y, z: position.z },
    quaternion: { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w }
  }
}

/**
 * Converts Matrix4 to a 2D array for display
 */
export function matrixToArray(matrix: Matrix4): number[][] {
  const elements = matrix.elements
  // Three.js uses column-major order, we want row-major for display
  return [
    [elements[0], elements[4], elements[8], elements[12]],
    [elements[1], elements[5], elements[9], elements[13]],
    [elements[2], elements[6], elements[10], elements[14]],
    [elements[3], elements[7], elements[11], elements[15]]
  ]
}

/**
 * Normalizes a quaternion
 */
export function normalizeQuaternion(q: { x: number; y: number; z: number; w: number }): { x: number; y: number; z: number; w: number } {
  const quat = new Quaternion(q.x, q.y, q.z, q.w)
  quat.normalize()
  return { x: quat.x, y: quat.y, z: quat.z, w: quat.w }
}

/**
 * Calculates the magnitude of a quaternion (should be 1 for valid rotation)
 */
export function quaternionMagnitude(q: { x: number; y: number; z: number; w: number }): number {
  return Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w)
}

/**
 * Checks if a quaternion is approximately normalized (within tolerance)
 */
export function isQuaternionNormalized(q: { x: number; y: number; z: number; w: number }, tolerance = 0.001): boolean {
  const mag = quaternionMagnitude(q)
  return Math.abs(mag - 1) < tolerance
}

/**
 * Creates an identity pose (origin with no rotation)
 */
export function identityPose(): Pose {
  return {
    position: { x: 0, y: 0, z: 0 },
    quaternion: { x: 0, y: 0, z: 0, w: 1 }
  }
}

/**
 * Creates an identity transform (no translation, no rotation)
 */
export function identityTransform(): Pose {
  return identityPose()
}

/**
 * Converts Euler angles (in radians) to quaternion
 */
export function eulerToQuaternion(
  x: number,
  y: number,
  z: number,
  order: 'XYZ' | 'XZY' | 'YXZ' | 'YZX' | 'ZXY' | 'ZYX' = 'XYZ'
): { x: number; y: number; z: number; w: number } {
  const euler = new Euler(x, y, z, order)
  const quat = new Quaternion().setFromEuler(euler)
  return { x: quat.x, y: quat.y, z: quat.z, w: quat.w }
}

/**
 * Converts quaternion to Euler angles (in radians)
 */
export function quaternionToEuler(
  q: { x: number; y: number; z: number; w: number },
  order: 'XYZ' | 'XZY' | 'YXZ' | 'YZX' | 'ZXY' | 'ZYX' = 'XYZ'
): { x: number; y: number; z: number } {
  const quat = new Quaternion(q.x, q.y, q.z, q.w)
  const euler = new Euler().setFromQuaternion(quat, order)
  return { x: euler.x, y: euler.y, z: euler.z }
}

/**
 * Formats a number for display with specified precision
 */
export function formatNumber(n: number, precision = 6): string {
  if (Math.abs(n) < 1e-10) return '0'
  return n.toFixed(precision).replace(/\.?0+$/, '')
}
