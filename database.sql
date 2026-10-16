CREATE DATABASE IF NOT EXISTS phuxuan_cinema CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE phuxuan_cinema;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
    member_tier ENUM('C’Friend', 'C’VIP') NOT NULL DEFAULT 'C’Friend',
    loyalty_points INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cinemas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(180) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL DEFAULT '',
    amenities VARCHAR(500) NOT NULL DEFAULT '',
    image_url VARCHAR(500) NOT NULL DEFAULT ''
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS movies (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    english_title VARCHAR(180) NOT NULL DEFAULT '',
    genre VARCHAR(120) NOT NULL DEFAULT '',
    duration SMALLINT UNSIGNED NOT NULL,
    age_rating ENUM('P', 'K', 'T13', 'T16', 'T18', 'C') NOT NULL DEFAULT 'P',
    release_date DATE NOT NULL,
    synopsis TEXT NOT NULL,
    director VARCHAR(150) NOT NULL DEFAULT '',
    cast_names VARCHAR(500) NOT NULL DEFAULT '',
    language VARCHAR(80) NOT NULL DEFAULT 'Tiếng Việt',
    poster_url VARCHAR(500) NOT NULL DEFAULT '',
    backdrop_url VARCHAR(500) NOT NULL DEFAULT '',
    trailer_url VARCHAR(500) NOT NULL DEFAULT '',
    status ENUM('now_showing', 'coming_soon', 'sneakshow') NOT NULL DEFAULT 'now_showing',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rooms (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cinema_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    format VARCHAR(30) NOT NULL DEFAULT '2D',
    FOREIGN KEY (cinema_id) REFERENCES cinemas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS seats (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT UNSIGNED NOT NULL,
    row_label CHAR(1) NOT NULL,
    seat_number SMALLINT UNSIGNED NOT NULL,
    seat_code VARCHAR(5) NOT NULL,
    type ENUM('standard', 'vip', 'sweetbox') NOT NULL DEFAULT 'standard',
    UNIQUE KEY uq_room_seat (room_id, seat_code),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS showtimes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    movie_id BIGINT UNSIGNED NOT NULL,
    cinema_id BIGINT UNSIGNED NOT NULL,
    room_id BIGINT UNSIGNED NOT NULL,
    starts_at DATETIME NOT NULL,
    format VARCHAR(30) NOT NULL DEFAULT '2D',
    ticket_price INT UNSIGNED NOT NULL,
    INDEX idx_showtime_lookup (movie_id, cinema_id, starts_at),
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (cinema_id) REFERENCES cinemas(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    description VARCHAR(500) NOT NULL DEFAULT '',
    category ENUM('combo', 'popcorn', 'drink', 'snack') NOT NULL DEFAULT 'combo',
    price INT UNSIGNED NOT NULL,
    image_url VARCHAR(500) NOT NULL DEFAULT '',
    active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS promotions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    description VARCHAR(500) NOT NULL DEFAULT '',
    code VARCHAR(40) NOT NULL DEFAULT '',
    discount_type ENUM('none', 'percent', 'fixed') NOT NULL DEFAULT 'none',
    discount_value INT UNSIGNED NOT NULL DEFAULT 0,
    image_url VARCHAR(500) NOT NULL DEFAULT '',
    valid_until DATE NOT NULL,
    active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bookings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    showtime_id BIGINT UNSIGNED NOT NULL,
    booking_code VARCHAR(30) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    payment_method ENUM('vnpay', 'momo', 'zalopay', 'atm', 'visa') NOT NULL,
    subtotal INT UNSIGNED NOT NULL,
    discount INT UNSIGNED NOT NULL DEFAULT 0,
    total INT UNSIGNED NOT NULL,
    status ENUM('paid', 'checked_in', 'cancelled') NOT NULL DEFAULT 'paid',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_booking_report (created_at, status),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (showtime_id) REFERENCES showtimes(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS booking_seats (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT UNSIGNED NOT NULL,
    showtime_id BIGINT UNSIGNED NOT NULL,
    seat_id BIGINT UNSIGNED NOT NULL,
    price INT UNSIGNED NOT NULL,
    UNIQUE KEY uq_showtime_seat (showtime_id, seat_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (showtime_id) REFERENCES showtimes(id),
    FOREIGN KEY (seat_id) REFERENCES seats(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS booking_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NULL,
    product_name VARCHAR(160) NOT NULL,
    quantity SMALLINT UNSIGNED NOT NULL,
    unit_price INT UNSIGNED NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT INTO users (full_name, email, phone, password_hash, role, member_tier, loyalty_points)
VALUES ('Quản trị Phú Xuân', 'admin@phuxuancinema.vn', '0900000000',
        '$2y$10$X1n.xaYknKnrew3HZEY9yOIBO3LZIeDiA.kcrhsSwgj3SIzXtg5JS', 'admin', 'C’VIP', 1250);

INSERT INTO cinemas (name, city, address, phone, amenities, image_url) VALUES
('Phú Xuân Riverside', 'Huế', 'Tầng 4, Vincom Plaza Huế, 50A Hùng Vương', '0234 389 8888', 'Dolby Atmos · Phòng chiếu VIP · Bãi đỗ xe', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=85'),
('Phú Xuân Imperial', 'Huế', '12 Lê Lợi, phường Vĩnh Ninh, Thành phố Huế', '0234 355 6688', 'Laser Projection · Sweetbox · Café', 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1200&q=85');

INSERT INTO movies (title, english_title, genre, duration, age_rating, release_date, synopsis, director, cast_names, language, poster_url, backdrop_url, trailer_url, status) VALUES
('Ngày Nắng Cuối Cùng', 'The Last Summer Day', 'Tâm lý · Lãng mạn', 118, 'T13', DATE_SUB(CURDATE(), INTERVAL 12 DAY), 'Một cuộc gặp tình cờ bên dòng Hương Giang khiến An và Minh nhìn lại những điều chưa kịp nói. Giữa phố Huế chậm rãi, họ học cách bắt đầu lại từ những điều bình dị nhất.', 'Trần Minh Đức', 'Kaity Nguyễn, Liên Bỉnh Phát, Hồng Ánh', 'Tiếng Việt', 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=900&q=85', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=85', 'https://www.youtube.com/embed/ScMzIvxBSi4', 'now_showing'),
('Vùng Trời Bí Ẩn', 'Beyond the Blue', 'Phiêu lưu · Khoa học viễn tưởng', 132, 'T13', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'Khi tín hiệu lạ vang lên từ vùng biển sâu, một nhà hải dương học trẻ bắt đầu hành trình vượt khỏi mọi giới hạn đã biết của con người.', 'Lê Hoàng Nam', 'Ninh Dương Lan Ngọc, Quốc Trường', 'Tiếng Việt', 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=85', 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1800&q=85', 'https://www.youtube.com/embed/ScMzIvxBSi4', 'now_showing'),
('Tiệm Ăn Của Ký Ức', 'Memory Kitchen', 'Gia đình · Hài', 105, 'P', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'Ở một tiệm ăn nhỏ, mỗi món ăn đều kể một câu chuyện. Ba thế hệ trong một gia đình tìm lại tiếng cười và những hương vị thân quen.', 'Nguyễn Phương Anh', 'Thu Trang, Tiến Luật, Thanh Sơn', 'Tiếng Việt', 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=900&q=85', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=85', 'https://www.youtube.com/embed/ScMzIvxBSi4', 'now_showing'),
('Đêm Trên Đèo Mây', 'Nightfall Ridge', 'Kinh dị · Bí ẩn', 110, 'T18', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Một nhóm bạn lạc đường giữa cung đèo phủ sương. Khi màn đêm buông xuống, những bí mật bị chôn giấu cũng thức tỉnh.', 'Võ Thanh Tùng', 'Mạc Văn Khoa, Lâm Thanh Mỹ', 'Tiếng Việt', 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=85', 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1800&q=85', 'https://www.youtube.com/embed/ScMzIvxBSi4', 'now_showing'),
('Mùa Hè Của Em', 'Summer of You', 'Tình cảm · Thanh xuân', 112, 'K', DATE_ADD(CURDATE(), INTERVAL 8 DAY), 'Một mùa hè cuối cùng trước ngưỡng cửa trưởng thành, với những lời hứa, tình bạn và tình yêu đầu đời.', 'Phạm Gia Bảo', 'Avin Lu, Hoàng Hà', 'Tiếng Việt', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=85', 'https://www.youtube.com/embed/ScMzIvxBSi4', 'coming_soon'),
('Hành Tinh Thứ Tám', 'Planet Eight', 'Khoa học viễn tưởng · Phiêu lưu', 144, 'T13', DATE_ADD(CURDATE(), INTERVAL 14 DAY), 'Trên hành tinh xa xôi, những người sống sót cuối cùng phải lựa chọn giữa trở về và xây dựng một mái nhà mới.', 'Đỗ Nhật Minh', 'Hứa Vĩ Văn, Jun Vũ', 'Tiếng Việt', 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=900&q=85', 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1800&q=85', 'https://www.youtube.com/embed/ScMzIvxBSi4', 'coming_soon'),
('Bức Thư Chưa Gửi', 'Letters Never Sent', 'Tâm lý · Tình cảm', 101, 'T13', DATE_ADD(CURDATE(), INTERVAL 20 DAY), 'Một chiếc hộp thư cũ mở ra hành trình đi tìm chủ nhân của những lá thư chưa bao giờ đến tay người nhận.', 'Bùi Lan Hương', 'Phương Anh Đào, Tuấn Trần', 'Tiếng Việt', 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=900&q=85', 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=1800&q=85', 'https://www.youtube.com/embed/ScMzIvxBSi4', 'coming_soon'),
('Chuyến Tàu Lúc Nửa Đêm', 'Midnight Express', 'Hành động · Hồi hộp', 126, 'T16', DATE_ADD(CURDATE(), INTERVAL 26 DAY), 'Trên chuyến tàu xuyên đêm, một hành khách bình thường vô tình nắm giữ chìa khóa của một vụ án quốc tế.', 'Vũ Hoàng Long', 'Thái Hòa, Isaac', 'Tiếng Việt', 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=900&q=85', 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1800&q=85', 'https://www.youtube.com/embed/ScMzIvxBSi4', 'coming_soon'),
('Trăng Rằm Trên Phố', 'Moonlit Streets', 'Tâm lý · Gia đình', 107, 'P', DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'Đón xem suất chiếu đặc biệt đầu tiên của câu chuyện ấm áp về một mùa đoàn viên tại cố đô Huế.', 'Nguyễn An Nhiên', 'Hồng Đào, Lê Khanh', 'Tiếng Việt', 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=85', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=85', 'https://www.youtube.com/embed/ScMzIvxBSi4', 'sneakshow'),
('Mật Mã Di Sản', 'Heritage Code', 'Phiêu lưu · Bí ẩn', 121, 'T13', DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'Một mật mã cổ đưa nhà khảo cổ trẻ vào cuộc chạy đua tìm kiếm báu vật giữa những di tích kỳ vĩ.', 'Trần Khải Hoàn', 'Liên Bỉnh Phát, Kaity Nguyễn', 'Tiếng Việt', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=85', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=85', 'https://www.youtube.com/embed/ScMzIvxBSi4', 'sneakshow');

INSERT INTO rooms (cinema_id, name, format) VALUES
(1, 'Phòng 01', '2D'), (1, 'Phòng 02', '3D'), (2, 'Phòng 01', '2D'), (2, 'Phòng VIP', 'VIP');

INSERT INTO seats (room_id, row_label, seat_number, seat_code, type)
WITH RECURSIVE seat_rows AS (
    SELECT 1 AS row_no UNION ALL SELECT row_no + 1 FROM seat_rows WHERE row_no < 8
), seat_columns AS (
    SELECT 1 AS seat_no UNION ALL SELECT seat_no + 1 FROM seat_columns WHERE seat_no < 10
), room_ids AS (
    SELECT id FROM rooms
)
SELECT r.id,
       CHAR(64 + seat_rows.row_no),
       seat_columns.seat_no,
       CONCAT(CHAR(64 + seat_rows.row_no), LPAD(seat_columns.seat_no, 2, '0')),
       CASE
           WHEN seat_rows.row_no IN (7, 8) AND seat_columns.seat_no IN (5, 6) THEN 'sweetbox'
           WHEN seat_rows.row_no IN (5, 6) THEN 'vip'
           ELSE 'standard'
       END
FROM room_ids r CROSS JOIN seat_rows CROSS JOIN seat_columns;

INSERT INTO showtimes (movie_id, cinema_id, room_id, starts_at, format, ticket_price)
SELECT m.id, r.cinema_id, r.id,
       DATE_ADD(NOW(), INTERVAL (ROW_NUMBER() OVER (ORDER BY m.id, r.id) % 4 + 1) HOUR),
       r.format, 85000
FROM movies m CROSS JOIN rooms r WHERE m.status = 'now_showing';

INSERT INTO products (name, description, category, price, image_url) VALUES
('Combo Phú Xuân', 'Bắp rang caramel cỡ lớn và hai nước ngọt.', 'combo', 139000, 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?auto=format&fit=crop&w=800&q=85'),
('Combo Hẹn Hò', 'Bắp đôi và hai nước ngọt mát lạnh.', 'combo', 169000, 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=800&q=85'),
('Bắp rang bơ', 'Bắp rang bơ thơm giòn, cỡ lớn.', 'popcorn', 65000, 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?auto=format&fit=crop&w=800&q=85'),
('Nước ngọt', 'Pepsi / 7Up / Mirinda, cỡ vừa.', 'drink', 39000, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=85'),
('Nachos phô mai', 'Bánh nachos giòn kèm sốt phô mai.', 'snack', 59000, 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=800&q=85');

INSERT INTO promotions (title, description, code, discount_type, discount_value, image_url, valid_until) VALUES
('Thứ Ba dịu dàng', 'Giảm 30.000đ mỗi hóa đơn vé vào thứ Ba hàng tuần.', 'TUESDAY55', 'fixed', 30000, 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1000&q=85', DATE_ADD(CURDATE(), INTERVAL 90 DAY)),
('Hẹn hò thật vui', 'Giảm 10% tổng hóa đơn với mã PHUXUAN10.', 'PHUXUAN10', 'percent', 10, 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1000&q=85', DATE_ADD(CURDATE(), INTERVAL 30 DAY)),
('Thành viên Phú Xuân', 'Tích điểm cho mọi giao dịch và đổi quà trải nghiệm.', '', 'none', 0, 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1000&q=85', DATE_ADD(CURDATE(), INTERVAL 120 DAY));
