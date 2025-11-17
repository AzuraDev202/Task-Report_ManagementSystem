# 🚀 Task & Report Management System

Hệ thống quản lý công việc và báo cáo nội bộ với đầy đủ tính năng phân quyền, thông báo real-time, tin nhắn mã hóa, messaging realtime với Socket.io, và nhiều tính năng nâng cao.

## ✨ Features Highlights

- 🔐 **JWT Authentication** với 3-tier role system (Admin/Manager/User)
- 📊 **Real-time Dashboard** với auto-refresh 30s
- 📝 **Task Management** với file attachments & priority tracking
- 📄 **Report System** với approval workflow
- 🔔 **Notification System** với badge count & real-time updates
- 💬 **Encrypted Messaging** (AES-256-CBC) với realtime Socket.io
- 👥 **Group Chat** với member management
- ⚡ **Realtime Features**: Instant messages, typing indicators, browser notifications
- 🗑️ **Delete for Me**: Xóa tin nhắn chỉ phía mình (từng tin hoặc toàn bộ)
- 🔍 **Advanced Filtering**: Department, role, online status cho employee search
- 📤 **Export to PDF/Excel** với Vietnamese locale
- 🗑️ **Bulk Operations** (multi-select delete)
- 🔒 **End-to-end Security** với encryption & input validation

## 📋 Mục lục

- [Công nghệ](#-công-nghệ)
- [Tính năng](#-tính-năng)
- [Phân quyền](#-phân-quyền)
- [Messaging System](#-messaging-system)
- [Realtime Features](#-realtime-features)
- [Cài đặt](#-cài-đặt)
- [Author](#-author)

## 💻 Công nghệ

**Stack:** Next.js 14 + TypeScript + MongoDB + Tailwind CSS + Socket.io

**Frontend:** React 18, Context API, React Icons, date-fns, Socket.io Client, Emoji Picker  
**Backend:** Next.js API Routes, Mongoose ODM, JWT Auth, bcryptjs, Socket.io Server  
**Security:** AES-256-CBC Encryption  
**Realtime:** Socket.io với custom Next.js server  
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
- **Realtime messaging** với Socket.io (không cần refresh)
- Icon trong header với badge đếm tin nhắn chưa đọc
- **Tính năng cơ bản:**
  - Giao diện 2 panel: Danh sách cuộc trò chuyện + Chat
  - Tạo chat mới với search users
  - Gửi file đính kèm (hình ảnh, documents)
  - Emoji picker
  - Hiển thị trạng thái đã đọc/chưa đọc
  - Xem avatar và thông tin người gửi
- **Tính năng nâng cao:**
  - **Group Chat**: Tạo nhóm, quản lý thành viên, admin controls
  - **Advanced Search**: Filter theo department, role, online status
  - **Realtime Updates**: Tin nhắn xuất hiện ngay lập tức
  - **Typing Indicators**: Hiển thị "đang nhập..." với animation
  - **Browser Notifications**: Thông báo desktop khi có tin nhắn mới
  - **Delete for Me**: Xóa tin nhắn từng cái hoặc toàn bộ cuộc trò chuyện
  - **Group Message Display**: Hiển thị tên và avatar người gửi trong nhóm
- **Phân quyền:** Chỉ Manager và User (Admin bị loại trừ)
- Manager ↔ Manager, Manager ↔ User, User ↔ User

### 👥 Group Chat
- **Tạo nhóm**: Chọn nhiều thành viên, đặt tên và mô tả nhóm
- **Quản lý thành viên**: 
  - Admin: Người tạo nhóm tự động trở thành admin
  - Thêm/xóa thành viên
  - Transfer admin khi admin cuối rời nhóm
- **Gửi tin nhắn nhóm**: File attachments, emoji, realtime
- **Hiển thị người gửi**: Avatar và tên của người gửi trong mỗi tin nhắn
- **Leave group**: Rời khỏi nhóm (admin auto-transfer)
- **Delete messages**: Xóa tin nhắn nhóm chỉ phía mình

### 🗑️ Delete for Me Feature
Hệ thống cung cấp 2 cách xóa tin nhắn, cả 2 đều chỉ xóa phía người dùng:

#### 1. Xóa từng tin nhắn:
- Hover vào tin nhắn → Nút xóa xuất hiện
- Click xóa → Tin nhắn biến mất khỏi phía bạn
- Người khác vẫn thấy tin nhắn bình thường
- Nếu cả 2 người đều xóa (chat 1-1) → Xóa vĩnh viễn

#### 2. Xóa toàn bộ cuộc trò chuyện:
- **Chat 1-1**: Click icon thùng rác ở header
- **Group**: Menu 3 chấm → "Xóa toàn bộ tin nhắn"
- Tất cả tin nhắn biến mất khỏi danh sách của bạn
- Người khác vẫn thấy đầy đủ tin nhắn
- Bạn vẫn là thành viên nhóm (nếu là group)

**Database Schema:**
```typescript
Message {
  sender: ObjectId,
  receiver: ObjectId,
  groupId: ObjectId,
  content: String (encrypted),
  deletedBy: [ObjectId], // Array chứa IDs của users đã xóa
  isGroupMessage: Boolean,
  attachments: [...]
}
```

### 👥 Quản lý Người dùng
- **Admin:** CRUD users, phân quyền roles
- Quản lý phòng ban, Upload avatar
- Tìm kiếm và filter
- **Advanced Employee Search**: Filter theo department, role, online status

### 📤 Export
- Export PDF với Vietnamese locale
- Export Excel với styling
- Export Tasks, Reports, Users

## ⚡ Realtime Features

### Socket.io Integration
Hệ thống sử dụng **Socket.io** với custom Next.js server để cung cấp các tính năng realtime:

#### 🔌 Server Setup
- Custom server (`server.js`) chạy Socket.io cùng Next.js
- Socket path: `/api/socket`
- Auto-reconnect khi mất kết nối
- Room-based messaging (user rooms + group rooms)

#### 📨 Realtime Messaging
- **Instant message delivery**: Tin nhắn được gửi và nhận ngay lập tức
- **No polling**: Không cần auto-refresh, tiết kiệm bandwidth
- **Group broadcast**: Tin nhắn nhóm được gửi đến tất cả thành viên đồng thời
- **Socket Events**:
  - `newMessage` - Tin nhắn 1-1 mới
  - `newGroupMessage` - Tin nhắn nhóm mới
  - `join` - Join room cá nhân
  - `joinGroup` - Join room nhóm
  - `leaveGroup` - Leave room nhóm

#### ⌨️ Typing Indicators
- Hiển thị khi người khác đang nhập tin nhắn
- Animation 3 chấm nhảy đẹp mắt
- Tự động tắt sau 3 giây không hoạt động
- Hoạt động cho cả chat 1-1 và nhóm
- **Socket Events**:
  - `typing` - Bắt đầu nhập
  - `stopTyping` - Ngừng nhập
  - `userTyping` - Nhận thông báo đang nhập
  - `userStoppedTyping` - Nhận thông báo ngừng nhập

#### 🔔 Browser Notifications
- **Desktop notifications** khi có tin nhắn mới
- Hiển thị tên người gửi và nội dung tin nhắn
- Click vào notification để focus vào cửa sổ
- Tự động đóng sau 5 giây
- Chỉ hiển thị khi:
  - Người dùng không đang xem trang (document.hidden)
  - Hoặc đang xem chat/nhóm khác
- Yêu cầu quyền thông báo từ browser (auto-request khi vào trang)

#### 🔄 Connection Management
- **SocketContext**: React Context quản lý Socket.io client
- Tự động kết nối khi mount component
- Cleanup khi unmount
- Hiển thị trạng thái kết nối (connected/disconnected)
- **User Rooms**: Mỗi user tự động join room riêng `user:{userId}`
- **Group Rooms**: Auto join/leave khi chọn/rời group chat

### Architecture

```
┌─────────────────┐
│   Client Side   │
│  SocketContext  │ ← React Context Provider
│   io.connect()  │
└────────┬────────┘
         │ WebSocket/Polling
         ↓
┌─────────────────┐
│  Custom Server  │
│   server.js     │ ← Next.js + Socket.io
│   io.on()       │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  API Routes     │
│  emit events    │ ← global.io.emit()
└─────────────────┘
```

## 🔑 Phân quyền

| Role | Quyền hạn |
|------|-----------|
| **👤 User** | Xem dashboard • Cập nhật status công việc • Tạo/nộp báo cáo • Nhận thông báo (task assigned, updated, report reviewed) • Nhắn tin với Manager và User khác • Tạo và tham gia group chat • Xóa tin nhắn (delete for me) |
| **👔 Manager** | Tất cả quyền User • Tạo/sửa công việc • Giao việc cho User • Duyệt/từ chối báo cáo • Nhận thông báo (task completed, report submitted) • Nhắn tin với Manager và User khác • Tạo và quản lý group chat |
| **👨‍💼 Admin** | **View + Delete only** • Xem tất cả dữ liệu • Xóa tasks/reports (bulk delete) • Quản lý users (CRUD) • Export dữ liệu • **Không tạo/sửa tasks/reports** • **Không có quyền truy cập tin nhắn** |

> **Lưu ý:** Đăng ký mặc định tạo User role. Admin có thể thay đổi thành Manager sau.

## 💬 Messaging System

### Features Overview

#### 1. Chat 1-1 (One-to-One)
- Tin nhắn mã hóa end-to-end với AES-256-CBC
- Gửi file đính kèm (images, documents)
- Emoji picker với hơn 1000+ emoji
- Realtime instant delivery
- Read receipts (đã đọc/chưa đọc)
- Typing indicators
- Browser notifications

#### 2. Group Chat
- Tạo nhóm với nhiều thành viên
- Admin role tự động cho người tạo
- Quản lý thành viên (add/remove)
- Hiển thị avatar + tên người gửi
- Group typing indicators
- Leave group (auto-transfer admin)
- Delete message history

#### 3. Advanced Search & Filter
Dành cho công ty có nhiều nhân viên:
- **Search by name**: Tìm kiếm theo tên
- **Filter by department**: Lọc theo phòng ban
- **Filter by role**: Manager/User
- **Online status**: Chỉ hiển thị người online
- Real-time suggestions

#### 4. Delete for Me
**Xóa từng tin nhắn:**
- Hover → Nút xóa xuất hiện
- Click xóa → Confirm
- Tin nhắn chỉ biến mất phía bạn
- Người khác vẫn thấy tin nhắn
- Xóa vĩnh viễn nếu cả 2 đều xóa (1-1 chat)

**Xóa toàn bộ cuộc trò chuyện:**
- Chat 1-1: Icon thùng rác ở header
- Group: Menu 3 chấm → "Xóa toàn bộ tin nhắn"
- Tất cả tin nhắn biến mất
- Người khác không bị ảnh hưởng
- Vẫn là thành viên nhóm (group chat)

### Technical Implementation

#### Encryption
```typescript
// AES-256-CBC Encryption
const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(secretKey, 'salt', 32);
const iv = crypto.randomBytes(16);

// Encrypt
const cipher = crypto.createCipheriv(algorithm, key, iv);
const encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');

// Decrypt
const decipher = crypto.createDecipheriv(algorithm, key, iv);
const decrypted = decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
```

#### Message Schema
```typescript
{
  sender: ObjectId,
  receiver: ObjectId,        // Optional (null for group messages)
  groupId: ObjectId,         // Optional (null for 1-1 messages)
  content: String,           // Encrypted
  attachments: [{
    filename: String,
    path: String,
    mimetype: String,
    size: Number
  }],
  isRead: Boolean,
  isGroupMessage: Boolean,
  deletedBy: [ObjectId],     // Users who deleted this message
  createdAt: Date,
  updatedAt: Date
}
```

#### Group Schema
```typescript
{
  name: String,
  description: String,
  members: [ObjectId],       // Array of user IDs
  admins: [ObjectId],        // Array of admin user IDs
  avatar: String,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

#### Socket.io Events Flow

**Sending Message (1-1):**
```
Client → POST /api/messages
       → Server emits: io.to(`user:${receiverId}`).emit('newMessage')
       → Receiver gets instant notification
```

**Sending Group Message:**
```
Client → POST /api/groups/messages
       → Server emits: io.to(`group:${groupId}`).emit('newGroupMessage')
       → All members get instant notification
```

**Typing Indicator:**
```
User types → emit('typing', { userId, conversationId, isGroup })
          → Server broadcasts to room
          → Other users see "..." animation
          → Auto-stop after 3s
```

### API Endpoints

#### Messages
- `GET /api/messages` - Get conversations list
- `GET /api/messages/[userId]` - Get conversation with specific user
- `POST /api/messages` - Send message (1-1)
- `PUT /api/messages` - Mark as read
- `DELETE /api/messages/[id]/delete` - Delete single message (for me)
- `POST /api/messages/[userId]/delete-conversation` - Delete entire conversation (for me)

#### Groups
- `GET /api/groups` - Get user's groups
- `POST /api/groups` - Create group
- `GET /api/groups/messages?groupId=xxx` - Get group messages
- `POST /api/groups/messages` - Send group message
- `POST /api/groups/[id]/leave` - Leave group
- `POST /api/groups/[id]/delete-messages` - Delete all group messages (for me)

#### Socket.io
- `GET /api/socket` - Initialize Socket.io connection

### UI Components

**MessagesComponent.tsx** (Main component ~1700 lines):
- Conversations list with unread counts
- Chat interface with message bubbles
- File upload (image preview, document list)
- Emoji picker integration
- Search users modal
- Create group modal
- Group menu (info, delete, leave)
- Typing indicators display
- Delete buttons (hover reveal)

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

# 3. Tạo file .env.local
# Copy từ .env.example và điền các giá trị:
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENCRYPTION_SECRET_KEY=your_32_character_secret_key

# 4. Seed database (tạo dữ liệu mẫu)
npm run seed

# 5. Chạy development server với Socket.io
npm run dev

# 6. Truy cập http://localhost:3000
```

### Accounts sau khi seed

```
Admin:
Email: admin@company.com
Password: Admin123!

Manager:
Email: manager@company.com
Password: Manager123!

User:
Email: user@company.com
Password: User123!
```

### Commands

```bash
npm run dev         # Development server (với Socket.io)
npm run build       # Production build
npm start           # Production server (với Socket.io)
npm run seed        # Seed database với sample data
npm run lint        # Run ESLint
```

### Custom Server

Dự án sử dụng custom Next.js server (`server.js`) để tích hợp Socket.io:

```javascript
// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  });

  const io = new Server(httpServer, {
    path: '/api/socket',
    cors: { origin: '*' }
  });

  // Socket.io event handlers
  io.on('connection', (socket) => {
    // Handle events...
  });

  global.io = io; // Make available to API routes
  httpServer.listen(3000);
});
```

### Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars

# Encryption (phải đúng 32 ký tự)
ENCRYPTION_SECRET_KEY=12345678901234567890123456789012

# Site URL (cho Socket.io client)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: File upload limits
MAX_FILE_SIZE=10485760  # 10MB
```

### Folder Structure

```
Task-Report_ManagementSystem/
├── app/
│   ├── api/
│   │   ├── auth/          # Authentication endpoints
│   │   ├── tasks/         # Task management
│   │   ├── reports/       # Report management
│   │   ├── messages/      # Messaging endpoints
│   │   ├── groups/        # Group chat endpoints
│   │   ├── notifications/ # Notification endpoints
│   │   ├── users/         # User management
│   │   └── socket/        # Socket.io initialization
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Login page
│   └── layout.tsx        # Root layout with SocketProvider
├── components/
│   ├── MessagesComponent.tsx  # Main messaging UI (~1700 lines)
│   ├── Navbar.tsx            # Navigation with notifications
│   └── ...
├── context/
│   └── SocketContext.tsx     # Socket.io React Context
├── lib/
│   ├── models/
│   │   ├── User.ts
│   │   ├── Task.ts
│   │   ├── Report.ts
│   │   ├── Message.ts       # With deletedBy field
│   │   ├── Notification.ts
│   │   └── Group.ts
│   ├── auth.ts              # JWT utilities
│   ├── encryption.ts        # AES-256-CBC
│   ├── mongodb.ts           # MongoDB connection
│   └── middleware.ts        # Auth middleware
├── models/
│   └── Group.ts             # Group model (duplicate?)
├── public/
│   └── uploads/             # File uploads storage
├── server.js                # Custom Next.js + Socket.io server
├── package.json
└── README.md
```

## 🚀 Key Features Breakdown

### 1. Authentication & Security
- JWT-based authentication với HTTP-only cookies
- Password hashing với bcryptjs (10 rounds)
- Role-based access control (RBAC)
- Protected routes với middleware
- AES-256-CBC encryption cho tin nhắn
- Input validation và sanitization
- CSRF protection

### 2. Dashboard
- Real-time statistics với auto-refresh
- Role-specific data views
- Task completion charts (coming soon)
- Recent activities feed
- Quick actions shortcuts

### 3. Task Management
- Create/Edit/Delete tasks (Manager only)
- Assign to multiple users
- Priority levels: Low, Medium, High, Urgent
- Status tracking: Pending → In Progress → Completed
- Deadline alerts
- File attachments (max 10MB)
- Comment system (coming soon)
- Bulk delete (Admin)

### 4. Report System
- Submit reports from tasks (User)
- Approval workflow (Manager)
- Status: Draft → Submitted → Approved/Rejected
- Manager feedback
- File attachments
- Export to PDF/Excel
- Bulk delete (Admin)

### 5. Notification System
- Real-time notifications với badge count
- 5 notification types:
  - Task Assigned (→ User)
  - Task Updated (→ Manager)
  - Task Completed (→ Manager)
  - Report Submitted (→ Manager)
  - Report Reviewed (→ User)
- Mark as read/unread
- Delete all functionality
- Auto-refresh every 30s
- Click to navigate to related item

### 6. Messaging System
**1-1 Chat:**
- End-to-end encryption
- File attachments
- Emoji support
- Read receipts
- Typing indicators
- Delete for me
- Browser notifications

**Group Chat:**
- Create groups with multiple members
- Admin role management
- Member add/remove
- Group avatar
- Message sender display (name + avatar)
- Group typing indicators
- Leave group
- Delete message history

**Advanced Features:**
- Search users by name
- Filter by department
- Filter by role
- Show online users only
- Realtime message delivery
- No polling needed

### 7. User Management (Admin only)
- CRUD operations
- Role assignment (User/Manager)
- Department management
- Avatar upload
- Search and filter
- Bulk operations
- User statistics

### 8. Export Features
- PDF export với Vietnamese locale
- Excel export với styling
- Export tasks list
- Export reports
- Export user list
- Custom date range selection

## 🔧 Troubleshooting

### Socket.io không kết nối
```bash
# Check if server is running with custom server
node server.js

# Check browser console for errors
# Should see: "Socket connected: [socket-id]"

# Check network tab for WebSocket connection
# URL should be: ws://localhost:3000/api/socket
```

### Tin nhắn không realtime
```bash
# Verify SocketProvider is wrapping the app
# Check app/layout.tsx

# Verify user joined their room
# Check console: "User [userId] joined their room"

# Check API emits events
# Should see: "Emitted newMessage to user:[userId]"
```

### Lỗi encryption/decryption
```bash
# Verify ENCRYPTION_SECRET_KEY đúng 32 ký tự
echo $ENCRYPTION_SECRET_KEY | wc -c  # Should output 33 (32 + newline)

# Nếu lỗi với tin nhắn cũ, có thể do key thay đổi
# Backup và xóa collection messages, seed lại
```

### Mongoose model cache issues
```bash
# Restart server sau khi thay đổi model
# Mongoose cache models, cần clear cache

# Hoặc clear MongoDB cache:
db.collection.reIndex()
```

## 📱 Mobile Responsive

Tất cả giao diện đã được tối ưu cho mobile:
- Responsive navigation
- Touch-friendly buttons
- Mobile-optimized modals
- Responsive tables
- Mobile emoji picker
- Touch gestures support

## 🔐 Security Best Practices

1. **Authentication:**
   - JWT tokens với expiration
   - Secure password hashing
   - Role-based access control

2. **Data Protection:**
   - AES-256-CBC encryption cho messages
   - Input sanitization
   - SQL injection prevention (MongoDB)
   - XSS protection

3. **File Upload:**
   - File type validation
   - File size limits (10MB)
   - Secure file naming
   - Virus scanning (recommended in production)

4. **API Security:**
   - Rate limiting (recommended)
   - CORS configuration
   - HTTP-only cookies
   - CSRF tokens (recommended)

## 🎯 Performance Optimization

- **Frontend:**
  - React memo for expensive components
  - Lazy loading for modals
  - Image optimization
  - Code splitting

- **Backend:**
  - MongoDB indexes
  - Query optimization
  - Connection pooling
  - Caching strategy

- **Realtime:**
  - Room-based messaging (không broadcast toàn bộ)
  - Event throttling
  - Auto-disconnect cleanup

## 📊 Database Indexes

```javascript
// Message Model
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
MessageSchema.index({ groupId: 1, createdAt: -1 });
MessageSchema.index({ receiver: 1, isRead: 1 });
MessageSchema.index({ deletedBy: 1 });

// User Model
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ department: 1 });

// Task Model
TaskSchema.index({ assignedTo: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ deadline: 1 });

// Notification Model
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });
```

## 🐛 Known Issues

1. **Socket.io connection**: Có thể cần refresh lần đầu khi vào trang
2. **File upload**: Large files (>10MB) sẽ bị reject
3. **Encryption**: Không thể decrypt tin nhắn nếu đổi ENCRYPTION_SECRET_KEY
4. **Mobile browser notifications**: Safari iOS có hạn chế

## 🚀 Future Enhancements

- [ ] Voice messages
- [ ] Video call integration
- [ ] Message reactions (like, love, etc.)
- [ ] Read receipts for group messages
- [ ] Message forwarding
- [ ] Pin important messages
- [ ] Search messages by content
- [ ] Archive conversations
- [ ] Auto-delete messages after X days
- [ ] Two-factor authentication (2FA)
- [ ] Dark mode
- [ ] Multi-language support
- [ ] Calendar integration
- [ ] Gantt chart for tasks
- [ ] Analytics dashboard

## 👨‍💻 Author

**MIT License** - Tự do sử dụng cho mục đích học tập và thương mại.

**Developed by:** [Azura-Deeper](https://github.com/Azura-Deeper)  
**Repository:** [Task-Report_ManagementSystem](https://github.com/Azura-Deeper/Task-Report_ManagementSystem)

---

## 🤝 Contributing

Contributions, issues và feature requests đều được chào đón!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.

---

## 📞 Support

Nếu bạn thấy project hữu ích:
- ⭐ Star repository
- 🐛 Report bugs qua [Issues](https://github.com/Azura-Deeper/Task-Report_ManagementSystem/issues)
- 💡 Suggest features
- 🔀 Submit pull requests

---

⭐ **Nếu project này hữu ích, hãy cho một Star nhé!** ⭐
