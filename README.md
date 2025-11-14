# 🚀 Task & Report Management System

Hệ thống quản lý công việc và báo cáo nội bộ với đầy đủ tính năng phân quyền, thông báo real-time, auto-refresh và bulk operations.

## 📋 Mục lục

- [Công nghệ](#-công-nghệ)
- [Tính năng](#-tính-năng)
- [Phân quyền](#-phân-quyền)
- [Cài đặt](#-cài-đặt)
- [Tài khoản mặc định](#-tài-khoản-mặc-định)

## 💻 Công nghệ

**Stack:** Next.js 14 + TypeScript + MongoDB Atlas + Tailwind CSS

**Frontend:** React 18, Context API, React Icons, date-fns  
**Backend:** Next.js API Routes, Mongoose ODM, JWT Auth, bcryptjs  
**Export:** jsPDF, XLSX  
**File Upload:** Multer (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, Images - Max 10MB)

## ✨ Tính năng

### 🔐 Authentication & Phân quyền
- JWT Authentication với 3 roles: **Admin**, **Manager**, **User**
- Protected routes với role-based access control
- Đăng ký tạo User role, Admin có thể thay đổi thành Manager

### 📊 Dashboard
- **Auto-refresh** mỗi 30 giây + Manual refresh
- Thống kê real-time: Tasks, Reports, Completion rates
- Context-based refresh system

### 📝 Quản lý Công việc (Tasks)
- **Manager:** Tạo, sửa, giao công việc cho User
- **User:** Cập nhật status (Pending → In Progress → Completed)
- **Admin:** Xem + Xóa (bulk delete với checkbox)
- Priority levels, Deadline tracking, File attachments
- Auto-refresh sau mỗi thao tác

### 📄 Quản lý Báo cáo (Reports)
- **User:** Tạo, nộp báo cáo từ công việc
- **Manager:** Duyệt/từ chối báo cáo, thêm feedback
- **Admin:** Xem + Xóa (bulk delete với checkbox)
- Status tracking: Draft → Submitted → Approved/Rejected

### 🔔 Hệ thống Thông báo
- **Real-time notifications** với dropdown + badge count
- Auto-refresh mỗi 30 giây
- **5 loại thông báo:**
  - Task Assigned (User)
  - Task Updated/Completed (Manager)
  - Report Submitted (Manager)
  - Report Reviewed (User)
- Đánh dấu đã đọc, Xóa tất cả, Link navigation

### 👥 Quản lý Người dùng
- **Admin:** CRUD users, phân quyền roles
- Quản lý phòng ban, Upload avatar
- Tìm kiếm và filter

### 📤 Export
- Export PDF với Vietnamese locale
- Export Excel với styling
- Export Tasks, Reports, Users

## 🔑 Phân quyền

| Role | Quyền hạn |
|------|-----------|
| **👤 User** | Xem dashboard • Cập nhật status công việc • Tạo/nộp báo cáo • Nhận thông báo (task assigned, updated, report reviewed) |
| **👔 Manager** | Tất cả quyền User • Tạo/sửa công việc • Giao việc cho User • Duyệt/từ chối báo cáo • Nhận thông báo (task completed, report submitted) |
| **👨‍💼 Admin** | **View + Delete only** • Xem tất cả dữ liệu • Xóa tasks/reports (bulk delete) • Quản lý users (CRUD) • Export dữ liệu • **Không tạo/sửa tasks/reports** |

> **Lưu ý:** Đăng ký mặc định tạo User role. Admin có thể thay đổi thành Manager sau.

## 📦 Cài đặt

### Yêu cầu
- Node.js 18+ • MongoDB Atlas (hoặc local) • npm/yarn

### Các bước

```bash
# 1. Clone repository
git clone https://github.com/Azura-Deeper/Task-Report_ManagementSystem.git
cd Task-Report_ManagementSystem

# 2. Cài đặt dependencies
npm install

# 3. Tạo file .env.local
cp .env.example .env.local

# 4. Cấu hình environment variables
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/task-management
# JWT_SECRET=your-super-secret-jwt-key
# NEXT_PUBLIC_API_URL=http://localhost:3000

# 5. Seed database (tạo tài khoản mặc định)
npm run seed

# 6. Chạy development server
npm run dev

# 7. Truy cập http://localhost:3000
```

### Tạo JWT Secret mạnh
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🚀 Commands

```bash
npm run dev         # Development server
npm run build       # Production build
npm start           # Production server
npm run seed        # Seed database
npm run type-check  # TypeScript check
```

## 📁 Cấu trúc

```
app/
├── api/              # API Routes (auth, tasks, reports, notifications, users)
├── dashboard/        # Dashboard pages với sidebar layout
├── login/register/   # Auth pages
components/           # React Components (NotificationDropdown)
contexts/             # React Context (DashboardContext)
lib/
├── middleware.ts     # Auth middleware
├── mongodb.ts        # DB connection
├── models/           # Mongoose Models (User, Task, Report, Notification)
public/uploads/       # File storage (tasks/, reports/)
scripts/seed.ts       # Database seeding
```

## 🎯 Workflow

**Manager → User:**
```
Tạo công việc → Giao cho User → User nhận thông báo
→ User cập nhật status → Manager nhận thông báo khi completed
```

**User → Manager:**
```
Hoàn thành công việc → Tạo báo cáo → Nộp → Manager nhận thông báo
→ Manager duyệt/từ chối → User nhận thông báo kết quả
```

**Admin:**
```
Xem tất cả dữ liệu → Bulk delete tasks/reports → Quản lý users → Export
```

## 🔒 Security

- JWT Authentication với httpOnly cookies
- Password hashing (bcryptjs - 10 rounds)
- Role-based access control (RBAC)
- Protected API routes với middleware
- Input validation & sanitization
- File upload security (type & size check)
- MongoDB injection prevention
- Environment variables protection

## 📝 License & Author

**MIT License** - Tự do sử dụng cho mục đích học tập và thương mại.

**Author:** [Azura-Deeper](https://github.com/Azura-Deeper)  
**Repository:** [Task-Report_ManagementSystem](https://github.com/Azura-Deeper/Task-Report_ManagementSystem)

---

⭐ **Nếu project này hữu ích, hãy cho một Star nhé!** ⭐
