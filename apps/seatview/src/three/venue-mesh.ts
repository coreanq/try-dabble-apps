import * as THREE from 'three'
import type { Seat } from '../core/seat-engine'
import type { Obstacle, Stage, Venue } from '../core/venue-schema'

const SEAT_SIZE = 0.45
const TILE_SIZE = 0.9
const TILE_THICKNESS = 0.12

function buildStage(stage: Stage): THREE.Group {
  const g = new THREE.Group()
  g.name = 'stage'
  const [w, h, d] = stage.size
  const [cx, cy, cz] = stage.center
  const floor = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: 0x7c4dff }))
  floor.position.set(cx, cy + h / 2, cz)
  g.add(floor)
  // 무대 뒤 백월: 방향감을 주기 위한 얇은 벽
  const wallH = 8
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(w * 1.2, wallH, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x22232e, emissive: 0x11121a }),
  )
  wall.position.set(cx - stage.facing[0] * (d / 2), cy + wallH / 2, cz - stage.facing[2] * (d / 2))
  g.add(wall)
  return g
}

function buildSeats(seats: Seat[], stage: Stage): THREE.Group {
  const g = new THREE.Group()
  g.name = 'seatGroup'
  const seatMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(SEAT_SIZE, SEAT_SIZE, SEAT_SIZE),
    new THREE.MeshStandardMaterial({ color: 0xc23a4a }),
    seats.length,
  )
  seatMesh.name = 'seats'
  const tileMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(TILE_SIZE, TILE_THICKNESS, TILE_SIZE),
    new THREE.MeshStandardMaterial({ color: 0x555a66 }),
    seats.length,
  )
  tileMesh.name = 'tiles'
  const dummy = new THREE.Object3D()
  seats.forEach((s, i) => {
    const [x, y, z] = s.position
    const yaw = Math.atan2(stage.center[0] - x, stage.center[2] - z)
    dummy.rotation.set(0, yaw, 0)
    dummy.position.set(x, y + SEAT_SIZE / 2, z)
    dummy.updateMatrix()
    seatMesh.setMatrixAt(i, dummy.matrix)
    dummy.position.set(x, y - TILE_THICKNESS / 2, z)
    dummy.updateMatrix()
    tileMesh.setMatrixAt(i, dummy.matrix)
  })
  seatMesh.instanceMatrix.needsUpdate = true
  tileMesh.instanceMatrix.needsUpdate = true
  g.add(tileMesh, seatMesh)
  return g
}

function buildObstacle(o: Obstacle): THREE.Mesh {
  const mat = new THREE.MeshStandardMaterial({ color: 0xd0d0d0 })
  if (o.type === 'pillar') {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(o.radius, o.radius, o.height, 16), mat)
    m.position.set(o.position[0], o.position[1] + o.height / 2, o.position[2])
    return m
  }
  const dx = o.to[0] - o.from[0]
  const dz = o.to[2] - o.from[2]
  const len = Math.hypot(dx, dz)
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, o.height, len), mat)
  m.position.set((o.from[0] + o.to[0]) / 2, o.from[1] + o.height / 2, (o.from[2] + o.to[2]) / 2)
  m.rotation.y = Math.atan2(dx, dz)
  return m
}

export function buildVenueGroup(venue: Venue, seats: Seat[]): THREE.Group {
  const root = new THREE.Group()
  root.name = `venue:${venue.id}`

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 600),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2e }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.02
  root.add(ground)

  root.add(buildStage(venue.stage))
  root.add(buildSeats(seats, venue.stage))

  const obstacles = new THREE.Group()
  obstacles.name = 'obstacles'
  for (const o of venue.obstacles) obstacles.add(buildObstacle(o))
  root.add(obstacles)

  root.add(new THREE.HemisphereLight(0xffffff, 0x333340, 1.2))
  const sun = new THREE.DirectionalLight(0xffffff, 1.4)
  sun.position.set(50, 80, 30)
  root.add(sun)
  return root
}

/** setVenue로 교체된 그룹의 GPU 자원을 해제한다 (관리자 도구는 편집마다 재빌드하므로 필수) */
export function disposeVenueGroup(group: THREE.Object3D): void {
  group.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    mesh.geometry.dispose()
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const m of mats) m.dispose()
    if ((obj as THREE.InstancedMesh).isInstancedMesh) (obj as THREE.InstancedMesh).dispose()
  })
}
