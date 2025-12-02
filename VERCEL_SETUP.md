# Hướng dẫn Setup Vercel

## Các biến môi trường cần thiết trên Vercel

Vào **Project Settings > Environment Variables** và thêm các biến sau:

### 1. MONGODB_URI
```
mongodb+srv://hunghs25202:Hungho.02@cluster0.oas5izq.mongodb.net/?appName=Cluster0
```
**Quan trọng:** 
- Kiểm tra MongoDB Atlas có cho phép IP của Vercel không
- Vào MongoDB Atlas > Network Access > Add IP Address > Allow access from anywhere (0.0.0.0/0)

### 2. JWT_SECRET
```
your-jwt-secret-key-change-this-in-production-2024-secure
```
**Lưu ý:** Nên dùng chuỗi random dài và phức tạp

### 3. ENCRYPTION_KEY
```
your-32-char-encryption-key-2024
```
**Lưu ý:** Phải đủ 32 ký tự cho AES-256

### 4. NEXTAUTH_SECRET (optional nếu dùng NextAuth)
```
your-nextauth-secret-key-2024-secure
```

### 5. NEXTAUTH_URL
```
https://your-app-name.vercel.app
```
**Thay thế:** `your-app-name` bằng tên domain Vercel của bạn

## Các bước kiểm tra sau khi deploy

1. **Kiểm tra Environment Variables:**
   - Vào Vercel Dashboard > Project > Settings > Environment Variables
   - Đảm bảo tất cả biến đã được set cho Production, Preview, và Development

2. **Kiểm tra MongoDB Atlas:**
   - Network Access: Allow 0.0.0.0/0 (hoặc Vercel IPs)
   - Database User: Đảm bảo username/password đúng
   - Connection String: Không có ký tự đặc biệt cần encode

3. **Kiểm tra Vercel Logs:**
   - Vào Vercel Dashboard > Project > Deployments > Click vào deployment > Functions
   - Xem logs của `/api/auth/login` để debug

4. **Test API trực tiếp:**
   ```bash
   curl -X POST https://your-app.vercel.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"yourpassword"}'
   ```

## Seed Admin Account

Nếu database trống, chạy seed API:
```bash
curl -X POST https://your-app.vercel.app/api/seed
```

## Common Issues

### Issue 1: 500 Internal Server Error
- **Nguyên nhân:** Environment variables không được set
- **Giải pháp:** Kiểm tra và thêm tất cả biến môi trường

### Issue 2: Database connection timeout
- **Nguyên nhân:** MongoDB không cho phép IP của Vercel
- **Giải pháp:** Add 0.0.0.0/0 vào Network Access của MongoDB Atlas

### Issue 3: Invalid password
- **Nguyên nhân:** Mật khẩu bị hash khác nhau giữa local và production
- **Giải pháp:** Chạy lại seed API trên production

### Issue 4: CORS errors
- **Nguyên nhân:** Frontend và Backend không cùng domain
- **Giải pháp:** Đảm bảo deploy full-stack app (Next.js tự handle)
