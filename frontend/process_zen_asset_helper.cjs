const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

/**
 * Xử lý tách nền trắng, làm mềm viền (anti-aliasing) và tự động crop sát viền vật thể.
 * @param {string} inputPath - Đường dẫn file ảnh gốc JPG/PNG
 * @param {string} outputFilename - Tên file lưu tại frontend/public/images/zen/elements/
 */
async function processZenAsset(inputPath, outputFilename) {
  console.log(`[ZenAssetProcessor] Bắt đầu xử lý: ${inputPath} -> ${outputFilename}`);
  const img = await Jimp.read(inputPath);
  const w = img.bitmap.width;
  const h = img.bitmap.height;

  const visited = new Uint8Array(w * h);
  const queue = [];

  function getIdx(x, y) {
    return y * w + x;
  }

  function getPixel(x, y) {
    const idx = (y * w + x) * 4;
    return {
      r: img.bitmap.data[idx],
      g: img.bitmap.data[idx + 1],
      b: img.bitmap.data[idx + 2],
      a: img.bitmap.data[idx + 3],
    };
  }

  function isBackgroundCandidate(r, g, b) {
    const minVal = Math.min(r, g, b);
    const maxVal = Math.max(r, g, b);
    const diff = maxVal - minVal;

    // Nền trắng tinh khiết hoặc trắng sáng bão hòa thấp
    if (minVal >= 242) return true;
    if (minVal >= 215 && diff < 30) return true;
    return false;
  }

  // Khởi tạo hàng đợi BFS từ 4 cạnh ngoài cùng
  for (let x = 0; x < w; x++) {
    const pTop = getPixel(x, 0);
    if (isBackgroundCandidate(pTop.r, pTop.g, pTop.b)) {
      visited[getIdx(x, 0)] = 1;
      queue.push([x, 0]);
    }
    const pBottom = getPixel(x, h - 1);
    if (isBackgroundCandidate(pBottom.r, pBottom.g, pBottom.b)) {
      visited[getIdx(x, h - 1)] = 1;
      queue.push([x, h - 1]);
    }
  }

  for (let y = 0; y < h; y++) {
    const pLeft = getPixel(0, y);
    if (isBackgroundCandidate(pLeft.r, pLeft.g, pLeft.b)) {
      visited[getIdx(0, y)] = 1;
      queue.push([0, y]);
    }
    const pRight = getPixel(w - 1, y);
    if (isBackgroundCandidate(pRight.r, pRight.g, pRight.b)) {
      visited[getIdx(w - 1, y)] = 1;
      queue.push([w - 1, y]);
    }
  }

  // BFS Loang tìm toàn bộ vùng nền kết nối với các cạnh
  let head = 0;
  const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (head < queue.length) {
    const [cx, cy] = queue[head++];
    for (const [dx, dy] of neighbors) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const nIdx = getIdx(nx, ny);
        if (!visited[nIdx]) {
          const np = getPixel(nx, ny);
          if (isBackgroundCandidate(np.r, np.g, np.b)) {
            visited[nIdx] = 1;
            queue.push([nx, ny]);
          }
        }
      }
    }
  }

  // Đặt Alpha trong suốt và làm mịn viền (Anti-aliasing mềm mại)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = getIdx(x, y);
      const dataIdx = idx * 4;
      const r = img.bitmap.data[dataIdx];
      const g = img.bitmap.data[dataIdx + 1];
      const b = img.bitmap.data[dataIdx + 2];

      if (visited[idx]) {
        // Nền hoàn toàn trong suốt
        img.bitmap.data[dataIdx + 3] = 0;
      } else {
        let nearVisited = false;
        for (const [dx, dy] of neighbors) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h && visited[getIdx(nx, ny)]) {
            nearVisited = true;
            break;
          }
        }

        if (nearVisited) {
          const minVal = Math.min(r, g, b);
          if (minVal > 195) {
            const factor = (255 - minVal) / 60;
            img.bitmap.data[dataIdx + 3] = Math.round(Math.max(0, Math.min(255, factor * 255)));
          }
        }
      }
    }
  }

  // Tính Bounding Box để crop sát viền vật thể với một chút padding
  let minX = w, maxX = 0, minY = h, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = img.bitmap.data[(y * w + x) * 4 + 3];
      if (a > 15) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const pad = 12;
  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);
  const cropW = Math.min(w - cropX, maxX - minX + pad * 2);
  const cropH = Math.min(h - cropY, maxY - minY + pad * 2);

  if (cropW > 10 && cropH > 10) {
    img.crop({ x: cropX, y: cropY, w: cropW, h: cropH });
  }

  const outDir = path.resolve(__dirname, 'public/images/zen/elements');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outputPath = path.join(outDir, outputFilename);
  await img.write(outputPath);
  console.log(`[ZenAssetProcessor] ✅ Đã xuất thành công file PNG trong suốt: ${outputPath}`);
  return outputPath;
}

// Cho phép chạy từ CLI: node process_zen_asset_helper.cjs <input_path> <output_filename>
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node process_zen_asset_helper.cjs <inputPath> <outputFilename>');
    process.exit(1);
  }
  processZenAsset(args[0], args[1])
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[ZenAssetProcessor] ❌ Lỗi:', err);
      process.exit(1);
    });
}

module.exports = { processZenAsset };
