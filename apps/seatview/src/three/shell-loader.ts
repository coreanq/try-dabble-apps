import type { Group } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export function loadShell(url: string): Promise<Group> {
  return new Promise((resolve, reject) => {
    new GLTFLoader().load(url, (gltf) => resolve(gltf.scene), undefined, reject)
  })
}
