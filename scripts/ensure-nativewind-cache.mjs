import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const cacheDir = path.join(projectRoot, "node_modules", "react-native-css-interop", ".cache");
const webCssPath = path.join(cacheDir, "web.css");

fs.mkdirSync(cacheDir, { recursive: true });
if (!fs.existsSync(webCssPath)) {
  fs.writeFileSync(webCssPath, "", "utf8");
}

console.log(`[nativewind-cache] ready: ${path.relative(projectRoot, webCssPath)}`);
