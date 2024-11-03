import { RenderingData } from "../types.d.ts";

export function setRenderingData(renderingData: Partial<RenderingData>, url: string) {
  // @ts-expect-error Set rendering data for router and hooks to fetch data
  global.window = { RENDERING_DATA: renderingData, location: { href: url } };
}

export function getRenderingData(): RenderingData {
  // @ts-expect-error Get rendering data for data fetch hooks
  return window?.RENDERING_DATA || {};
}

export function removeRenderingData(key: keyof RenderingData) {
  // @ts-expect-error Remove rendering data for data fetch hooks
  delete window.RENDERING_DATA[key];
}
