import { TextureLoader } from "three";

import { useLoader } from "@react-three/fiber";

export const SCENE_ASSET_SOURCES = {
  digitAtlas: "/textures/digits.png",
  wood: "/textures/wood.png",
} as const;

type CacheClear = (loader: typeof TextureLoader, input: string) => void;

export function clearSceneAssetCache(clear: CacheClear = useLoader.clear): void {
  clear(TextureLoader, SCENE_ASSET_SOURCES.digitAtlas);
  clear(TextureLoader, SCENE_ASSET_SOURCES.wood);
}
