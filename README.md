# 🚀 Task & Report Management System

Hệ thống quản lý công việc và báo cáo nội bộ với đầy đủ tính năng phân quyền, thông báo real-time, tin nhắn mã hóa, auto-refresh và bulk operations.

## ✨ Features Highlights

- 🔐 **JWT Authentication** với 3-tier role system (Admin/Manager/User)
- 📊 **Real-time Dashboard** với auto-refresh 30s
- 📝 **Task Management** với file attachments & priority tracking
- 📄 **Report System** với approval workflow
- 🔔 **Notification System** với badge count & real-time updates
- 💬 **Encrypted Messaging** (AES-256-CBC) giữa Manager và User
- 👥 **User Management** với role-based access control
- 📤 **Export to PDF/Excel** với Vietnamese locale
- 🗑️ **Bulk Operations** (multi-select delete)
- 🔒 **End-to-end Security** với encryption & input validation

## 📋 Mục lục

- [Công nghệ](#-công-nghệ)
- [Tính năng](#-tính-năng)
- [Phân quyền](#-phân-quyền)
- [Cài đặt](#-cài-đặt)
- [Author](#-author)

## 💻 Công nghệ

**Stack:** Next.js 14 + TypeScript + MongoDB + Tailwind CSS

**Frontend:** React 18, Context API, React Icons, date-fns  
**Backend:** Next.js API Routes, Mongoose ODM, JWT Auth, bcryptjs  
**Security:** AES-256-CBC Encryption  
**Export:** jsPDF, XLSX  
**File Upload:** Max 10MB (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, Images)

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

### 💬 Hệ thống Tin nhắn (Messaging)
- **Tin nhắn mã hóa** với AES-256-CBC encryption
- Icon trong header với badge đếm tin nhắn chưa đọc
- Auto-refresh mỗi 10 giây
- **Tính năng:**
  - Giao diện 2 panel: Danh sách cuộc trò chuyện + Chat
  - Tạo chat mới với search users
  - Xóa cuộc trò chuyện (với xác nhận)
  - Hiển thị trạng thái đã đọc/chưa đọc
  - Backward compatibility với tin nhắn cũ chưa mã hóa
- **Phân quyền:** Chỉ Manager và User (Admin bị loại trừ)
- Manager ↔ Manager, Manager ↔ User, User ↔ User

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
| **👤 User** | Xem dashboard • Cập nhật status công việc • Tạo/nộp báo cáo • Nhận thông báo (task assigned, updated, report reviewed) • Nhắn tin với Manager và User khác |
| **👔 Manager** | Tất cả quyền User • Tạo/sửa công việc • Giao việc cho User • Duyệt/từ chối báo cáo • Nhận thông báo (task completed, report submitted) • Nhắn tin với Manager và User khác |
| **👨‍💼 Admin** | **View + Delete only** • Xem tất cả dữ liệu • Xóa tasks/reports (bulk delete) • Quản lý users (CRUD) • Export dữ liệu • **Không tạo/sửa tasks/reports** • **Không có quyền truy cập tin nhắn** |

> **Lưu ý:** Đăng ký mặc định tạo User role. Admin có thể thay đổi thành Manager sau.

## 📦 Cài đặt

### Yêu cầu
- Node.js 18+
- MongoDB (Atlas hoặc local)
- npm/yarn

### Các bước

```bash
# 1. Clone repository
git clone https://github.com/Azura-Deeper/Task-Report_ManagementSystem.git
cd Task-Report_ManagementSystem

# 2. Cài đặt dependencies
npm install

# 3. Tạo file .env.local với các biến môi trường cần thiết
# Xem .env.example để biết các biến cần thiết

# 4. Seed database (tạo dữ liệu mẫu)
npm run seed

# 5. Chạy development server
npm run dev

# 6. Truy cập http://localhost:3000
```

### Commands

```bash
npm run dev         # Development server
npm run build       # Production build
npm start           # Production server
npm run seed        # Seed database
```

## 👨‍💻 Author

## 👨‍💻 Author

**MIT License** - Tự do sử dụng cho mục đích học tập và thương mại.

**Developed by:** [Azura-Deeper](https://github.com/Azura-Deeper)  
**Repository:** [Task-Report_ManagementSystem](https://github.com/Azura-Deeper/Task-Report_ManagementSystem)

---

⭐ **Nếu project này hữu ích, hãy cho một Star nhé!** ⭐
