# 🌸 BẢNG THEO DÕI TIẾN ĐỘ TẠO ẢNH CẢNH VẬT ZEN GARDEN (ZEN ASSETS TRACKER)

> [!NOTE] 
> Bảng này lưu trữ toàn bộ trạng thái, tiến độ, câu lệnh Prompt và thông số kỹ thuật để tạo ảnh cho các Cõi trong Zen Garden. Dữ liệu này được lưu cố định trong hệ thống tại `ZEN_ASSETS_TRACKER.md` để nếu quá trình tạo ảnh tạm dừng (do chạm giới hạn hạn ngạch API hoặc cần nghỉ), bạn và AI luôn có thể tiếp tục tạo ảnh ngay lập tức ở phiên làm việc tiếp theo mà không bị thất thoát bất kỳ thông tin nào.

---

## 📊 BẢNG TỔNG QUAN TIẾN ĐỘ 8 CÕI

| Cõi | Tên Cõi | Thần Thú | Số Món Đặc Thù | Đã Xong | Còn Lại | Trạng Thái Hiện Tại |
|---|---|---|:---:|:---:|:---:|:---:|
| **Cõi 1** | Hồ Sen Trăng Khuyết | Bướm Tiên | 18 món cơ bản | 18/18 | 0 | ✅ **Đã hoàn thành** |
| **Cõi 2** | Rừng Trúc Hoàng Hôn | Sen Bích Nguyệt | 4 món | 4/4 | 0 | ✅ **Đã hoàn thành** |
| **Cõi 3** | Long Môn Vượt Thác | Long Ngư | 4 món (2 mới + 2 tái dùng) | 4/4 | 0 | ✅ **Đã hoàn thành** |
| **Cõi 4** | Rừng Nấm Dạ Quang Đêm Sao | Hươu Thần Ánh Sao | 5 món | 5/5 | 0 | ✅ **Đã hoàn thành 100% (5 ảnh mới)** |
| **Cõi 5** | Xứ Sở Tuyết Trắng Mùa Đông | Băng Phượng Hoàng | 5 món | 5/5 | 0 | ✅ **Đã hoàn thành 100% (5 ảnh mới)** |
| **Cõi 6** | Thung Lũng Anh Đào Sương Mai | Cửu Vĩ Linh Hồ | 2 món | 2/2 | 0 | ✅ **Đã hoàn thành 100% (2 ảnh mới)** |
| **Cõi 7** | Bãi Biển Thiên Đường & San Hô | Thần Long Biển | 5 món | 0/5 | 5 | ⏳ **Sẵn sàng tạo tiếp (Đã có sẵn prompt & thông số)** |
| **Cõi 8** | Khởi Nguyên Thần Mộc | Thần Mộc Cổ Đại | 3 món | 0/3 | 3 | ⏳ **Sẵn sàng tạo tiếp (Đã có sẵn prompt & thông số)** |

* **Tổng số ảnh vật phẩm độc nhất ban đầu:** 20 ảnh
* **Đã tạo thêm và tích hợp thành công hôm nay:** **+12 ảnh PNG trong suốt chất lượng cao**
* **Số lượng ảnh vật phẩm hiện tại:** **32 ảnh độc nhất** (Cõi 1, 2, 3, 4, 5, 6 đều đã có ảnh độc bản riêng!)
* **Số lượng ảnh còn lại cần tạo (Cõi 7 & Cõi 8):** **8 ảnh**

---

## 🎨 CHI TIẾT TỪNG CÕI VÀ TRẠNG THÁI

### ✅ CÕI 4: RỪNG NẤM DẠ QUANG ĐÊM SAO (`midnight_stars`) — [100% HOÀN THÀNH]
Toàn bộ 5 ảnh đã được AI sinh, chạy thuật toán tách nền trong suốt mềm viền và tích hợp vào mã nguồn `ZenBuilder.tsx`:

1. **Chòi Nấm Dạ Quang Cổ Tích (`tea_house`)**:
   - File: `frontend/public/images/zen/elements/mushroom_cottage.png`
   - Kích thước: `width: 175, height: 180, xOffset: -87.5, yOffset: -150, shadowRx: 70, shadowRy: 20`
   - Icon: 🍄 | Trạng thái: ✅ Đã tích hợp

2. **Khóm Nấm Phát Sáng & Thỏ Con Ánh Sao (`bamboo_fountain`)**:
   - File: `frontend/public/images/zen/elements/glowing_mushrooms_bunny.png`
   - Kích thước: `width: 135, height: 140, xOffset: -67.5, yOffset: -120, shadowRx: 55, shadowRy: 16`
   - Icon: 🐰 | Trạng thái: ✅ Đã tích hợp

3. **Đèn Cầu Tinh Tú & Đom Đóm Dạ Quang (`stone_lantern`)**:
   - File: `frontend/public/images/zen/elements/starfire_orb_lantern.png`
   - Kích thước: `width: 95, height: 130, xOffset: -47.5, yOffset: -115, shadowRx: 30, shadowRy: 10`
   - Icon: ✨ | Trạng thái: ✅ Đã tích hợp

4. **Bè Thả Đèn Đom Đóm Đêm Sao (`wooden_boat`)**:
   - File: `frontend/public/images/zen/elements/firefly_river_raft.png`
   - Kích thước: `width: 150, height: 105, xOffset: -75, yOffset: -52, shadowRx: 68, shadowRy: 18`
   - Icon: 🛶 | Trạng thái: ✅ Đã tích hợp

5. **Thảm Rêu Phát Sáng & Hoa Sao Li Ti (`wild_flower_bed`)**:
   - File: `frontend/public/images/zen/elements/stardust_moss_meadow.png`
   - Kích thước: `width: 120, height: 110, xOffset: -60, yOffset: -95, shadowRx: 50, shadowRy: 16`
   - Icon: 🌸 | Trạng thái: ✅ Đã tích hợp

---

### ✅ CÕI 5: XỨ SỞ TUYẾT TRẮNG MÙA ĐÔNG (`glacial_phoenix_crest`) — [100% HOÀN THÀNH]
Toàn bộ 5 ảnh đã được sinh và tích hợp hoàn chỉnh:

6. **Ngôi Nhà Gỗ Ấm Cúng Phủ Tuyết Trắng (`tea_house`)**:
   - File: `frontend/public/images/zen/elements/winter_snow_cabin.png`
   - Kích thước: `width: 180, height: 175, xOffset: -90, yOffset: -145, shadowRx: 72, shadowRy: 20`
   - Icon: 🏡 | Trạng thái: ✅ Đã tích hợp

7. **Chú Người Tuyết Xinh Xắn Khăn Len Đỏ (`bamboo_fountain`)**:
   - File: `frontend/public/images/zen/elements/red_scarf_snowman.png`
   - Kích thước: `width: 115, height: 135, xOffset: -57.5, yOffset: -120, shadowRx: 45, shadowRy: 15`
   - Icon: ⛄ | Trạng thái: ✅ Đã tích hợp

8. **Trụ Đèn Bão Mùa Đông Phủ Tuyết (`stone_lantern`)**:
   - File: `frontend/public/images/zen/elements/frosted_lantern_post.png`
   - Kích thước: `width: 85, height: 125, xOffset: -42.5, yOffset: -110, shadowRx: 26, shadowRy: 9`
   - Icon: 🏮 | Trạng thái: ✅ Đã tích hợp

9. **Xe Trượt Tuyết Gỗ Mộc Mùa Đông (`wooden_boat`)**:
   - File: `frontend/public/images/zen/elements/timber_winter_sleigh.png`
   - Kích thước: `width: 145, height: 100, xOffset: -72.5, yOffset: -50, shadowRx: 65, shadowRy: 18`
   - Icon: 🛷 | Trạng thái: ✅ Đã tích hợp

10. **Tảng Đá Phủ Tuyết & Hoa Tuyết Li Ti (`wild_flower_bed`)**:
    - File: `frontend/public/images/zen/elements/snow_rocks_blossoms.png`
    - Kích thước: `width: 125, height: 110, xOffset: -62.5, yOffset: -95, shadowRx: 52, shadowRy: 16`
    - Icon: ❄️ | Trạng thái: ✅ Đã tích hợp

---

### ✅ CÕI 6: THUNG LŨNG ANH ĐÀO SƯƠNG MAI (`sakura_valley`) — [100% HOÀN THÀNH]
Toàn bộ 2 ảnh đặc thù đã được sinh và tích hợp:

11. **Lạc Anh Đình Bên Suối Đào (`tea_house`)**:
    - File: `frontend/public/images/zen/elements/fallen_petals_pavilion.png`
    - Kích thước: `width: 185, height: 180, xOffset: -92.5, yOffset: -150, shadowRx: 75, shadowRy: 20`
    - Icon: 🏯 | Trạng thái: ✅ Đã tích hợp

12. **Thuyền Hoa Đào Du Xuân (`wooden_boat`)**:
    - File: `frontend/public/images/zen/elements/sakura_blossom_boat.png`
    - Kích thước: `width: 145, height: 105, xOffset: -72.5, yOffset: -52, shadowRx: 65, shadowRy: 18`
    - Icon: 🛶 | Trạng thái: ✅ Đã tích hợp

---

### ⏳ CÕI 7: BÃI BIỂN THIÊN ĐƯỜNG & ĐẢO SAN HÔ (`celestial_peaks`) — [CHỜ TẠO Ở PHIÊN SAU]

Dữ liệu prompt và thông số đã chuẩn bị sẵn 100%, chỉ cần gọi lệnh sinh ảnh:

#### 13. Chòi Nghỉ Mái Lá Cọ Ven Biển (`tea_house`)
- **Tên tiếng Anh:** Tropical Seaside Cabana
- **File đích:** `frontend/public/images/zen/elements/tropical_seaside_cabana.png`
- **Icon:** 🏖️ | **Trạng thái:** ⏳ Chờ tạo ảnh
- **Kích thước:** `width: 180, height: 175, xOffset: -90, yOffset: -145, shadowRx: 72, shadowRy: 20`
- **Prompt:**
  > Isolated game asset, 2.5D isometric fantasy resort architecture. A breezy tropical seaside wooden gazebo cabana built on bamboo stilts, with a lush thatched palm leaf roof, sheer white linen curtains tied gently to the wooden posts, furnished with a rustic bamboo lounge bench. Crisp clean edges on pure white background.

#### 14. Rạn Đá San Hô & Vỏ Ốc Ngọc Trai (`bamboo_fountain`)
- **Tên tiếng Anh:** Coral Reef & Pearl Seashells
- **File đích:** `frontend/public/images/zen/elements/coral_reef_shells.png`
- **Icon:** 🐚 | **Trạng thái:** ⏳ Chờ tạo ảnh
- **Kích thước:** `width: 130, height: 140, xOffset: -65, yOffset: -120, shadowRx: 55, shadowRy: 16`
- **Prompt:**
  > Isolated game asset, 2.5D fantasy game art. A beautiful vibrant natural marine coral cluster with pastel pink, turquoise, and golden sea fans, adorned with a large open pearlescent sea shell revealing a softly glowing lustrous ocean pearl, with a friendly tiny orange starfish resting on the reef. Crisp clean edges on pure white background.

#### 15. Hải Đăng Đá Cổ Kính Ven Bờ (`stone_lantern`)
- **Tên tiếng Anh:** Coastal Stone Beacon Lighthouse
- **File đích:** `frontend/public/images/zen/elements/coastal_stone_beacon.png`
- **Icon:** 🗼 | **Trạng thái:** ⏳ Chờ tạo ảnh
- **Kích thước:** `width: 85, height: 135, xOffset: -42.5, yOffset: -120, shadowRx: 28, shadowRy: 10`
- **Prompt:**
  > Isolated game asset, 2.5D game art. A miniature weathered white-and-cobalt stone lighthouse beacon, standing firmly on natural sea-smoothed rocks, with its top glass chamber casting a warm brilliant guiding beam of light. Crisp clean edges on pure white background.

#### 16. Thuyền Buồm Mộc Lướt Sóng Biển Xanh (`wooden_boat`)
- **Tên tiếng Anh:** Tropical Wooden Sailboat
- **File đích:** `frontend/public/images/zen/elements/tropical_sailboat.png`
- **Icon:** ⛵ | **Trạng thái:** ⏳ Chờ tạo ảnh
- **Kích thước:** `width: 150, height: 130, xOffset: -75, yOffset: -75, shadowRx: 65, shadowRy: 18`
- **Prompt:**
  > Isolated game asset, 2.5D isometric view. A handcrafted wooden sailing dinghy with warm teak wood deck, a tall mast hoisting a clean crisp cream-white canvas sail gently billowing in the ocean breeze, nautical rope rigging. Crisp clean edges on pure white background.

#### 17. Hàng Dừa Nhiệt Đới Nghiêng Bóng (`cherry_tree`)
- **Tên tiếng Anh:** Swaying Tropical Coconut Palms
- **File đích:** `frontend/public/images/zen/elements/tropical_coconut_palms.png`
- **Icon:** 🥥 | **Trạng thái:** ⏳ Chờ tạo ảnh
- **Kích thước:** `width: 165, height: 180, xOffset: -82.5, yOffset: -155, shadowRx: 65, shadowRy: 18`
- **Prompt:**
  > Isolated game asset, 2.5D game art. A pair of graceful tropical coconut palm trees curving naturally with wind, lush rich green feathered fronds, heavy clusters of ripe coconuts beneath the crown, rooted into a patch of soft golden beach sand. Crisp clean edges on pure white background.

---

### ⏳ CÕI 8: KHỞI NGUYÊN THẦN MỘC (`cosmic_world_tree`) — [CHỜ TẠO Ở PHIÊN SAU]

#### 18. Đại Điện Kim Các Vô Cực (`tea_house`)
- **Tên tiếng Anh:** Infinite Golden Celestial Hall
- **File đích:** `frontend/public/images/zen/elements/infinite_celestial_hall.png`
- **Icon:** 🏛️ | **Trạng thái:** ⏳ Chờ tạo ảnh
- **Kích thước:** `width: 195, height: 190, xOffset: -97.5, yOffset: -160, shadowRx: 75, shadowRy: 22`
- **Prompt:**
  > Isolated game asset, 2.5D isometric celestial Asian grand temple architecture. A majestic sacred hall with tiered gilded jade roofs, intricate gold-plated columns carved with dragon motifs, glowing cosmic runes floating gently above the eaves, resting upon a floating heavenly cloud terrace. Crisp clean edges on pure white background.

#### 19. Pháp Đăng Hoàng Kim Vô Thượng (`stone_lantern`)
- **Tên tiếng Anh:** Supreme Golden Dharma Lantern
- **File đích:** `frontend/public/images/zen/elements/golden_dharma_lantern.png`
- **Icon:** ☀️ | **Trạng thái:** ⏳ Chờ tạo ảnh
- **Kích thước:** `width: 85, height: 130, xOffset: -42.5, yOffset: -115, shadowRx: 28, shadowRy: 10`
- **Prompt:**
  > Isolated game asset, 2.5D game art. A sacred ornate oriental dharma beacon forged from pure glowing celestial gold, engraved with divine beast insignias, its center holding a miniature radiant sun orb emitting warm solar golden rays and subtle cosmic star dust. Crisp clean edges on pure white background.

#### 20. Chiến Thuyền Long Vân Bát Nhã (`wooden_boat`)
- **Tên tiếng Anh:** Celestial Prajna Cloud Barge
- **File đích:** `frontend/public/images/zen/elements/celestial_cloud_barge.png`
- **Icon:** ✨ | **Trạng thái:** ⏳ Chờ tạo ảnh
- **Kích thước:** `width: 160, height: 120, xOffset: -80, yOffset: -65, shadowRx: 70, shadowRy: 18`
- **Prompt:**
  > Isolated game asset, 2.5D isometric view. A mystical golden dragon cloud ship barge, carved from sacred ancient ironwood with gold dragon head figurehead at the prow, stylized swirling cloud carvings along the hull, sailing upon ethereal mist and cosmic starlight. Crisp clean edges on pure white background.

---

## 🚀 HƯỚNG DẪN TIẾP TỤC Ở PHIÊN TIẾP THEO

Khi mở phiên làm việc mới (hoặc sau khi hạn ngạch reset):
1. Yêu cầu AI: *"Tiếp tục tạo ảnh cho Cõi 7 và Cõi 8 dựa theo tài liệu ZEN_ASSETS_TRACKER.md"*.
2. AI chỉ cần đọc prompt đã có sẵn trong bảng này, gọi `generate_image`, chạy `node frontend/process_zen_asset_helper.cjs <ảnh_gốc> <tên_file>` và tích hợp vào `REALM_ITEM_OVERRIDES` trong `ZenBuilder.tsx`.
3. Mọi thứ sẽ tự động hoàn tất trọn vẹn 100% mà không cần phải thiết kế lại từ đầu!
