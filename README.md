# Hệ thống xác thực toàn vẹn tài liệu số

Đề tài: nghiên cứu và xây dựng hệ thống xác thực toàn vẹn tài liệu số dựa trên SHA-256 kết hợp Merkle Tree và HMAC-SHA256 trong môi trường mô phỏng tấn công.

## Ý tưởng mô phỏng

Hệ thống được tách theo đúng câu chuyện trình bày:

1. Người gửi A tạo tài liệu cần gửi cho người nhận B.
2. Server đăng ký bản gốc: lưu file, tính SHA-256 toàn file, chia block để dựng Merkle Tree, sau đó tạo HMAC-SHA256 bằng khóa bí mật phía backend.
3. Tài liệu đi qua kênh truyền mô phỏng. Có thể hiểu bước này như socket/client A gửi file qua mạng, dù hiện tại frontend gọi API FastAPI để dễ demo.
4. Kẻ tấn công có thể sửa nội dung file, chèn dữ liệu hoặc thử giả mạo hash/HMAC.
5. Gateway/backend nhận file, tính lại SHA-256, Merkle Root và kiểm tra HMAC.
6. Người nhận B chỉ nhận kết quả hợp lệ nếu server trả về VALID. Nếu file bị sửa hoặc metadata bị giả mạo, hệ thống ghi log cảnh báo.

Vai trò của từng kỹ thuật:

- SHA-256: phát hiện nội dung file có thay đổi hay không.
- Merkle Tree: xác định block nào bị thay đổi thay vì chỉ biết toàn file bị đổi.
- HMAC-SHA256: chống giả mạo metadata vì attacker không có khóa bí mật của server.

## Cấu trúc hệ thống

- `backend`: FastAPI, SQLite, xử lý upload file, tính hash, xác minh và ghi log.
- `frontend`: React + Vite + Tailwind, giao diện mô phỏng người gửi, kênh truyền, attacker, gateway, server và người nhận.

## Yêu cầu

- Python 3.11+
- Node.js và npm

Trên Windows, nếu lệnh `python` không có sẵn, dùng `py`.

## Chạy backend

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Kiểm tra backend:

```powershell
Invoke-WebRequest http://127.0.0.1:8000/api/health -UseBasicParsing
```

Kết quả đúng:

```json
{"status":"ok"}
```

## Chạy frontend

```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Mở trình duyệt tại:

```text
http://127.0.0.1:5173
```

Mặc định frontend gọi API tại:

```text
http://127.0.0.1:8000/api
```

Nếu cần đổi backend URL, tạo biến môi trường `VITE_API_BASE_URL`.

## Các màn hình chính

- `Lab truyền tài liệu`: màn hình chính để chạy trọn flow A gửi tài liệu cho B, kẻ tấn công can thiệp, server xác minh và ghi log.
- `Người dùng`: upload file gốc và upload file nhận được để kiểm tra thủ công.
- `Máy chủ`: xem file đã đăng ký, hash từng block, log xác minh và sự kiện bảo mật.
- `Kẻ tấn công`: tạo file bị sửa một byte, chèn nội dung hoặc thử giả mạo hash/HMAC.
- `Cơ sở lý thuyết`: tóm tắt SHA-256, Merkle Tree, HMAC-SHA256 và lý do cần kết hợp cả ba.

## API chính

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `GET` | `/api/health` | Kiểm tra backend đang chạy |
| `POST` | `/api/files/register` | Upload và đăng ký file gốc |
| `GET` | `/api/files` | Lấy danh sách file đã đăng ký |
| `GET` | `/api/files/{file_id}` | Lấy chi tiết file và hash từng block |
| `POST` | `/api/verify/{file_id}` | Upload file mới để so sánh với file gốc |
| `POST` | `/api/attacker/modify-byte/{file_id}` | Tạo bản file bị sửa một byte |
| `POST` | `/api/attacker/append-text/{file_id}` | Tạo bản file bị chèn nội dung |
| `POST` | `/api/attacker/fake-hash/{file_id}` | Mô phỏng giả mạo hash/HMAC |
| `GET` | `/api/logs` | Lấy log xác minh |
| `GET` | `/api/logs/security` | Lấy log sự kiện bảo mật |

## Build frontend

```powershell
cd frontend
npm run build
```

Lệnh này chạy TypeScript check và Vite production build. Output nằm trong `frontend/dist`.

## Ghi chú

- Backend cần chạy trước frontend để giao diện load được dữ liệu.
- Database SQLite nằm tại `backend/app/document_integrity.db`.
- File upload và file attacker sinh ra nằm trong `backend/app/storage`.
- Nếu muốn mô phỏng socket thật, có thể thêm một lớp WebSocket/TCP relay giữa frontend và backend. Tuy nhiên với phạm vi demo hiện tại, API mô phỏng đã đủ để thể hiện vai trò người gửi, kênh truyền, attacker, server và người nhận.
