# Tài liệu Đặc tả Chức năng & Bố cục Website Đặt vé Xem phim (Mô hình Cinestar)

Tài liệu này cung cấp danh sách toàn diện các tính năng, chức năng kỹ thuật và bố cục giao diện (Layout) chi tiết nhằm xây dựng một trang web đặt vé xem phim hoàn chỉnh tương tự hệ thống Cinestar (`cinestar.com.vn`).

---

## PHẦN 1: TÍNH NĂNG VÀ CHỨC NĂNG CỐT LÕI (FEATURES & FUNCTIONALITIES)

### 1. Phân hệ Khách hàng (User Front-end)

#### a. Trang chủ & Tra cứu nhanh (Home & Quick Search)
* **Banner Quảng cáo (Hero Slider):** Trình chiếu các banner phim bom tấn mới nhất, chương trình khuyến mãi, sự kiện đặc biệt.
* **Thanh Tra Cứu Nhanh (Quick Booking Bar):** Cho phép người dùng lọc nhanh suất chiếu theo thứ tự: *Chọn phim -> Chọn rạp -> Chọn ngày -> Chọn suất*.
* **Phân loại Phim:** 
  * Phim đang chiếu (Now Showing).
  * Phim sắp chiếu (Coming Soon).
  * Suất chiếu sớm / Sneakshow.
* **Bảng tin & Khuyến mãi (News & Promotions):** Hiển thị các sự kiện, ưu đãi giá vé, combo bắp nước.

#### b. Chi tiết Phim (Movie Detail Page)
* **Thông tin định danh:** Poster chính, Video Trailer (tích hợp YouTube Player), Tóm tắt nội dung, Đạo diễn, Diễn viên, Thể loại, Thời lượng, Ngôn ngữ, Ngày khởi chiếu và **Nhãn độ tuổi** (P, K, T13, T18,...).
* **Lịch chiếu theo rạp:** Lọc lịch chiếu theo từng cụm rạp và từng ngày cụ thể trong tuần.

#### c. Hệ thống Đặt vé Trực tuyến (Booking Flow)
* **Bước 1 - Chọn Suất Chiếu:** Hiển thị danh sách rạp, định dạng phòng chiếu (2D, 3D, IMAX...), suất chiếu cụ thể.
* **Bước 2 - Sơ đồ Ghế Ngồi (Seat Map Layout):**
  * Phân loại ghế trực quan: Ghế Thường, Ghế VIP, Ghế Đôi (Sweetbox).
  * Trạng thái ghế: Ghế trống, Ghế đang chọn (giữ chỗ tạm thời), Ghế đã có người đặt.
  * Tự động tính tiền dựa trên loại ghế và ngày trong tuần.
* **Bước 3 - Chọn Bắp Nước (F&B Selection):**
  * Danh sách các combo bắp + nước ngọt hoặc mua lẻ kèm hình ảnh, mô tả và giá tiền.
* **Bước 4 - Xác nhận & Thanh toán (Payment Gateway):**
  * Nhập thông tin khách hàng (Họ tên, SĐT, Email).
  * Nhập mã giảm giá / Voucher / Thẻ thành viên.
  * Tích hợp cổng thanh toán trực tuyến: VNPay, Momo, ZaloPay, Thẻ ATM nội địa, Thẻ quốc tế (Visa/Mastercard).
* **Bước 5 - Hoàn tất & Xuất vé:**
  * Hiển thị mã vé (Booking Code) và mã QR Code trên màn hình, đồng thời gửi vé điện tử qua Email/SMS.

#### d. Hệ thống Rạp (Cinemas Page)
* Danh sách toàn bộ các cụm rạp trên toàn quốc.
* Xem chi tiết thông tin rạp: Địa chỉ bản đồ, số điện thoại, tiện ích đi kèm và lịch chiếu riêng của rạp đó.

#### e. Tài khoản Thành viên (Member & Auth)
* **Xác thực:** Đăng ký / Đăng nhập tài khoản bằng Số điện thoại / Email.
* **Hạng thành viên:** Quản lý điểm tích lũy (Loyalty Points), ưu đãi sinh nhật, hạng thẻ (C'Friend, C'VIP).
* **Lịch sử giao dịch:** Xem lại danh sách các vé đã đặt thành công và lịch sử tích điểm.

---

### 2. Phân hệ Quản trị (Admin Dashboard)
* **Quản lý Phim:** Thêm, sửa, xóa thông tin phim, poster, trailer, thời lượng, phân loại độ tuổi.
* **Quản lý Rạp & Phòng chiếu:** Cấu hình sơ đồ ghế ngồi cho từng phòng chiếu (số hàng, số cột, loại ghế).
* **Quản lý Suất chiếu:** Lên lịch chiếu phim theo ngày/giờ, gán giá vé linh hoạt theo khung giờ hoặc ngày lễ.
* **Quản lý F&B:** Thêm/sửa các món bắp nước và combo.
* **Quản lý Doanh thu & Báo cáo:** Thống kê vé bán ra, doanh thu theo ngày/tháng/năm.
* **Soát vé (Check-in):** Quét mã QR vé tại cửa rạp để check-in khách hàng.

---

## PHẦN 2: BỐ CỤC TRANG WEB (WEBSITE LAYOUT STRUCTURE)

Dưới đây là cấu trúc bố cục chi tiết cho từng trang chính của website:

### 1. Bố cục Trang chủ (Home Page Layout)
* **Header (Đầu trang - Cố định/Sticky):**
  * *Bên trái:* Logo thương hiệu Cinestar.
  * *Khu vực giữa:* Thanh điều hướng chính (*Trang chủ, Lịch chiếu, Hệ thống rạp, Khuyến mãi, Giá vé, Giới thiệu*).
  * *Bên phải:* Nút đăng nhập/đăng ký, Nút "Đặt vé nhanh", Icon chọn ngôn ngữ (VI/EN).
* **Hero Section (Slider Banner):** Banner quảng cáo lớn chạy slide tự động ở giữa màn hình.
* **Quick Booking Filter (Thanh tra cứu nhanh):** Khung chứa 4 dropdown hoặc ô chọn nhanh: `[ Chọn Phim ] -> [ Chọn Rạp ] -> [ Chọn Ngày ] -> [ Chọn Suất ]` kèm nút "ĐẶT VÉ NGAY".
* **Section: Phim Đang Chiếu (Now Showing):**
  * Tiêu đề mục rõ ràng kèm tab chuyển đổi "Phim đang chiếu" / "Phim sắp chiếu".
  * Lưới hiển thị các thẻ phim (Movie Cards): Poster phim, Nhãn tuổi, Tên phim, Thể loại, Nút "Chi tiết" và Nút "Mua vé".
* **Section: Khuyến mãi & Sự kiện (Promotions):**
  * Lưới các thẻ tin tức khuyến mãi, ưu đãi ngân hàng, combo giá hời.
* **Footer (Chân trang):**
  * Thông tin công ty, địa chỉ trụ sở, giấy phép kinh doanh.
  * Liên kết mạng xã hội (Facebook, YouTube, Instagram, TikTok).
  * Chính sách bảo mật, Điều khoản sử dụng, Thông tin liên hệ.

### 2. Bố cục Trang Chi tiết Phim (Movie Detail Layout)
* **Breadcrumb Navigation:** Điều hướng đường dẫn (Trang chủ > Phim > Tên phim).
* **Main Content Area (Chia 2 cột):**
  * *Cột trái (30%):* Poster phim kích thước lớn, nhãn độ tuổi rõ ràng, Nút gọi Trailer (mở Pop-up Video).
  * *Cột phải (70%):* 
    * Tên phim (Tiếng Việt & Tiếng Anh).
    * Thông tin chi tiết: Đạo diễn, Diễn viên, Thể loại, Thời lượng, Khởi chiếu.
    * Tóm tắt nội dung phim (Synopsis).
    * Khu vực chọn lịch chiếu theo rạp (Tab chọn rạp và danh sách giờ chiếu).

### 3. Bố cục Trang Đặt Vé (Booking Flow Layout - Giao diện từng bước)
* **Stepper Header:** Thanh tiến trình hiển thị các bước đang thực hiện (1. Chọn suất -> 2. Chọn ghế -> 3. Chọn bắp nước -> 4. Thanh toán -> 5. Hoàn tất).
* **Bước 2 (Sơ đồ ghế - Layout đặc biệt):**
  * *Khu vực chính giữa:* Màn hình chiếu (Screen) ở trên cùng. Dưới là sơ đồ ghế ngồi ma trận (Ghế thường, VIP, Sweetbox) với trạng thái màu sắc rõ ràng (Trống, Đang chọn, Đã bán).
  * *Khu vực bên phải (Thanh tóm tắt đơn hàng - Sidebar):* Hiển thị thông tin phim, rạp, suất chiếu, số ghế đã chọn, danh sách bắp nước và tổng tiền tạm tính. Nút "Tiếp tục".
* **Bước 4 (Thanh toán):**
  * *Cột trái:* Form nhập thông tin cá nhân (Họ tên, SĐT, Email) và danh sách phương thức thanh toán (QR Code VNPay, Momo, Thẻ ngân hàng).
  * *Cột phải:* Hóa đơn chi tiết tóm tắt toàn bộ số tiền cần thanh toán và nút "Xác nhận thanh toán".

---

## PHẦN 3: ĐỀ XUẤT CÔNG NGHỆ (TECH STACK)
* **Front-end:** React.js / Next.js kết hợp Tailwind CSS để xây dựng giao diện mượt mà, tối ưu trên cả Desktop và Mobile.
* **Back-end:** Node.js (Express) hoặc Java (Spring Boot) xử lý logic nghiệp vụ và bảo mật thanh toán.
* **Database:** PostgreSQL hoặc MySQL (hỗ trợ transaction để tránh việc 2 khách hàng đặt trùng 1 ghế cùng thời điểm).