import type { Group } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { assetUrl } from '../core/assets'

let draco: DRACOLoader | null = null

function dracoLoader(): DRACOLoader {
  if (!draco) {
    draco = new DRACOLoader()
    draco.setDecoderPath(assetUrl('draco/'))
  }
  return draco
}

export function loadShell(url: string): Promise<Group> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader())
    loader.load(url, (gltf) => resolve(gltf.scene), undefined, reject)
  })
}
