const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

async function processImage(inputPath, outputPath, isTree = false) {
  console.log(`Processing: ${inputPath}`);
  const img = await Jimp.read(inputPath);
  const w = img.bitmap.width;
  const h = img.bitmap.height;

  // We want to detect background starting from edges using BFS
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
    // Both images have pure white/near-white backgrounds
    // Check if high luminance and low saturation
    const minVal = Math.min(r, g, b);
    const maxVal = Math.max(r, g, b);
    const diff = maxVal - minVal;
    
    // Near white if minVal > 225 and difference between channels is small (< 30)
    // Or very bright white > 245
    if (minVal >= 245) return true;
    if (minVal >= 220 && diff < 28) return true;
    return false;
  }

  // Push all perimeter pixels to queue if candidate
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

  // BFS floodfill
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

  // Apply alpha transparency and anti-aliasing edge softening
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = getIdx(x, y);
      const dataIdx = idx * 4;
      const r = img.bitmap.data[dataIdx];
      const g = img.bitmap.data[dataIdx + 1];
      const b = img.bitmap.data[dataIdx + 2];

      if (visited[idx]) {
        // Pure background
        img.bitmap.data[dataIdx + 3] = 0;
      } else {
        // Check if on boundary of visited background
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
          if (minVal > 200) {
            // Anti-alias edge: scale alpha smoothly
            const factor = (255 - minVal) / 55;
            img.bitmap.data[dataIdx + 3] = Math.round(Math.max(0, Math.min(255, factor * 255)));
          }
        }
      }
    }
  }

  // Optional crop to content bounding box with a small padding
  let minX = w, maxX = 0, minY = h, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = img.bitmap.data[(y * w + x) * 4 + 3];
      if (a > 10) {
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

  console.log(`Cropping to: ${cropX}, ${cropY}, ${cropW}x${cropH}`);
  img.crop({ x: cropX, y: cropY, w: cropW, h: cropH });

  await img.write(outputPath);
  console.log(`Saved transparent asset to: ${outputPath}`);
}

async function main() {
  const treeSource = 'C:/Users/Tram Ngu Ngu/.gemini/antigravity-cli/brain/50d1ae56-42ff-469d-84e7-407beeb3099b/zen_sakura_tree_1789454882005.jpg';
  const boatSource = 'C:/Users/Tram Ngu Ngu/.gemini/antigravity-cli/brain/50d1ae56-42ff-469d-84e7-407beeb3099b/zen_brown_boat_pure_1789454968424.jpg';

  const outDir = path.resolve(__dirname, 'public/images/zen/elements');

  await processImage(treeSource, path.join(outDir, 'cherry_tree.png'), true);
  await processImage(boatSource, path.join(outDir, 'boat.png'), false);

  console.log('Done processing both assets successfully!');
}

main().catch((err) => {
  console.error('Error processing assets:', err);
  process.exit(1);
});
