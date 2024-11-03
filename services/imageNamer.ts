import path from "path";
import { Namer } from "@parcel/plugin";

export default new Namer({
  name({ bundle }) {
    const type = bundle.type;

    if (type === "png" || type === "jpg" || type === "webp" || type === "avif") {
      const entry = bundle.getMainEntry();

      if (entry) {
        const filePath = entry.filePath;
        const query = entry.query;

        const fileName = path.basename(filePath);
        const as = query.get("as") || "";
        const width = query.get("width") || "";
        const height = query.get("height") || "";

        const postfix = path.parse(entry.env.loc?.filePath || "").ext.slice(1);

        return getName(type, fileName, as, width, height, postfix);
      }
    }

    // Allow the next namer to handle this bundle.
    return null;
  },
});

export function getImageName(url: URL) {
  const fileName = path.basename(url.href.split("?")[0]);
  const query = url.searchParams;

  const as = query.get("as") || "";
  const width = query.get("width") || "";
  const height = query.get("height") || "";

  const type = as || path.parse(fileName).ext.slice(1);

  return getName(type, fileName, as, width, height, "html");
}

function getName(type: string, fileName: string, as?: string, width?: string, height?: string, postfix?: string) {
  const file = path.parse(fileName);

  if (!as && !width && !height) return `${file.name}${postfix ? `-${postfix}` : ""}.${type}`;
  if (!width && !height) return `${file.name}${postfix ? `-${postfix}` : ""}.${type}`;

  return `${file.name}-${width}x${height}${postfix ? `-${postfix}` : ""}.${type}`;
}
