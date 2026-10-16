<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond(array $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function body(): array
{
    $input = json_decode(file_get_contents('php://input'), true);
    return is_array($input) ? $input : [];
}

function require_user(): array
{
    if (empty($_SESSION['user'])) {
        respond(['error' => 'Vui lòng đăng nhập để tiếp tục.'], 401);
    }

    return $_SESSION['user'];
}

function require_admin(): array
{
    $user = require_user();
    if ($user['role'] !== 'admin') {
        respond(['error' => 'Bạn không có quyền thực hiện thao tác này.'], 403);
    }

    return $user;
}

function clean_string(mixed $value, int $max = 255): string
{
    return mb_substr(trim((string)$value), 0, $max);
}

try {
    $pdo = db();
    $method = $_SERVER['REQUEST_METHOD'];
    $action = clean_string($_GET['action'] ?? '');
    $input = $method === 'POST' ? body() : [];

    if ($method === 'GET') {
        switch ($action) {
            case 'movies':
                $status = clean_string($_GET['status'] ?? '');
                $sql = 'SELECT id, title, english_title, genre, duration, age_rating, release_date,
                        synopsis, director, cast_names, language, poster_url, backdrop_url, trailer_url, status
                        FROM movies';
                $params = [];
                if (in_array($status, ['now_showing', 'coming_soon', 'sneakshow'], true)) {
                    $sql .= ' WHERE status = ?';
                    $params[] = $status;
                }
                $sql .= ' ORDER BY release_date DESC, id DESC';
                $query = $pdo->prepare($sql);
                $query->execute($params);
                respond(['movies' => $query->fetchAll()]);

            case 'cinemas':
                respond(['cinemas' => $pdo->query(
                    'SELECT id, name, city, address, phone, amenities, image_url FROM cinemas ORDER BY city, name'
                )->fetchAll()]);

            case 'shows':
                $filters = [];
                $params = [];
                foreach (['movie_id', 'cinema_id'] as $key) {
                    if (isset($_GET[$key]) && ctype_digit((string)$_GET[$key])) {
                        $filters[] = "sh.$key = ?";
                        $params[] = (int)$_GET[$key];
                    }
                }
                $date = clean_string($_GET['date'] ?? date('Y-m-d'));
                if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
                    respond(['error' => 'Ngày chiếu không hợp lệ.'], 422);
                }
                $filters[] = 'DATE(sh.starts_at) = ?';
                $params[] = $date;
                $filters[] = 'sh.starts_at > NOW()';
                $statement = $pdo->prepare(
                    'SELECT sh.id, sh.movie_id, sh.cinema_id, sh.room_id, sh.starts_at, sh.format, sh.ticket_price,
                     m.title AS movie_title, c.name AS cinema_name, c.city, r.name AS room_name,
                     (SELECT COUNT(*) FROM seats s WHERE s.room_id = sh.room_id) AS seat_count,
                     (SELECT COUNT(*) FROM booking_seats bs JOIN bookings b ON b.id = bs.booking_id
                      WHERE bs.showtime_id = sh.id AND b.status IN ("paid", "checked_in")) AS sold_count
                     FROM showtimes sh JOIN movies m ON m.id = sh.movie_id
                     JOIN cinemas c ON c.id = sh.cinema_id JOIN rooms r ON r.id = sh.room_id
                     WHERE ' . implode(' AND ', $filters) . ' ORDER BY c.name, sh.starts_at'
                );
                $statement->execute($params);
                respond(['showtimes' => $statement->fetchAll()]);

            case 'seats':
                $showtimeId = filter_var($_GET['showtime_id'] ?? null, FILTER_VALIDATE_INT);
                if (!$showtimeId) {
                    respond(['error' => 'Vui lòng chọn suất chiếu.'], 422);
                }
                $query = $pdo->prepare('SELECT room_id FROM showtimes WHERE id = ?');
                $query->execute([$showtimeId]);
                $roomId = $query->fetchColumn();
                if (!$roomId) {
                    respond(['error' => 'Không tìm thấy suất chiếu.'], 404);
                }
                $query = $pdo->prepare(
                    'SELECT s.id, s.row_label, s.seat_number, s.type,
                     (SELECT COUNT(*) FROM booking_seats bs JOIN bookings b ON b.id = bs.booking_id
                      WHERE bs.showtime_id = ? AND bs.seat_id = s.id AND b.status IN ("paid", "checked_in")) AS sold
                     FROM seats s WHERE s.room_id = ? ORDER BY s.row_label, s.seat_number'
                );
                $query->execute([$showtimeId, $roomId]);
                respond(['seats' => $query->fetchAll()]);

            case 'foods':
                respond(['products' => $pdo->query(
                    'SELECT id, name, description, category, price, image_url FROM products WHERE active = 1 ORDER BY category, id'
                )->fetchAll()]);

            case 'promotions':
                respond(['promotions' => $pdo->query(
                    'SELECT id, title, description, code, image_url, valid_until FROM promotions
                     WHERE active = 1 AND valid_until >= CURDATE() ORDER BY valid_until'
                )->fetchAll()]);

            case 'me':
                if (empty($_SESSION['user'])) {
                    respond(['user' => null]);
                }
                $query = $pdo->prepare(
                    'SELECT id, full_name, email, phone, role, member_tier, loyalty_points FROM users WHERE id = ?'
                );
                $query->execute([$_SESSION['user']['id']]);
                $user = $query->fetch();
                $_SESSION['user'] = $user ?: null;
                respond(['user' => $user]);

            case 'history':
                $user = require_user();
                $query = $pdo->prepare(
                    'SELECT b.id, b.booking_code, b.total, b.status, b.payment_method, b.created_at,
                     m.title AS movie_title, c.name AS cinema_name, sh.starts_at,
                     GROUP_CONCAT(s.seat_code ORDER BY s.row_label, s.seat_number SEPARATOR ", ") AS seats
                     FROM bookings b JOIN showtimes sh ON sh.id = b.showtime_id
                     JOIN movies m ON m.id = sh.movie_id JOIN cinemas c ON c.id = sh.cinema_id
                     LEFT JOIN booking_seats bs ON bs.booking_id = b.id LEFT JOIN seats s ON s.id = bs.seat_id
                     WHERE b.user_id = ?
                     GROUP BY b.id, b.booking_code, b.total, b.status, b.payment_method, b.created_at,
                         m.title, c.name, sh.starts_at
                     ORDER BY b.created_at DESC'
                );
                $query->execute([$user['id']]);
                respond(['bookings' => $query->fetchAll()]);

            case 'admin-data':
                require_admin();
                $summary = $pdo->query(
                    'SELECT COUNT(*) AS booking_count,
                     COALESCE(SUM(CASE WHEN status IN ("paid", "checked_in") THEN total ELSE 0 END), 0) AS revenue,
                     COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() AND status IN ("paid", "checked_in")
                         THEN total ELSE 0 END), 0) AS today_revenue
                     FROM bookings'
                )->fetch();
                respond([
                    'summary' => $summary,
                    'movies' => $pdo->query(
                        'SELECT id, title, english_title, genre, duration, age_rating, release_date, synopsis,
                         director, cast_names, language, poster_url, backdrop_url, trailer_url, status
                         FROM movies ORDER BY id DESC'
                    )->fetchAll(),
                    'products' => $pdo->query(
                        'SELECT id, name, description, category, price, image_url, active FROM products ORDER BY id DESC'
                    )->fetchAll(),
                    'cinemas' => $pdo->query(
                        'SELECT id, name, city, address, phone, amenities, image_url FROM cinemas ORDER BY name'
                    )->fetchAll(),
                    'rooms' => $pdo->query(
                        'SELECT r.id, r.cinema_id, r.name, r.format, COUNT(s.id) AS seat_count
                         FROM rooms r LEFT JOIN seats s ON s.room_id = r.id
                         GROUP BY r.id, r.cinema_id, r.name, r.format ORDER BY r.cinema_id, r.name'
                    )->fetchAll(),
                    'shows' => $pdo->query(
                        'SELECT sh.id, m.title AS movie_title, c.name AS cinema_name, sh.starts_at, sh.format
                         FROM showtimes sh JOIN movies m ON m.id = sh.movie_id
                         JOIN cinemas c ON c.id = sh.cinema_id WHERE sh.starts_at >= NOW()
                         ORDER BY sh.starts_at LIMIT 10'
                    )->fetchAll(),
                ]);

            default:
                respond(['error' => 'Không tìm thấy chức năng yêu cầu.'], 404);
        }
    }

    if ($method !== 'POST') {
        respond(['error' => 'Phương thức không được hỗ trợ.'], 405);
    }

    switch ($action) {
        case 'register':
            $name = clean_string($input['full_name'] ?? '', 120);
            $email = strtolower(clean_string($input['email'] ?? '', 190));
            $phone = clean_string($input['phone'] ?? '', 20);
            $password = (string)($input['password'] ?? '');
            if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) ||
                !preg_match('/^[0-9+\-\s]{9,20}$/', $phone) || strlen($password) < 8) {
                respond(['error' => 'Vui lòng nhập tên, email hợp lệ, số điện thoại và mật khẩu tối thiểu 8 ký tự.'], 422);
            }
            $query = $pdo->prepare(
                'INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)'
            );
            try {
                $query->execute([$name, $email, $phone, password_hash($password, PASSWORD_DEFAULT)]);
            } catch (PDOException $exception) {
                if ($exception->getCode() === '23000') {
                    respond(['error' => 'Email hoặc số điện thoại đã được đăng ký.'], 409);
                }
                throw $exception;
            }
            session_regenerate_id(true);
            $_SESSION['user'] = [
                'id' => (int)$pdo->lastInsertId(), 'full_name' => $name, 'email' => $email,
                'phone' => $phone, 'role' => 'customer', 'member_tier' => 'C’Friend', 'loyalty_points' => 0,
            ];
            respond(['user' => $_SESSION['user']]);

        case 'login':
            $identity = clean_string($input['identity'] ?? '', 190);
            $query = $pdo->prepare(
                'SELECT id, full_name, email, phone, password_hash, role, member_tier, loyalty_points
                 FROM users WHERE email = ? OR phone = ? LIMIT 1'
            );
            $query->execute([strtolower($identity), $identity]);
            $user = $query->fetch();
            if (!$user || !password_verify((string)($input['password'] ?? ''), $user['password_hash'])) {
                respond(['error' => 'Email/số điện thoại hoặc mật khẩu chưa chính xác.'], 401);
            }
            unset($user['password_hash']);
            session_regenerate_id(true);
            $_SESSION['user'] = $user;
            respond(['user' => $user]);

        case 'logout':
            $_SESSION = [];
            if (ini_get('session.use_cookies')) {
                $params = session_get_cookie_params();
                setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
            }
            session_destroy();
            respond(['success' => true]);

        case 'booking':
            $user = require_user();
            $showtimeId = filter_var($input['showtime_id'] ?? null, FILTER_VALIDATE_INT);
            $seatIds = array_values(array_unique(array_filter(
                array_map('intval', is_array($input['seats'] ?? null) ? $input['seats'] : []),
                static fn(int $id): bool => $id > 0
            )));
            $name = clean_string($input['full_name'] ?? $user['full_name'], 120);
            $email = strtolower(clean_string($input['email'] ?? $user['email'], 190));
            $phone = clean_string($input['phone'] ?? $user['phone'], 20);
            $payment = clean_string($input['payment_method'] ?? '', 30);
            $allowedPayments = ['vnpay', 'momo', 'zalopay', 'atm', 'visa'];
            if (!$showtimeId || count($seatIds) < 1 || count($seatIds) > 8 ||
                $name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) ||
                !preg_match('/^[0-9+\-\s]{9,20}$/', $phone) || !in_array($payment, $allowedPayments, true)) {
                respond(['error' => 'Thông tin thanh toán hoặc danh sách ghế chưa hợp lệ.'], 422);
            }
            $products = is_array($input['products'] ?? null) ? $input['products'] : [];
            $pdo->beginTransaction();
            try {
                $query = $pdo->prepare(
                    'SELECT id, room_id, ticket_price, starts_at FROM showtimes WHERE id = ? AND starts_at > NOW() FOR UPDATE'
                );
                $query->execute([$showtimeId]);
                $show = $query->fetch();
                if (!$show) {
                    throw new DomainException('Suất chiếu không còn khả dụng.');
                }
                $placeholders = implode(',', array_fill(0, count($seatIds), '?'));
                $query = $pdo->prepare(
                    "SELECT id, type FROM seats WHERE room_id = ? AND id IN ($placeholders)"
                );
                $query->execute(array_merge([$show['room_id']], $seatIds));
                $selectedSeats = $query->fetchAll();
                if (count($selectedSeats) !== count($seatIds)) {
                    throw new DomainException('Một hoặc nhiều ghế không thuộc phòng chiếu này.');
                }
                $weekendExtra = (int)(new DateTimeImmutable($show['starts_at']))->format('N') >= 6 ? 10000 : 0;
                $extraByType = [
                    'standard' => $weekendExtra,
                    'vip' => 25000 + $weekendExtra,
                    'sweetbox' => 70000 + $weekendExtra,
                ];
                $seatTotal = 0;
                foreach ($selectedSeats as $seat) {
                    $seatTotal += (int)$show['ticket_price'] + ($extraByType[$seat['type']] ?? 0);
                }
                $productTotal = 0;
                $validProducts = [];
                $productQuery = $pdo->prepare('SELECT id, name, price FROM products WHERE id = ? AND active = 1');
                foreach ($products as $product) {
                    $productId = filter_var($product['id'] ?? null, FILTER_VALIDATE_INT);
                    $qty = filter_var($product['qty'] ?? null, FILTER_VALIDATE_INT);
                    if (!$productId || !$qty || $qty < 1 || $qty > 10) {
                        continue;
                    }
                    $productQuery->execute([$productId]);
                    $item = $productQuery->fetch();
                    if ($item) {
                        $validProducts[] = [$item, $qty];
                        $productTotal += (int)$item['price'] * $qty;
                    }
                }
                $subtotal = $seatTotal + $productTotal;
                $promoCode = strtoupper(clean_string($input['promo_code'] ?? '', 40));
                $discount = 0;
                if ($promoCode !== '') {
                    $promoQuery = $pdo->prepare(
                        'SELECT discount_type, discount_value FROM promotions
                         WHERE code = ? AND active = 1 AND valid_until >= CURDATE()'
                    );
                    $promoQuery->execute([$promoCode]);
                    $promotion = $promoQuery->fetch();
                    if (!$promotion) {
                        throw new DomainException('Mã ưu đãi không hợp lệ hoặc đã hết hạn.');
                    }
                    if ($promoCode === 'TUESDAY55' && (int)(new DateTimeImmutable($show['starts_at']))->format('N') !== 2) {
                        throw new DomainException('Ưu đãi TUESDAY55 chỉ áp dụng cho suất chiếu thứ Ba.');
                    }
                    $discount = $promotion['discount_type'] === 'percent'
                        ? min((int)round($subtotal * (int)$promotion['discount_value'] / 100), 50000)
                        : min((int)$promotion['discount_value'], $subtotal);
                }
                $total = max(0, $subtotal - $discount);
                $code = 'PX' . date('ymd') . strtoupper(bin2hex(random_bytes(3)));
                $query = $pdo->prepare(
                    'INSERT INTO bookings (user_id, showtime_id, booking_code, full_name, email, phone,
                     payment_method, subtotal, discount, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "paid")'
                );
                $query->execute([$user['id'], $showtimeId, $code, $name, $email, $phone, $payment, $subtotal, $discount, $total]);
                $bookingId = (int)$pdo->lastInsertId();
                $seatInsert = $pdo->prepare(
                    'INSERT INTO booking_seats (booking_id, showtime_id, seat_id, price) VALUES (?, ?, ?, ?)'
                );
                foreach ($selectedSeats as $seat) {
                    $seatInsert->execute([
                        $bookingId, $showtimeId, $seat['id'],
                        (int)$show['ticket_price'] + ($extraByType[$seat['type']] ?? 0),
                    ]);
                }
                $itemInsert = $pdo->prepare(
                    'INSERT INTO booking_items (booking_id, product_id, product_name, quantity, unit_price)
                     VALUES (?, ?, ?, ?, ?)'
                );
                foreach ($validProducts as [$item, $qty]) {
                    $itemInsert->execute([$bookingId, $item['id'], $item['name'], $qty, $item['price']]);
                }
                $points = (int)floor($total / 10000);
                $pdo->prepare('UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?')
                    ->execute([$points, $user['id']]);
                $pdo->commit();
                respond([
                    'booking' => [
                        'id' => $bookingId, 'booking_code' => $code, 'total' => $total, 'discount' => $discount,
                        'seats' => count($seatIds), 'points_earned' => $points, 'status' => 'paid',
                    ],
                ], 201);
            } catch (DomainException $exception) {
                $pdo->rollBack();
                respond(['error' => $exception->getMessage()], 422);
            } catch (PDOException $exception) {
                $pdo->rollBack();
                if ($exception->getCode() === '23000') {
                    respond(['error' => 'Ghế vừa được khách khác đặt. Vui lòng chọn ghế khác.'], 409);
                }
                throw $exception;
            }

        case 'admin-movie-save':
            require_admin();
            $id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT) ?: null;
            $title = clean_string($input['title'] ?? '', 180);
            $english = clean_string($input['english_title'] ?? '', 180);
            $genre = clean_string($input['genre'] ?? '', 120);
            $rating = clean_string($input['age_rating'] ?? 'P', 10);
            $status = clean_string($input['status'] ?? 'now_showing', 20);
            $duration = filter_var($input['duration'] ?? null, FILTER_VALIDATE_INT);
            $release = clean_string($input['release_date'] ?? date('Y-m-d'), 10);
            if ($title === '' || !$duration || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $release) ||
                !in_array($status, ['now_showing', 'coming_soon', 'sneakshow'], true) ||
                !in_array($rating, ['P', 'K', 'T13', 'T16', 'T18', 'C'], true)) {
                respond(['error' => 'Thông tin phim chưa hợp lệ.'], 422);
            }
            $values = [
                $title, $english, $genre, $duration, $rating, $release,
                clean_string($input['synopsis'] ?? '', 3000),
                clean_string($input['director'] ?? '', 150),
                clean_string($input['cast_names'] ?? '', 500),
                clean_string($input['language'] ?? 'Tiếng Việt', 80),
                clean_string($input['poster_url'] ?? '', 500),
                clean_string($input['backdrop_url'] ?? '', 500),
                clean_string($input['trailer_url'] ?? '', 500), $status,
            ];
            if ($id) {
                $pdo->prepare(
                    'UPDATE movies SET title=?, english_title=?, genre=?, duration=?, age_rating=?, release_date=?,
                     synopsis=?, director=?, cast_names=?, language=?, poster_url=?, backdrop_url=?, trailer_url=?, status=?
                     WHERE id=?'
                )->execute(array_merge($values, [$id]));
            } else {
                $pdo->prepare(
                    'INSERT INTO movies (title, english_title, genre, duration, age_rating, release_date, synopsis,
                     director, cast_names, language, poster_url, backdrop_url, trailer_url, status)
                     VALUES (' . implode(',', array_fill(0, count($values), '?')) . ')'
                )->execute($values);
            }
            respond(['success' => true]);

        case 'admin-movie-delete':
            require_admin();
            $id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT);
            if (!$id) {
                respond(['error' => 'Mã phim không hợp lệ.'], 422);
            }
            $query = $pdo->prepare('DELETE FROM movies WHERE id = ?');
            try {
                $query->execute([$id]);
            } catch (PDOException $exception) {
                if ($exception->getCode() === '23000') {
                    respond(['error' => 'Không thể xóa phim đã có giao dịch đặt vé.'], 409);
                }
                throw $exception;
            }
            respond(['success' => true]);

        case 'admin-product-save':
            require_admin();
            $id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT) ?: null;
            $name = clean_string($input['name'] ?? '', 160);
            $category = clean_string($input['category'] ?? 'combo', 20);
            $price = filter_var($input['price'] ?? null, FILTER_VALIDATE_INT);
            if ($name === '' || !$price || $price < 1 ||
                !in_array($category, ['combo', 'popcorn', 'drink', 'snack'], true)) {
                respond(['error' => 'Tên, loại sản phẩm hoặc giá chưa hợp lệ.'], 422);
            }
            $values = [
                $name, clean_string($input['description'] ?? '', 500), $category, $price,
                clean_string($input['image_url'] ?? '', 500),
            ];
            if ($id) {
                $pdo->prepare(
                    'UPDATE products SET name=?, description=?, category=?, price=?, image_url=? WHERE id=?'
                )->execute(array_merge($values, [$id]));
            } else {
                $pdo->prepare(
                    'INSERT INTO products (name, description, category, price, image_url) VALUES (?, ?, ?, ?, ?)'
                )->execute($values);
            }
            respond(['success' => true]);

        case 'admin-product-toggle':
            require_admin();
            $id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT);
            if (!$id) {
                respond(['error' => 'Mã sản phẩm không hợp lệ.'], 422);
            }
            $pdo->prepare('UPDATE products SET active = 1 - active WHERE id = ?')->execute([$id]);
            respond(['success' => true]);

        case 'admin-cinema-save':
            require_admin();
            $name = clean_string($input['name'] ?? '', 180);
            $city = clean_string($input['city'] ?? '', 100);
            $address = clean_string($input['address'] ?? '', 255);
            if ($name === '' || $city === '' || $address === '') {
                respond(['error' => 'Tên rạp, thành phố và địa chỉ là bắt buộc.'], 422);
            }
            $pdo->prepare(
                'INSERT INTO cinemas (name, city, address, phone, amenities, image_url) VALUES (?, ?, ?, ?, ?, ?)'
            )->execute([
                $name, $city, $address, clean_string($input['phone'] ?? '', 30),
                clean_string($input['amenities'] ?? '', 500), clean_string($input['image_url'] ?? '', 500),
            ]);
            respond(['success' => true]);

        case 'admin-room-save':
            require_admin();
            $cinemaId = filter_var($input['cinema_id'] ?? null, FILTER_VALIDATE_INT);
            $name = clean_string($input['name'] ?? '', 100);
            $format = clean_string($input['format'] ?? '2D', 30);
            $rowCount = filter_var($input['row_count'] ?? null, FILTER_VALIDATE_INT);
            $columnCount = filter_var($input['column_count'] ?? null, FILTER_VALIDATE_INT);
            if (!$cinemaId || $name === '' || !$rowCount || !$columnCount ||
                $rowCount < 3 || $rowCount > 12 || $columnCount < 4 || $columnCount > 16) {
                respond(['error' => 'Kiểm tra rạp, tên phòng và sơ đồ ghế (3–12 hàng, 4–16 cột).'], 422);
            }
            $pdo->beginTransaction();
            try {
                $query = $pdo->prepare('INSERT INTO rooms (cinema_id, name, format) VALUES (?, ?, ?)');
                $query->execute([$cinemaId, $name, $format]);
                $roomId = (int)$pdo->lastInsertId();
                $seatInsert = $pdo->prepare(
                    'INSERT INTO seats (room_id, row_label, seat_number, seat_code, type) VALUES (?, ?, ?, ?, ?)'
                );
                for ($row = 1; $row <= $rowCount; $row++) {
                    for ($column = 1; $column <= $columnCount; $column++) {
                        $type = $row >= $rowCount - 1
                            ? 'sweetbox'
                            : ($row >= $rowCount - 3 ? 'vip' : 'standard');
                        $seatInsert->execute([
                            $roomId, chr(64 + $row), $column,
                            chr(64 + $row) . str_pad((string)$column, 2, '0', STR_PAD_LEFT), $type,
                        ]);
                    }
                }
                $pdo->commit();
            } catch (Throwable $exception) {
                $pdo->rollBack();
                throw $exception;
            }
            respond(['success' => true]);

        case 'admin-showtime-save':
            require_admin();
            $movieId = filter_var($input['movie_id'] ?? null, FILTER_VALIDATE_INT);
            $roomId = filter_var($input['room_id'] ?? null, FILTER_VALIDATE_INT);
            $startsAt = clean_string($input['starts_at'] ?? '', 19);
            if (!$movieId || !$roomId || !preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/', $startsAt)) {
                respond(['error' => 'Vui lòng chọn phim, phòng chiếu và thời gian hợp lệ.'], 422);
            }
            $query = $pdo->prepare('SELECT cinema_id, format FROM rooms WHERE id = ?');
            $query->execute([$roomId]);
            $room = $query->fetch();
            if (!$room) {
                respond(['error' => 'Không tìm thấy phòng chiếu.'], 404);
            }
            $price = filter_var($input['ticket_price'] ?? 85000, FILTER_VALIDATE_INT);
            if (!$price || $price < 1000) {
                respond(['error' => 'Giá vé không hợp lệ.'], 422);
            }
            $pdo->prepare(
                'INSERT INTO showtimes (movie_id, cinema_id, room_id, starts_at, format, ticket_price)
                 VALUES (?, ?, ?, ?, ?, ?)'
            )->execute([$movieId, $room['cinema_id'], $roomId, str_replace('T', ' ', $startsAt) . ':00', $room['format'], $price]);
            respond(['success' => true]);

        case 'admin-checkin':
            require_admin();
            $code = strtoupper(clean_string($input['booking_code'] ?? '', 30));
            $query = $pdo->prepare(
                'UPDATE bookings SET status = "checked_in" WHERE booking_code = ? AND status = "paid"'
            );
            $query->execute([$code]);
            if ($query->rowCount() !== 1) {
                respond(['error' => 'Không tìm thấy vé hợp lệ hoặc vé đã được soát.'], 404);
            }
            respond(['success' => true, 'message' => 'Soát vé thành công.']);

        default:
            respond(['error' => 'Không tìm thấy chức năng yêu cầu.'], 404);
    }
} catch (Throwable $exception) {
    error_log('[Phu Xuan Cinema] ' . $exception->getMessage());
    respond(['error' => 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'], 500);
}
