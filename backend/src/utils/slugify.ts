/**
 * Chuyển đổi chuỗi tiếng Việt / tiếng Anh thành slug URL thân thiện
 * Ví dụ: "Các Loại Hoa" -> "cac-loai-hoa"
 * "Từ vựng IELTS Band 7.0+" -> "tu-vung-ielts-band-70"
 */
export function slugify(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '') // Bỏ ký tự đặc biệt
    .trim()
    .replace(/[\s_]+/g, '-') // Đổi khoảng trắng và gạch dưới thành gạch nối
    .replace(/-+/g, '-') // Gộp nhiều gạch nối liên tiếp
    .replace(/^-+|-+$/g, ''); // Cắt gạch nối ở đầu và cuối
}
