import type { Group } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'

let draco: DRACOLoader | null = null

/** 디코더 경로는 DRACOLoader가 import.meta.url로 잡고 Vite가 번들에 함께 넣는다(dist/assets). */
function dracoLoader(): DRACOLoader {
  if (!draco) draco = new DRACOLoader()
  return draco
}

export function loadShell(url: string): Promise<Group> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader())
    loader.load(url, (gltf) => resolve(gltf.scene), undefined, reject)
  })
}
