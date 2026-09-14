/**
 * Tạo tiêu đề gọn gàng, thông minh cho bản sao của bộ thẻ:
 * - Thay vì lặp lại: "Tiếng Anh (Bản sao) (Bản sao) (Bản sao)"
 * - Tự động rút gọn và đánh số:
 *   + Bản sao đầu tiên: "Tiếng Anh (Bản sao)"
 *   + Bản sao thứ 2: "Tiếng Anh (Bản sao 2)"
 *   + Bản sao thứ 3: "Tiếng Anh (Bản sao 3)"
 * - Hỗ trợ cả tiếng Anh (Copy, Copy 2,...) và loại bỏ các hậu tố trùng lặp.
 */
export function getClonedDeckTitle(
  originalTitle: string,
  existingTitles: string[] = [],
  isVi: boolean = true
): string {
  const copyWord = isVi ? 'Bản sao' : 'Copy';

  // 1. Loại bỏ tất cả hậu tố bản sao cũ nếu có (cả tiếng Việt lẫn tiếng Anh)
  let baseTitle = (originalTitle || '').trim();
  const copyPattern = /\s*\((?:bản\s*sao|copy)(?:\s*\d+)?\)\s*$/i;
  while (copyPattern.test(baseTitle)) {
    baseTitle = baseTitle.replace(copyPattern, '').trim();
  }

  if (!baseTitle) {
    baseTitle = isVi ? 'Bộ thẻ' : 'Deck';
  }

  const lowerExisting = new Set(existingTitles.map((t) => t.trim().toLowerCase()));

  // 2. Ứng viên đầu tiên: "Tiêu đề (Bản sao)"
  const firstCandidate = `${baseTitle} (${copyWord})`;
  if (!lowerExisting.has(firstCandidate.toLowerCase())) {
    return firstCandidate;
  }

  // 3. Nếu đã có, tự động tìm số tiếp theo: (Bản sao 2), (Bản sao 3),...
  let counter = 2;
  while (counter <= 999) {
    const candidate = `${baseTitle} (${copyWord} ${counter})`;
    if (!lowerExisting.has(candidate.toLowerCase())) {
      return candidate;
    }
    counter++;
  }

  return `${baseTitle} (${copyWord} ${Date.now().toString().slice(-4)})`;
}
