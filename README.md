#  Task & Report Management System

Hệ thống quản lý công việc và báo cáo với realtime messaging, phân quyền đầy đủ, và nhiều tính năng nâng cao.

##  Tính năng nổi bật

-  **Authentication**: JWT với 3-tier roles (Admin/Manager/User)
-  **Dashboard**: Real-time statistics với auto-refresh
-  **Task Management**: CRUD, assignments, priorities, deadlines, file attachments
-  **Report System**: Submission workflow với approval process
-  **Notifications**: Real-time với badge counts
-  **Encrypted Messaging**: AES-256 encryption, realtime Socket.io
-  **Group Chat**: Tạo nhóm, quản lý thành viên, admin controls
-  **Export**: PDF/Excel với Vietnamese support
-  **Delete for Me**: Xóa tin nhắn chỉ phía người dùng

##  Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **Realtime**: Socket.io với custom server
- **Security**: JWT, bcryptjs, AES-256-CBC encryption
- **Export**: jsPDF, XLSX

##  Quick Start

```bash
# Clone repository
git clone https://github.com/Azura-Deeper/Task-Report_ManagementSystem.git
cd Task-Report_ManagementSystem

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Điền MongoDB URI, JWT Secret, Encryption Key

# Seed database (tạo admin account)
npm run seed

# Run development server
npm run dev

# Visit http://localhost:3000
```

##  Environment Variables

```env
MONGODB_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-jwt-secret-min-32-chars
ENCRYPTION_SECRET_KEY=your-32-character-encryption-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

##  Phân quyền

| Role | Quyền hạn |
|------|-----------|
| **User** | Cập nhật tasks  Tạo reports  Messaging  Nhận notifications |
| **Manager** | Tất cả User + Tạo/giao tasks  Duyệt reports  Quản lý groups |
| **Admin** | View all  Delete tasks/reports  Quản lý users  Export data |

> **Lưu ý**: Admin không có quyền messaging

##  Messaging Features

### 1-1 Chat
- End-to-end encryption (AES-256)
- File attachments, Emoji picker
- Read receipts, Typing indicators
- Realtime delivery
- Delete for me

### Group Chat
- Multi-member groups
- Admin role management
- Add/remove members
- Leave group
- Delete message history

### Advanced
- Search users by name
- Filter by department/role
- Show online users only
- Browser notifications

##  Key Features

### Dashboard
- Real-time statistics
- Auto-refresh every 30s
- Role-specific views
- Quick actions

### Task Management
- Create/assign tasks (Manager)
- Update status (User)
- Priority levels
- File attachments
- Bulk delete (Admin)

### Report System
- Submit from tasks (User)
- Approval workflow (Manager)
- Status tracking
- File attachments
- Export to PDF/Excel

### Notification System
- Real-time updates
- 5 notification types
- Badge counts
- Mark as read
- Navigation links

### Export
- PDF with Vietnamese locale
- Excel with styling
- Export tasks/reports/users

##  Project Structure

```
 app/
    api/          # API routes
    dashboard/    # Dashboard pages
 components/       # React components
 context/          # Socket.io context
 contexts/         # Dashboard context
 lib/
    models/       # MongoDB models (User, Task, Report, Message, Group, Notification)
    auth.ts       # JWT utilities
    encryption.ts # AES-256 encryption
    mongodb.ts    # DB connection
 public/uploads/   # File storage
 server.js         # Custom Next.js + Socket.io
 README.md
```

##  Commands

```bash
npm run dev    # Development with Socket.io
npm run build  # Production build
npm start      # Production server
npm run seed   # Seed database
```

##  Security

- JWT authentication
- Password hashing (bcryptjs)
- Role-based access control
- AES-256-CBC message encryption
- Input validation
- File upload validation (max 10MB)

##  Database Models

- **User**: Authentication, roles, profile
- **Task**: Assignments, status, priorities
- **Report**: Submissions, approvals, feedback
- **Message**: Encrypted content, attachments, deletedBy[]
- **Group**: Members, admins, metadata
- **Notification**: Types, read status, links

##  Realtime Architecture

```
Client (SocketContext)  WebSocket  Server (server.js + Socket.io)
                                          
                                    API Routes (emit events)
```

### Socket Events
- `newMessage` - 1-1 messages
- `newGroupMessage` - Group messages
- `typing` / `stopTyping` - Typing indicators
- `join` / `joinGroup` - Room management

##  Future Enhancements

- Voice/video calls
- Message reactions
- Message forwarding
- Search in messages
- Archive conversations
- Two-factor authentication
- Dark mode
- Multi-language support

##  Author

**Developed by**: [Azura-Deeper](https://github.com/Azura-Deeper)  
**Repository**: [Task-Report_ManagementSystem](https://github.com/Azura-Deeper/Task-Report_ManagementSystem)  
**License**: MIT

---

 **Star this repo if you find it useful!** 