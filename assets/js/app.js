const state = {
    movies: [],
    cinemas: [],
    promotions: [],
    products: [],
    user: null,
    movieStatus: 'now_showing',
    booking: null
};
let scannerStream = null;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = value => new Intl.NumberFormat('vi-VN').format(Number(value) || 0) + 'đ';
const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const dateText = value => new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' })
    .format(new Date(value.replace(' ', 'T')));

async function api(action, options = {}) {
    const response = await fetch(`api.php?action=${encodeURIComponent(action)}${options.query ? `&${options.query}` : ''}`, {
        method: options.method || 'GET',
        headers: options.method === 'POST' ? { 'Content-Type': 'application/json' } : {},
        body: options.method === 'POST' ? JSON.stringify(options.body || {}) : undefined,
        credentials: 'same-origin'
    });
    let result;
    try {
        result = await response.json();
    } catch {
        throw new Error('Máy chủ trả về dữ liệu không hợp lệ.');
    }
    if (!response.ok) throw new Error(result.error || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    return result;
}

function toast(message, error = false) {
    const box = $('#toast');
    box.textContent = message;
    box.classList.toggle('error', error);
    box.classList.add('visible');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => box.classList.remove('visible'), 3500);
}

function openModal(content, className = '') {
    $('#modal').className = `modal ${className}`.trim();
    $('#modal-content').innerHTML = content;
    $('#modal-backdrop').hidden = false;
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    if (scannerStream) {
        scannerStream.getTracks().forEach(track => track.stop());
        scannerStream = null;
    }
    $('#modal-backdrop').hidden = true;
    document.body.style.overflow = '';
}

function posterFallback(title) {
    return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="100%" height="100%" fill="#34332f"/><text x="50%" y="50%" fill="#d2b77f" font-family="Georgia" font-size="38" text-anchor="middle">${safe(title).replace(/&/g, 'and')}</text></svg>`)}`;
}

function renderMovies() {
    const movies = state.movies.filter(movie => movie.status === state.movieStatus);
    $('#movie-grid').innerHTML = movies.length ? movies.map(movie => `
        <article class="movie-card">
            <div class="poster-wrap" data-detail="${movie.id}">
                <img class="poster-image" src="${safe(movie.poster_url)}" alt="Poster ${safe(movie.title)}" loading="lazy" onerror="this.onerror=null;this.src='${posterFallback(movie.title)}'">
                <div class="poster-shade"></div><span class="rating-badge">${safe(movie.age_rating)}</span>
                <div class="poster-label"><span>${safe(movie.genre)}</span><span>${Number(movie.duration)} PHÚT</span></div>
            </div>
            <div class="movie-meta">
                <h3>${safe(movie.title)}</h3><p>${safe(movie.english_title)} · Khởi chiếu ${dateText(movie.release_date)}</p>
                <div class="movie-actions"><button class="detail-action" data-detail="${movie.id}">Chi tiết phim ↗</button>
                <button class="buy-action" data-buy-movie="${movie.id}">Mua vé →</button></div>
            </div>
        </article>`).join('') : '<div class="empty-state">Chưa có phim trong danh mục này.</div>';
    $$('.movie-tab').forEach(tab => {
        const count = state.movies.filter(movie => movie.status === tab.dataset.status).length;
        tab.querySelector('span').textContent = String(count).padStart(2, '0');
        tab.classList.toggle('active', tab.dataset.status === state.movieStatus);
    });
}

function renderCinemas() {
    $('#cinema-grid').innerHTML = state.cinemas.length ? state.cinemas.map(cinema => `
        <article class="cinema-card" data-cinema-card="${cinema.id}">
            <img src="${safe(cinema.image_url)}" alt="${safe(cinema.name)}" loading="lazy">
            <div class="cinema-info"><span class="section-kicker">${safe(cinema.city)} · PHÚ XUÂN CINEMA</span>
            <h3>${safe(cinema.name)}</h3><p>${safe(cinema.address)} · ${safe(cinema.phone)}</p>
            <p class="amenities">${safe(cinema.amenities)}</p></div>
        </article>`).join('') : '<div class="empty-state">Chưa có thông tin rạp.</div>';
    $('#quick-cinema').innerHTML = '<option value="">Chọn rạp</option>' +
        state.cinemas.map(cinema => `<option value="${cinema.id}">${safe(cinema.name)}</option>`).join('');
}

function renderPromotions() {
    $('#promotion-grid').innerHTML = state.promotions.length ? state.promotions.map((promotion, index) => `
        <article class="promotion-card">
            <img src="${safe(promotion.image_url)}" alt="" loading="lazy">
            <div class="promotion-info"><span class="section-kicker">PX / ĐẶC QUYỀN ${String(index + 1).padStart(2, '0')}</span>
            <h3>${safe(promotion.title)}</h3><p>${safe(promotion.description)}</p>
            ${promotion.code ? `<span class="promotion-code">${safe(promotion.code)}</span>` : ''}</div>
        </article>`).join('') : '<div class="empty-state">Ưu đãi mới sẽ sớm được cập nhật.</div>';
}

function setMovieOptions() {
    $('#quick-movie').innerHTML = '<option value="">Chọn phim</option>' +
        state.movies.filter(movie => movie.status !== 'coming_soon')
            .map(movie => `<option value="${movie.id}">${safe(movie.title)}</option>`).join('');
}

async function loadQuickShows() {
    const movieId = $('#quick-movie').value;
    const cinemaId = $('#quick-cinema').value;
    const date = $('#quick-date').value;
    const select = $('#quick-show');
    select.innerHTML = '<option value="">Đang tải suất…</option>';
    if (!movieId || !cinemaId || !date) {
        select.innerHTML = '<option value="">Chọn suất</option>';
        return;
    }
    try {
        const result = await api('shows', { query: new URLSearchParams({ movie_id: movieId, cinema_id: cinemaId, date }).toString() });
        select.innerHTML = '<option value="">Chọn suất</option>' + result.showtimes.map(show => {
            const starts = new Date(show.starts_at.replace(' ', 'T'));
            const time = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(starts);
            return `<option value="${show.id}">${time} · ${safe(show.format)} · Còn ${Math.max(0, show.seat_count - show.sold_count)} ghế</option>`;
        }).join('');
        if (!result.showtimes.length) select.innerHTML = '<option value="">Chưa có suất ngày này</option>';
        select._shows = result.showtimes;
    } catch (error) {
        select.innerHTML = '<option value="">Không tải được suất chiếu</option>';
        toast(error.message, true);
    }
}

async function openMovieDetail(movieId) {
    const movie = state.movies.find(item => Number(item.id) === Number(movieId));
    if (!movie) return;
    const today = $('#quick-date').value;
    let showtimes = [];
    try {
        const result = await api('shows', { query: new URLSearchParams({ movie_id: movieId, date: today }).toString() });
        showtimes = result.showtimes;
    } catch (error) {
        toast(error.message, true);
    }
    const grouped = showtimes.reduce((groups, show) => {
        (groups[show.cinema_name] ||= []).push(show);
        return groups;
    }, {});
    const schedule = Object.entries(grouped).map(([cinema, shows]) => `
        <div class="schedule-group"><h4>${safe(cinema)}</h4><div class="show-chips">
        ${shows.map(show => `<button class="show-chip" data-book-show="${show.id}">${new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(show.starts_at.replace(' ', 'T')))} · ${safe(show.format)}</button>`).join('')}
        </div></div>`).join('') || '<p class="form-note">Chưa có suất chiếu trong ngày đã chọn. Hãy chọn ngày khác ở khu vực Đặt vé nhanh.</p>';
    openModal(`<div class="detail-layout">
        <div><img class="detail-poster" src="${safe(movie.poster_url)}" alt="${safe(movie.title)}" onerror="this.onerror=null;this.src='${posterFallback(movie.title)}'">
        ${movie.trailer_url ? `<button class="button button-gold" style="width:100%;margin-top:10px" data-trailer="${safe(movie.trailer_url)}">▶ Xem trailer</button>` : ''}</div>
        <div class="detail-copy"><span class="section-kicker">${safe(movie.age_rating)} · ${safe(movie.genre)}</span>
        <h2 id="modal-title">${safe(movie.title)}</h2><span class="english-title">${safe(movie.english_title)}</span>
        <div class="detail-facts"><div>THỜI LƯỢNG<strong>${Number(movie.duration)} phút</strong></div>
        <div>KHỞI CHIẾU<strong>${dateText(movie.release_date)}</strong></div>
        <div>ĐẠO DIỄN<strong>${safe(movie.director)}</strong></div>
        <div>NGÔN NGỮ<strong>${safe(movie.language)}</strong></div>
        <div style="grid-column:1/-1">DIỄN VIÊN<strong>${safe(movie.cast_names)}</strong></div></div>
        <p>${safe(movie.synopsis)}</p></div></div>
        <div class="admin-section"><span class="section-kicker">CHỌN SUẤT CHIẾU · ${safe(today)}</span>${schedule}</div>`);
}

async function openBooking(showId) {
    try {
        const show = [...(($('#quick-show')._shows) || [])].find(item => Number(item.id) === Number(showId)) || null;
        const [seatData, foodData] = await Promise.all([
            api('seats', { query: `showtime_id=${encodeURIComponent(showId)}` }),
            api('foods')
        ]);
        let showInfo = show;
        if (!showInfo) {
            const date = $('#quick-date').value;
            const result = await api('shows', { query: new URLSearchParams({ date }).toString() });
            showInfo = result.showtimes.find(item => Number(item.id) === Number(showId));
        }
        if (!showInfo) throw new Error('Không tìm thấy thông tin suất chiếu.');
        state.booking = { show: showInfo, seats: [], seatData: seatData.seats, products: foodData.products, quantities: {}, step: 2 };
        renderBooking();
    } catch (error) {
        toast(error.message, true);
    }
}

function bookingSeatPrice(seat) {
    const day = new Date(state.booking.show.starts_at.replace(' ', 'T')).getDay();
    const weekendExtra = day === 0 || day === 6 ? 10000 : 0;
    const extra = ({ standard: 0, vip: 25000, sweetbox: 70000 }[seat.type] || 0) + weekendExtra;
    return Number(state.booking.show.ticket_price) + extra;
}

function bookingTotals() {
    const ticket = state.booking.seats.reduce((sum, seat) => sum + bookingSeatPrice(seat), 0);
    const food = state.booking.products.reduce((sum, product) => sum + Number(product.price) * (state.booking.quantities[product.id] || 0), 0);
    return { ticket, food, subtotal: ticket + food };
}

function bookingStepper(current) {
    return `<div class="stepper">${['Suất chiếu', 'Chọn ghế', 'Bắp nước', 'Thanh toán', 'Hoàn tất'].map((name, index) =>
        `<div class="step ${index + 1 <= current ? 'active' : ''}"><span>${index + 1}</span>${name}</div>`).join('')}</div>`;
}

function renderBooking() {
    const booking = state.booking;
    if (!booking) return;
    const { show, seats, step } = booking;
    const starts = new Date(show.starts_at.replace(' ', 'T'));
    const time = `${dateText(show.starts_at)} · ${new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(starts)}`;
    const totals = bookingTotals();
    const selectedLabels = seats.map(seat => `${seat.row_label}${String(seat.seat_number).padStart(2, '0')}`).join(', ') || 'Chưa chọn';
    let content = `${bookingStepper(step)}<div class="booking-head"><div><h3>${safe(show.movie_title)}</h3><p>${safe(show.cinema_name)} · ${safe(show.room_name)} · ${safe(show.format)} · ${time}</p></div>
        <button class="modal-link" data-close>Đóng ×</button></div>`;

    if (step === 2) {
        const byRow = booking.seatData.reduce((rows, seat) => ((rows[seat.row_label] ||= []).push(seat), rows), {});
        content += `<div class="screen">MÀN HÌNH</div><div class="seat-map">${Object.entries(byRow).map(([row, rowSeats]) =>
            `<div class="seat-row"><span class="row-label">${safe(row)}</span>${rowSeats.map(seat =>
                `<button class="seat type-${safe(seat.type)} ${Number(seat.sold) ? 'sold' : ''} ${seats.some(item => Number(item.id) === Number(seat.id)) ? 'selected' : ''}"
                    data-seat="${seat.id}" ${Number(seat.sold) ? 'disabled' : ''} aria-label="Ghế ${safe(seat.seat_code)} ${Number(seat.sold) ? 'đã bán' : ''}">${Number(seat.seat_number)}</button>`
            ).join('')}</div>`).join('')}</div>
            <div class="seat-legend"><span class="legend-item"><i class="seat-swatch"></i>Thường</span><span class="legend-item"><i class="seat-swatch vip"></i>VIP</span>
            <span class="legend-item"><i class="seat-swatch sweetbox"></i>Sweetbox</span><span class="legend-item"><i class="seat-swatch selected"></i>Đang chọn</span>
            <span class="legend-item"><i class="seat-swatch sold"></i>Đã bán</span></div>
            <div class="booking-footer"><div><span class="total-label">GHẾ ĐÃ CHỌN</span><span class="total-value">${safe(selectedLabels)}</span></div>
            <div><span class="total-label">TẠM TÍNH</span><span class="total-value">${money(totals.ticket)}</span></div>
            <button class="button button-gold" data-next-step="3" ${seats.length ? '' : 'disabled'}>Bắp nước →</button></div>`;
    } else if (step === 3) {
        content += `<div class="food-list">${booking.products.map(product => `
            <div class="food-item"><img src="${safe(product.image_url)}" alt="" onerror="this.style.visibility='hidden'">
                <div><h4>${safe(product.name)}</h4><p>${safe(product.description)}</p><p><strong>${money(product.price)}</strong></p></div>
                <div class="quantity-control"><button data-qty="${product.id}" data-delta="-1" aria-label="Giảm">−</button>
                <span>${booking.quantities[product.id] || 0}</span><button data-qty="${product.id}" data-delta="1" aria-label="Thêm">+</button></div></div>`).join('')}</div>
            <div class="booking-footer"><div><span class="total-label">${seats.length} GHẾ · ${selectedLabels}</span><span class="total-value">${money(totals.subtotal)}</span></div>
            <button class="button button-gold" data-next-step="4">Thông tin thanh toán →</button></div>`;
    } else if (step === 4) {
        content += `<div class="form-grid">
            <div class="form-field"><label for="pay-name">Họ tên</label><input id="pay-name" name="full_name" value="${safe(state.user?.full_name || '')}" autocomplete="name" required></div>
            <div class="form-field"><label for="pay-phone">Số điện thoại</label><input id="pay-phone" name="phone" value="${safe(state.user?.phone || '')}" autocomplete="tel" required></div>
            <div class="form-field" style="grid-column:1/-1"><label for="pay-email">Email nhận vé</label><input id="pay-email" name="email" type="email" value="${safe(state.user?.email || '')}" autocomplete="email" required></div>
        </div>
        <div class="admin-section"><h3>Phương thức thanh toán</h3><div class="payment-options">
            ${[['vnpay', 'VNPay · QR'], ['momo', 'Ví MoMo'], ['zalopay', 'ZaloPay'], ['atm', 'Thẻ ATM'], ['visa', 'Visa / Mastercard']].map(([value, label], i) =>
                `<label class="payment-option"><input type="radio" name="payment_method" value="${value}" ${i === 0 ? 'checked' : ''}>${label}</label>`).join('')}
        </div><p class="form-note">Đây là bản demo: lựa chọn phương thức được lưu cùng vé, chưa kết nối cổng thanh toán thực tế.</p></div>
        <div class="form-grid"><div class="form-field"><label for="promo-code">Mã ưu đãi</label><input id="promo-code" placeholder="PHUXUAN10"></div>
            <div class="form-field"><label>Tạm tính</label><input value="${money(totals.subtotal)}" disabled></div></div>
        <div class="booking-footer"><div><span class="total-label">THANH TOÁN</span><span class="total-value">${money(totals.subtotal)}</span></div>
            <button class="button button-gold" data-submit-booking>Xác nhận đặt vé →</button></div>`;
    }
    openModal(content, 'booking-modal');
}

async function completeBooking(button) {
    if (!state.user) {
        toast('Vui lòng đăng nhập trước khi xác nhận đặt vé.', true);
        showAuth('login');
        return;
    }
    const fullName = $('#pay-name')?.value.trim();
    const phone = $('#pay-phone')?.value.trim();
    const email = $('#pay-email')?.value.trim();
    if (!fullName || !phone || !email) {
        toast('Vui lòng điền đầy đủ họ tên, số điện thoại và email.', true);
        return;
    }
    button.disabled = true;
    button.textContent = 'Đang xác nhận…';
    const booking = state.booking;
    try {
        const result = await api('booking', {
            method: 'POST',
            body: {
                showtime_id: booking.show.id,
                seats: booking.seats.map(seat => Number(seat.id)),
                products: booking.products.filter(product => booking.quantities[product.id] > 0)
                    .map(product => ({ id: Number(product.id), qty: booking.quantities[product.id] })),
                full_name: fullName, phone, email,
                payment_method: $('input[name="payment_method"]:checked')?.value || 'vnpay',
                promo_code: $('#promo-code')?.value.trim() || ''
            }
        });
        const ticket = result.booking;
        state.booking.step = 5;
        openModal(`${bookingStepper(5)}<div class="ticket-success">
            <div class="success-icon">✓</div><span class="section-kicker">VÉ ĐIỆN TỬ CỦA BẠN ĐÃ SẴN SÀNG</span>
            <h2>Hẹn gặp bạn tại rạp.</h2><p class="form-note">${safe(booking.show.movie_title)} · ${safe(booking.show.cinema_name)}</p>
            <div class="ticket-code">${safe(ticket.booking_code)}</div><div class="ticket-qr"><img alt="Mã QR vé ${safe(ticket.booking_code)}" src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticket.booking_code)}"></div>
            <p class="form-note">${booking.seats.length} ghế · ${money(ticket.total)} · ${ticket.points_earned} điểm đã tích lũy<br>Vé đã được lưu trong lịch sử thành viên. Email xác nhận sẽ được gửi khi cấu hình dịch vụ email.</p>
            <button class="button button-gold" data-close>Hoàn tất <span>↗</span></button>
        </div>`, 'booking-modal');
        $('#quick-show')._shows = [];
        loadQuickShows();
    } catch (error) {
        button.disabled = false;
        button.textContent = 'Xác nhận đặt vé →';
        toast(error.message, true);
    }
}

function showAuth(mode = 'login') {
    const register = mode === 'register';
    openModal(`<span class="section-kicker">PHÚ XUÂN FILM CLUB</span>
        <h2 class="modal-heading" id="modal-title">${register ? 'Trở thành thành viên.' : 'Chào mừng trở lại.'}</h2>
        ${register ? `<div class="form-field"><label>Họ và tên</label><input name="full_name" autocomplete="name" required></div>` : ''}
        <div class="form-stack" style="margin-top:12px">
        ${register ? `<div class="form-field"><label>Số điện thoại</label><input name="phone" autocomplete="tel" required></div>` : ''}
        <div class="form-field"><label>${register ? 'Email' : 'Email hoặc số điện thoại'}</label><input name="identity" ${register ? 'type="email" autocomplete="email"' : 'autocomplete="username"'} required></div>
        <div class="form-field"><label>Mật khẩu ${register ? '(tối thiểu 8 ký tự)' : ''}</label><input name="password" type="password" autocomplete="${register ? 'new-password' : 'current-password'}" required></div>
        <button class="button button-gold" data-auth-submit="${register ? 'register' : 'login'}">${register ? 'Tạo tài khoản' : 'Đăng nhập'} <span>→</span></button>
        ${!register ? '<p class="form-note">Tài khoản quản trị demo: admin@phuxuancinema.vn · Admin123!</p>' : ''}
        <button class="modal-link" data-auth-mode="${register ? 'login' : 'register'}">${register ? 'Đã là thành viên? Đăng nhập' : 'Chưa có tài khoản? Đăng ký C’Friend'}</button></div>`);
}

function updateAccountButton() {
    $('#account-button').textContent = state.user ? state.user.full_name.split(' ')[0] : 'Đăng nhập';
    $('#account-button').title = state.user?.role === 'admin' ? 'Mở quản trị' : 'Tài khoản thành viên';
}

async function openAccount() {
    if (!state.user) return showAuth('login');
    if (state.user.role === 'admin') return openAdmin();
    openModal(`<span class="section-kicker">PHÚ XUÂN FILM CLUB</span><h2 class="modal-heading">Tài khoản thành viên</h2>
        <div class="profile-card"><strong>${safe(state.user.full_name)}</strong><div class="profile-stats">
        <span>${safe(state.user.member_tier || 'C’Friend')}</span><span>${Number(state.user.loyalty_points || 0)} điểm tích lũy</span></div></div>
        <div class="admin-section"><h3>Lịch sử giao dịch</h3><div id="booking-history" class="history-list"><span class="form-note">Đang tải vé đã đặt…</span></div></div>
        <button class="button button-outline" style="color:var(--ink);border-color:var(--line);margin-top:16px" data-logout>Đăng xuất</button>`);
    try {
        const result = await api('history');
        const history = $('#booking-history');
        if (!history) return;
        history.innerHTML = result.bookings.length ? result.bookings.map(booking => `
            <div class="history-row"><strong>${safe(booking.movie_title)}</strong>
            <span>${safe(booking.cinema_name)} · ${dateText(booking.starts_at)} · Ghế ${safe(booking.seats || '—')}<br>
            Mã ${safe(booking.booking_code)} · ${money(booking.total)} · ${safe(booking.status)}</span></div>`).join('') :
            '<span class="form-note">Bạn chưa có giao dịch nào.</span>';
    } catch (error) { toast(error.message, true); }
}

async function openAdmin() {
    openModal('<span class="section-kicker">PX / QUẢN TRỊ</span><h2 class="modal-heading">Bảng điều khiển</h2><p class="form-note">Đang tải dữ liệu quản trị…</p>', 'admin-modal');
    try {
        const result = await api('admin-data');
        state.adminMovies = result.movies;
        state.adminProducts = result.products;
        const cinemaOptions = result.cinemas.map(cinema => `<option value="${cinema.id}">${safe(cinema.name)}</option>`).join('');
        const movieOptions = result.movies.map(movie => `<option value="${movie.id}">${safe(movie.title)}</option>`).join('');
        $('#modal-content').innerHTML = `<span class="section-kicker">PX / QUẢN TRỊ</span><h2 class="modal-heading">Bảng điều khiển</h2>
            <div class="admin-stats"><div class="admin-stat"><span>TỔNG LƯỢT ĐẶT</span><strong>${Number(result.summary.booking_count)}</strong></div>
            <div class="admin-stat"><span>DOANH THU HÔM NAY</span><strong>${money(result.summary.today_revenue)}</strong></div>
            <div class="admin-stat"><span>TỔNG DOANH THU</span><strong>${money(result.summary.revenue)}</strong></div></div>
            <div class="admin-section"><h3>Quản lý phim</h3><form class="form-stack" id="admin-movie-form">
                <input name="id" type="hidden">
                <div class="form-grid"><div class="form-field"><label>Tên phim</label><input name="title" required></div>
                <div class="form-field"><label>Tên tiếng Anh</label><input name="english_title"></div></div>
                <div class="form-grid"><div class="form-field"><label>Thể loại</label><input name="genre"></div>
                <div class="form-field"><label>Thời lượng (phút)</label><input name="duration" type="number" min="1" required></div></div>
                <div class="form-grid"><div class="form-field"><label>Độ tuổi</label><select name="age_rating"><option>P</option><option>K</option><option>T13</option><option>T16</option><option>T18</option><option>C</option></select></div>
                <div class="form-field"><label>Trạng thái</label><select name="status"><option value="now_showing">Đang chiếu</option><option value="coming_soon">Sắp chiếu</option><option value="sneakshow">Chiếu sớm</option></select></div></div>
                <div class="form-grid"><div class="form-field"><label>Khởi chiếu</label><input name="release_date" type="date" required></div><div class="form-field"><label>Poster URL</label><input name="poster_url"></div></div>
                <div class="form-field"><label>Tóm tắt</label><textarea name="synopsis"></textarea></div>
                <div class="form-grid"><div class="form-field"><label>Đạo diễn</label><input name="director"></div><div class="form-field"><label>Diễn viên</label><input name="cast_names"></div></div>
                <div class="form-grid"><div class="form-field"><label>Ngôn ngữ</label><input name="language" value="Tiếng Việt"></div><div class="form-field"><label>Trailer URL</label><input name="trailer_url"></div></div>
                <div class="form-field"><label>Ảnh nền URL</label><input name="backdrop_url"></div>
                <div class="form-grid"><button class="button button-gold">Thêm phim</button><button type="reset" class="button button-outline" style="color:var(--ink);border-color:var(--line)">Làm mới biểu mẫu</button></div></form>
                <div class="admin-list" style="margin-top:12px">${result.movies.map(movie => `<div class="admin-list-row"><span>${safe(movie.title)} · ${safe(movie.status)}</span>
                <div><button data-edit-movie="${movie.id}">Sửa</button><button data-delete-movie="${movie.id}">Xóa</button></div></div>`).join('')}</div></div>
            <div class="admin-section"><h3>Lên lịch chiếu</h3><form class="form-stack" id="admin-show-form">
                <div class="form-grid"><div class="form-field"><label>Phim</label><select name="movie_id">${movieOptions}</select></div>
                <div class="form-field"><label>Rạp</label><select name="cinema_id">${cinemaOptions}</select></div></div>
                <div class="form-grid"><div class="form-field"><label>Phòng chiếu</label><select name="room_id"></select></div>
                <div class="form-field"><label>Thời gian</label><input name="starts_at" type="datetime-local" required></div></div>
                <div class="form-field"><label>Giá vé cơ bản</label><input name="ticket_price" type="number" min="1000" value="85000"></div>
                <button class="button button-gold">Tạo suất chiếu</button></form>
                <div class="admin-list" style="margin-top:12px">${result.shows.map(show => `<div class="admin-list-row"><span>${safe(show.movie_title)} · ${safe(show.cinema_name)} · ${dateText(show.starts_at)}</span><span>${safe(show.format)}</span></div>`).join('') || '<span class="form-note">Chưa có lịch chiếu sắp tới.</span>'}</div></div>
            <div class="admin-section"><h3>Quản lý bắp nước</h3><form class="form-grid" id="admin-product-form">
                <input name="id" type="hidden">
                <div class="form-field"><label>Tên sản phẩm</label><input name="name" required></div>
                <div class="form-field"><label>Giá</label><input name="price" type="number" min="1" required></div>
                <div class="form-field"><label>Phân loại</label><select name="category"><option value="combo">Combo</option><option value="popcorn">Bắp</option><option value="drink">Nước</option><option value="snack">Đồ ăn nhẹ</option></select></div>
                <div class="form-field"><label>Mô tả</label><input name="description"></div>
                <div class="form-field"><label>Ảnh sản phẩm URL</label><input name="image_url"></div>
                <button class="button button-gold" style="align-self:end">Thêm sản phẩm</button></form>
                <div class="admin-list" style="margin-top:12px">${result.products.map(product => `<div class="admin-list-row"><span>${safe(product.name)} · ${money(product.price)} · ${Number(product.active) ? 'Đang bán' : 'Tạm ẩn'}</span>
                <div><button data-edit-product="${product.id}">Sửa</button><button data-toggle-product="${product.id}">${Number(product.active) ? 'Ẩn' : 'Bán lại'}</button></div></div>`).join('')}</div></div>
            <div class="admin-section"><h3>Hệ thống rạp & phòng chiếu</h3>
                <form class="form-stack" id="admin-cinema-form"><div class="form-grid">
                    <div class="form-field"><label>Tên rạp</label><input name="name" required></div><div class="form-field"><label>Tỉnh / thành phố</label><input name="city" value="Huế" required></div>
                    <div class="form-field"><label>Địa chỉ</label><input name="address" required></div><div class="form-field"><label>Số điện thoại</label><input name="phone"></div>
                    <div class="form-field"><label>Tiện ích</label><input name="amenities"></div><div class="form-field"><label>Ảnh rạp (URL)</label><input name="image_url"></div></div>
                    <button class="button button-gold">Thêm rạp</button></form>
                <form class="form-stack" id="admin-room-form" style="margin-top:14px"><div class="form-grid">
                    <div class="form-field"><label>Rạp</label><select name="cinema_id">${cinemaOptions}</select></div><div class="form-field"><label>Tên phòng</label><input name="name" required></div>
                    <div class="form-field"><label>Định dạng</label><select name="format"><option>2D</option><option>3D</option><option>IMAX</option><option>VIP</option></select></div>
                    <div class="form-field"><label>Số hàng (3–12)</label><input name="row_count" type="number" min="3" max="12" value="8" required></div>
                    <div class="form-field"><label>Số ghế mỗi hàng (4–16)</label><input name="column_count" type="number" min="4" max="16" value="10" required></div></div>
                    <button class="button button-gold">Tạo phòng & sơ đồ ghế</button></form>
                <div class="admin-list" style="margin-top:12px">${result.rooms.map(room => `<div class="admin-list-row"><span>${safe(result.cinemas.find(cinema => Number(cinema.id) === Number(room.cinema_id))?.name || '')} · ${safe(room.name)} · ${safe(room.format)}</span><span>${Number(room.seat_count)} ghế</span></div>`).join('')}</div>
            </div>
            <div class="admin-section"><h3>Soát vé</h3><form class="form-grid" id="checkin-form">
                <div class="form-field"><label>Mã đặt vé</label><input name="booking_code" placeholder="PX..." required></div>
                <div class="form-grid" style="align-self:end"><button class="button button-gold">Xác nhận check-in</button><button type="button" class="button button-outline" id="start-qr-scan" style="color:var(--ink);border-color:var(--line)">Quét QR</button></div>
                </form><video id="qr-camera" playsinline style="display:none;width:100%;max-height:260px;margin-top:12px;background:#111"></video></div>`;
        $('#modal').className = 'modal admin-modal';
        populateAdminRooms(result.rooms);
    } catch (error) { toast(error.message, true); }
}

function populateAdminRooms(rooms) {
    const cinemaId = $('#modal-content select[name="cinema_id"]')?.value;
    const roomSelect = $('#modal-content select[name="room_id"]');
    if (!roomSelect) return;
    roomSelect.innerHTML = rooms.filter(room => String(room.cinema_id) === String(cinemaId))
        .map(room => `<option value="${room.id}">${safe(room.name)} · ${safe(room.format)}</option>`).join('');
}

async function scanTicketQr(button) {
    if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) {
        toast('Thiết bị chưa hỗ trợ quét QR. Vui lòng nhập mã vé thủ công.', true);
        return;
    }
    try {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const video = $('#qr-camera');
        scannerStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = scannerStream;
        video.style.display = 'block';
        await video.play();
        button.disabled = true;
        const scan = async () => {
            if (!scannerStream || $('#modal-backdrop').hidden) return;
            try {
                const codes = await detector.detect(video);
                if (codes.length && codes[0].rawValue) {
                    const code = codes[0].rawValue.trim();
                    $('#checkin-form [name="booking_code"]').value = code;
                    scannerStream.getTracks().forEach(track => track.stop());
                    scannerStream = null;
                    video.style.display = 'none';
                    button.disabled = false;
                    try {
                        await submitCheckin(code);
                    } catch (error) {
                        toast(error.message, true);
                    }
                    return;
                }
            } catch (error) {
                toast('Không thể đọc mã QR. Vui lòng thử lại hoặc nhập mã vé.', true);
                scannerStream?.getTracks().forEach(track => track.stop());
                scannerStream = null;
                video.style.display = 'none';
                button.disabled = false;
                return;
            }
            requestAnimationFrame(scan);
        };
        requestAnimationFrame(scan);
    } catch (error) {
        if (scannerStream) scannerStream.getTracks().forEach(track => track.stop());
        scannerStream = null;
        const message = error.name === 'NotAllowedError'
            ? 'Cần cấp quyền camera để quét mã QR.'
            : 'Không thể khởi động camera. Vui lòng nhập mã vé thủ công.';
        toast(message, true);
        button.disabled = false;
    }
}

async function submitCheckin(code) {
    const result = await api('admin-checkin', { method: 'POST', body: { booking_code: code } });
    toast(result.message);
}

function setUser(user) {
    state.user = user;
    updateAccountButton();
}

async function handleAuth(button) {
    const mode = button.dataset.authSubmit;
    const inputs = [...$('#modal-content').querySelectorAll('input')];
    const value = name => $('#modal-content [name="' + name + '"]')?.value.trim() || '';
    const payload = mode === 'login' ? { identity: value('identity'), password: value('password') } :
        { full_name: value('full_name'), email: value('identity'), phone: value('phone'), password: value('password') };
    button.disabled = true;
    try {
        const result = await api(mode, { method: 'POST', body: payload });
        setUser(result.user);
        toast(`Xin chào ${result.user.full_name}!`);
        if (state.booking?.step === 4) renderBooking();
        else closeModal();
        if (result.user.role === 'admin') openAdmin();
    } catch (error) {
        toast(error.message, true);
        button.disabled = false;
    }
}

document.addEventListener('click', async event => {
    const target = event.target.closest('button, [data-detail], [data-cinema-card]');
    if (!target) return;
    if (target.id === 'modal-close' || target.hasAttribute('data-close') || event.target.id === 'modal-backdrop') return closeModal();
    if (target.dataset.detail) return openMovieDetail(target.dataset.detail);
    if (target.dataset.buyMovie) {
        $('#quick-movie').value = target.dataset.buyMovie;
        $('#schedule').scrollIntoView({ behavior: 'smooth' });
        return toast('Chọn rạp, ngày và suất chiếu để tiếp tục.');
    }
    if (target.dataset.cinemaCard) {
        $('#quick-cinema').value = target.dataset.cinemaCard;
        $('#schedule').scrollIntoView({ behavior: 'smooth' });
        return toast('Chọn phim, ngày và suất chiếu tại rạp này.');
    }
    if (target.id === 'account-button') return openAccount();
    if (target.id === 'menu-toggle') return $('#main-nav').classList.toggle('open');
    if (target.dataset.authMode) return showAuth(target.dataset.authMode);
    if (target.dataset.authSubmit) return handleAuth(target);
    if (target.dataset.trailer) {
        const url = target.dataset.trailer.replace('watch?v=', 'embed/');
        $('#modal-content').insertAdjacentHTML('beforeend', `<iframe class="trailer-frame" src="${safe(url)}" title="Trailer phim" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`);
        target.remove();
        return;
    }
    if (target.dataset.bookShow) return openBooking(target.dataset.bookShow);
    if (target.id === 'quick-book') {
        if (!$('#quick-show').value) return toast('Vui lòng chọn đầy đủ phim, rạp, ngày và suất chiếu.', true);
        return openBooking($('#quick-show').value);
    }
    if (target.dataset.seat) {
        const seat = state.booking.seatData.find(item => Number(item.id) === Number(target.dataset.seat));
        if (!seat) return;
        const index = state.booking.seats.findIndex(item => Number(item.id) === Number(seat.id));
        if (index >= 0) state.booking.seats.splice(index, 1);
        else if (state.booking.seats.length >= 8) return toast('Mỗi giao dịch được chọn tối đa 8 ghế.', true);
        else state.booking.seats.push(seat);
        return renderBooking();
    }
    if (target.dataset.nextStep) {
        if (Number(target.dataset.nextStep) === 4 && !state.user) return showAuth('login');
        state.booking.step = Number(target.dataset.nextStep);
        return renderBooking();
    }
    if (target.dataset.qty) {
        const id = target.dataset.qty;
        state.booking.quantities[id] = Math.max(0, Math.min(10, (state.booking.quantities[id] || 0) + Number(target.dataset.delta)));
        return renderBooking();
    }
    if (target.hasAttribute('data-submit-booking')) return completeBooking(target);
    if (target.hasAttribute('data-logout')) {
        await api('logout', { method: 'POST' });
        setUser(null);
        closeModal();
        return toast('Bạn đã đăng xuất.');
    }
    if (target.dataset.deleteMovie) {
        if (!confirm('Bạn có chắc muốn xóa phim này?')) return;
        try {
            await api('admin-movie-delete', { method: 'POST', body: { id: Number(target.dataset.deleteMovie) } });
            toast('Đã xóa phim.');
            await refreshMovies();
            openAdmin();
        } catch (error) { toast(error.message, true); }
    }
    if (target.dataset.editMovie) {
        const movie = state.adminMovies?.find(item => Number(item.id) === Number(target.dataset.editMovie));
        const form = $('#admin-movie-form');
        if (!movie || !form) return;
        Object.entries(movie).forEach(([key, value]) => {
            const input = form.elements.namedItem(key);
            if (input) input.value = value ?? '';
        });
        form.querySelector('button[type="submit"]').textContent = 'Lưu thay đổi';
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }
    if (target.dataset.editProduct) {
        const product = state.adminProducts?.find(item => Number(item.id) === Number(target.dataset.editProduct));
        const form = $('#admin-product-form');
        if (!product || !form) return;
        Object.entries(product).forEach(([key, value]) => {
            const input = form.elements.namedItem(key);
            if (input) input.value = value ?? '';
        });
        form.querySelector('button[type="submit"]').textContent = 'Lưu sản phẩm';
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }
    if (target.dataset.toggleProduct) {
        try {
            await api('admin-product-toggle', { method: 'POST', body: { id: Number(target.dataset.toggleProduct) } });
            toast('Đã cập nhật trạng thái sản phẩm.');
            openAdmin();
        } catch (error) { toast(error.message, true); }
    }
    if (target.id === 'start-qr-scan') return scanTicketQr(target);
});

document.addEventListener('change', event => {
    if (event.target.matches('#quick-movie, #quick-cinema, #quick-date')) loadQuickShows();
    if (event.target.matches('#modal-content select[name="cinema_id"]')) {
        api('admin-data').then(result => populateAdminRooms(result.rooms)).catch(error => toast(error.message, true));
    }
    if (event.target.matches('.movie-tab')) {
        state.movieStatus = event.target.dataset.status;
        renderMovies();
    }
});

document.addEventListener('submit', async event => {
    const form = event.target;
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
        if (form.id === 'admin-movie-form') {
            event.preventDefault();
            payload.duration = Number(payload.duration);
            await api('admin-movie-save', { method: 'POST', body: payload });
            toast(payload.id ? 'Đã cập nhật phim.' : 'Đã thêm phim.');
            await refreshMovies();
            openAdmin();
        } else if (form.id === 'admin-show-form') {
            event.preventDefault();
            payload.movie_id = Number(payload.movie_id);
            payload.room_id = Number(payload.room_id);
            payload.ticket_price = Number(payload.ticket_price);
            await api('admin-showtime-save', { method: 'POST', body: payload });
            toast('Đã lên lịch chiếu.');
            openAdmin();
        } else if (form.id === 'admin-product-form') {
            event.preventDefault();
            payload.price = Number(payload.price);
            await api('admin-product-save', { method: 'POST', body: payload });
            toast(payload.id ? 'Đã cập nhật sản phẩm.' : 'Đã thêm sản phẩm.');
            openAdmin();
        } else if (form.id === 'admin-cinema-form') {
            event.preventDefault();
            await api('admin-cinema-save', { method: 'POST', body: payload });
            toast('Đã thêm rạp.');
            openAdmin();
            const cinemas = await api('cinemas');
            state.cinemas = cinemas.cinemas;
            renderCinemas();
        } else if (form.id === 'admin-room-form') {
            event.preventDefault();
            payload.cinema_id = Number(payload.cinema_id);
            payload.row_count = Number(payload.row_count);
            payload.column_count = Number(payload.column_count);
            await api('admin-room-save', { method: 'POST', body: payload });
            toast('Đã tạo phòng chiếu và sơ đồ ghế.');
            openAdmin();
        } else if (form.id === 'checkin-form') {
            event.preventDefault();
            await submitCheckin(payload.booking_code);
            form.reset();
        }
    } catch (error) {
        event.preventDefault();
        toast(error.message, true);
    }
});

async function refreshMovies() {
    const result = await api('movies');
    state.movies = result.movies;
    setMovieOptions();
    renderMovies();
}

async function loadApp() {
    $('#quick-date').value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    try {
        const [movies, cinemas, promotions, user] = await Promise.all([
            api('movies'), api('cinemas'), api('promotions'), api('me')
        ]);
        state.movies = movies.movies;
        state.cinemas = cinemas.cinemas;
        state.promotions = promotions.promotions;
        setUser(user.user);
        setMovieOptions();
        renderMovies();
        renderCinemas();
        renderPromotions();
    } catch (error) {
        $('#movie-grid').innerHTML = `<div class="empty-state">Không thể kết nối cơ sở dữ liệu. Hãy nhập <strong>database.sql</strong> và cấu hình kết nối trong <strong>config.php</strong>.<br>${safe(error.message)}</div>`;
        $('#cinema-grid').innerHTML = '<div class="empty-state">Đang chờ kết nối cơ sở dữ liệu.</div>';
        $('#promotion-grid').innerHTML = '';
    }
}

$$('.movie-tab').forEach(tab => tab.addEventListener('click', () => {
    state.movieStatus = tab.dataset.status;
    renderMovies();
}));
$('#modal-close').addEventListener('click', closeModal);
$('#modal-backdrop').addEventListener('click', event => {
    if (event.target === $('#modal-backdrop')) closeModal();
});
$('#main-nav').addEventListener('click', event => {
    if (event.target.closest('a')) $('#main-nav').classList.remove('open');
});
window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !$('#modal-backdrop').hidden) closeModal();
});

const heroSlides = [
    { image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=2200&q=90', eyebrow: 'MỘT TRẢI NGHIỆM ĐIỆN ẢNH KHÁC BIỆT', first: 'Để cảm xúc', second: 'lên màn ảnh.' },
    { image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=2200&q=90', eyebrow: 'NHỮNG CÂU CHUYỆN Ở LẠI CÙNG TA', first: 'Mỗi bộ phim', second: 'một thế giới.' },
    { image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=2200&q=90', eyebrow: 'HẸN NHAU DƯỚI ÁNH ĐÈN MÀN ẢNH', first: 'Khoảnh khắc', second: 'là của bạn.' }
];
let heroIndex = 0;
setInterval(() => {
    heroIndex = (heroIndex + 1) % heroSlides.length;
    const slide = heroSlides[heroIndex];
    $('.hero-image').style.backgroundImage = `url("${slide.image}")`;
    $('.hero .eyebrow').innerHTML = `<span class="eyebrow-line"></span> ${slide.eyebrow}`;
    $('.hero h1').innerHTML = `${slide.first}<br><em>${slide.second}</em>`;
    $('.hero-index').innerHTML = `<span>0${heroIndex + 1}</span> / 03`;
}, 6500);

loadApp();
