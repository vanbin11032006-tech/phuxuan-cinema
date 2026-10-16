<?php
declare(strict_types=1);
?>
<!doctype html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#10100f">
    <meta name="description" content="Phú Xuân Cinema — chạm vào thế giới điện ảnh. Đặt vé xem phim trực tuyến nhanh chóng.">
    <title>Phú Xuân Cinema — Chạm vào thế giới điện ảnh</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/app.css">
    <script src="assets/js/app.js" defer></script>
</head>
<body>
    <div class="topline"><span>PHÚ XUÂN CINEMA</span><span>ĐIỆN ẢNH — VĂN HÓA — TRẢI NGHIỆM</span><span>HUẾ · VIỆT NAM</span></div>
    <header class="site-header">
        <a class="brand" href="#home" aria-label="Phú Xuân Cinema trang chủ">
            <span class="brand-mark">PX</span>
            <span class="brand-name">PHÚ XUÂN<span>CINEMA</span></span>
        </a>
        <button class="menu-toggle" id="menu-toggle" aria-label="Mở menu">☰</button>
        <nav class="main-nav" id="main-nav">
            <a href="#home" class="active">Trang chủ</a>
            <a href="#movies">Phim</a>
            <a href="#schedule">Lịch chiếu</a>
            <a href="#cinemas">Rạp chiếu</a>
            <a href="#promotions">Ưu đãi</a>
        </nav>
        <div class="header-actions">
            <button class="text-button" id="account-button">Đăng nhập</button>
            <a class="button button-gold button-small" href="#schedule">Đặt vé <span>↗</span></a>
        </div>
    </header>

    <main id="app-main">
        <section class="hero" id="home">
            <div class="hero-image"></div>
            <div class="hero-content container">
                <div class="eyebrow"><span class="eyebrow-line"></span> MỘT TRẢI NGHIỆM ĐIỆN ẢNH KHÁC BIỆT</div>
                <h1>Để cảm xúc<br><em>lên màn ảnh.</em></h1>
                <p>Những câu chuyện tuyệt vời, ngay tại thành phố của bạn.</p>
                <div class="hero-buttons">
                    <a class="button button-gold" href="#movies">Khám phá phim <span>↗</span></a>
                    <a class="button button-outline" href="#schedule">Lịch chiếu hôm nay</a>
                </div>
                <div class="hero-note"><span class="live-dot"></span> ĐANG CHIẾU TẠI PHÚ XUÂN</div>
            </div>
            <div class="hero-index"><span>01</span> / 03</div>
            <div class="hero-bottom container"><span>HUE CITY · EST. 2024</span><span>CUỘN XUỐNG ↓</span></div>
        </section>

        <section class="booking-strip container" id="schedule">
            <div class="booking-intro"><span class="section-kicker">LÊN KẾ HOẠCH</span><strong>Đặt vé nhanh</strong></div>
            <label class="select-wrap"><span>01 / CHỌN PHIM</span><select id="quick-movie"><option value="">Chọn phim</option></select></label>
            <label class="select-wrap"><span>02 / CHỌN RẠP</span><select id="quick-cinema"><option value="">Chọn rạp</option></select></label>
            <label class="select-wrap"><span>03 / CHỌN NGÀY</span><input id="quick-date" type="date"></label>
            <label class="select-wrap"><span>04 / SUẤT CHIẾU</span><select id="quick-show"><option value="">Chọn suất</option></select></label>
            <button class="button button-gold booking-go" id="quick-book">Chọn ghế <span>→</span></button>
        </section>

        <section class="section container" id="movies">
            <div class="section-heading">
                <div><span class="section-kicker">ĐƯỢC CHỌN LỌC CHO BẠN</span><h2>Đang chiếu <span class="heading-dot">.</span></h2></div>
                <a class="arrow-link" href="#schedule">Toàn bộ lịch chiếu <span>↗</span></a>
            </div>
            <div class="movie-tabs" role="tablist">
                <button class="movie-tab active" data-status="now_showing">Đang chiếu <span>04</span></button>
                <button class="movie-tab" data-status="coming_soon">Sắp chiếu <span>04</span></button>
                <button class="movie-tab" data-status="sneakshow">Suất chiếu sớm <span>02</span></button>
            </div>
            <div class="movie-grid" id="movie-grid"><div class="loading-state">Đang tải danh sách phim…</div></div>
        </section>

        <section class="manifesto">
            <div class="container manifesto-inner">
                <span class="section-kicker">HƠN CẢ MỘT BỘ PHIM</span>
                <h2>Khoảnh khắc này,<br><em>là của bạn.</em></h2>
                <p>Âm thanh chạm đến trái tim. Màn ảnh rộng mở ra thế giới. Và một buổi tối đáng nhớ bắt đầu từ đây.</p>
                <a href="#cinemas" class="arrow-link">Khám phá không gian <span>↗</span></a>
            </div>
            <div class="manifesto-stamp">PX<br><span>FILM CLUB</span></div>
        </section>

        <section class="section container" id="cinemas">
            <div class="section-heading">
                <div><span class="section-kicker">GẶP NHAU Ở PHÚ XUÂN</span><h2>Không gian <span class="heading-dot">.</span></h2></div>
                <span class="muted">Một điểm hẹn mới giữa lòng cố đô.</span>
            </div>
            <div class="cinema-grid" id="cinema-grid"><div class="loading-state">Đang tải rạp chiếu…</div></div>
        </section>

        <section class="promotion-section" id="promotions">
            <div class="container">
                <div class="section-heading">
                    <div><span class="section-kicker">MÓN QUÀ DÀNH RIÊNG CHO BẠN</span><h2>Ưu đãi & tin tức <span class="heading-dot">.</span></h2></div>
                    <a class="arrow-link" href="#promotions">Khám phá ưu đãi <span>↗</span></a>
                </div>
                <div class="promotion-grid" id="promotion-grid"><div class="loading-state">Đang tải ưu đãi…</div></div>
            </div>
        </section>
    </main>

    <footer class="site-footer">
        <div class="container footer-main">
            <div class="footer-brand">
                <a class="brand" href="#home"><span class="brand-mark">PX</span><span class="brand-name">PHÚ XUÂN<span>CINEMA</span></span></a>
                <p>Những câu chuyện tuyệt vời<br>ngay tại thành phố của bạn.</p>
            </div>
            <div class="footer-column"><span class="section-kicker">KHÁM PHÁ</span><a href="#movies">Phim đang chiếu</a><a href="#schedule">Lịch chiếu</a><a href="#cinemas">Hệ thống rạp</a><a href="#promotions">Ưu đãi</a></div>
            <div class="footer-column"><span class="section-kicker">HỖ TRỢ</span><a href="mailto:hello@phuxuancinema.vn">Liên hệ</a><a href="#footer">Điều khoản sử dụng</a><a href="#footer">Chính sách bảo mật</a><a href="#footer">Câu hỏi thường gặp</a></div>
            <div class="footer-contact"><span class="section-kicker">GỬI LỜI CHÀO</span><a class="footer-email" href="mailto:hello@phuxuancinema.vn">hello@phuxuancinema.vn ↗</a><p>Phú Xuân, Thành phố Huế<br>Việt Nam</p><div class="social-links"><a href="#footer">FB</a><a href="#footer">IG</a><a href="#footer">YT</a><a href="#footer">TT</a></div></div>
        </div>
        <div class="container footer-bottom"><span>© 2025 PHÚ XUÂN CINEMA. ALL RIGHTS RESERVED.</span><span>MADE WITH ♥ IN HUE</span></div>
    </footer>
    <div class="toast" id="toast" role="status"></div>
    <div class="modal-backdrop" id="modal-backdrop" hidden>
        <section class="modal" id="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button class="modal-close" id="modal-close" aria-label="Đóng">×</button>
            <div id="modal-content"></div>
        </section>
    </div>
</body>
</html>
