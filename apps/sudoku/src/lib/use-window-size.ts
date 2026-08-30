import { useEffect, useState } from 'react';

/** Stands in for react-native's useWindowDimensions. */
export function useWindowSize(): { readonly width: number; readonly height: number } {
  const [size, setSize] = useState(() => ({
    width: typeof window === 'undefined' ? 0 : window.innerWidth,
    height: typeof window === 'undefined' ? 0 : window.innerHeight,
  }));

  useEffect(() => {
    const onResize = (): void => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return size;
}
