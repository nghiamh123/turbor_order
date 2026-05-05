# User Stories — TurboOrder MVP

> **[PO]** Phase 1 | Product Owner  
> **Epic:** `turbo-order-mvp`  
> **Created:** 2026-04-29

---

## Module 1: Authentication

### US-AUTH-001: Đăng nhập hệ thống
**As** chủ cửa hàng  
**I want to** đăng nhập bằng email và mật khẩu  
**So that** tôi có thể truy cập hệ thống quản lí bán hàng  

**Acceptance Criteria:**
```gherkin
Given tôi ở trang login
When tôi nhập email và mật khẩu đúng
Then hệ thống chuyển tôi đến Dashboard
And lưu token để duy trì phiên đăng nhập

Given tôi ở trang login
When tôi nhập sai thông tin
Then hệ thống hiển thị thông báo lỗi "Email hoặc mật khẩu không đúng"
And không cho phép truy cập
```

### US-AUTH-002: Duy trì phiên đăng nhập
**As** chủ cửa hàng  
**I want to** không phải đăng nhập lại khi refresh trang  
**So that** tôi không bị gián đoạn công việc  

**Acceptance Criteria:**
```gherkin
Given tôi đã đăng nhập và token còn hạn
When tôi refresh trang hoặc mở lại tab
Then hệ thống tự động đăng nhập lại

Given token đã hết hạn
When tôi refresh trang
Then hệ thống sử dụng refresh token để lấy token mới
And nếu refresh token cũng hết hạn thì redirect về trang login
```

### US-AUTH-003: Đăng xuất
**As** chủ cửa hàng  
**I want to** đăng xuất khỏi hệ thống  
**So that** bảo mật tài khoản khi không sử dụng  

---

## Module 2: Dashboard

### US-DASH-001: Xem tổng quan doanh thu
**As** chủ cửa hàng  
**I want to** xem tổng quan doanh thu (hôm nay, tuần này, tháng này)  
**So that** tôi nắm được tình hình kinh doanh nhanh chóng  

**Acceptance Criteria:**
```gherkin
Given tôi ở trang Dashboard
When trang load xong
Then tôi thấy 4 thẻ KPI: Doanh thu hôm nay, Đơn hàng mới, Sản phẩm bán ra, Khách hàng mới
And mỗi thẻ có số liệu và % thay đổi so với kỳ trước

Given tôi muốn xem theo kỳ khác
When tôi chọn filter thời gian (hôm nay / tuần / tháng / năm)
Then tất cả dữ liệu dashboard cập nhật theo kỳ đã chọn
```

### US-DASH-002: Xem biểu đồ doanh thu
**As** chủ cửa hàng  
**I want to** xem biểu đồ doanh thu theo thời gian  
**So that** tôi thấy được xu hướng kinh doanh  

### US-DASH-003: Xem top sản phẩm bán chạy
**As** chủ cửa hàng  
**I want to** xem danh sách top 10 sản phẩm bán chạy nhất  
**So that** tôi biết sản phẩm nào đang hot để nhập thêm  

### US-DASH-004: Quick actions
**As** chủ cửa hàng  
**I want to** tạo đơn hàng nhanh ngay từ Dashboard  
**So that** tôi tiết kiệm thời gian thao tác  

---

## Module 3: Order Management

### US-ORD-001: Tạo đơn hàng mới
**As** chủ cửa hàng  
**I want to** tạo đơn hàng mới bằng cách chọn khách hàng và thêm sản phẩm  
**So that** tôi ghi nhận giao dịch bán hàng  

**Acceptance Criteria:**
```gherkin
Given tôi ở trang tạo đơn hàng
When tôi chọn/tạo khách hàng
And thêm sản phẩm vào đơn (chọn từ danh sách, nhập số lượng)
Then hệ thống tự động tính: thành tiền = đơn giá × số lượng
And tổng đơn = tổng các dòng sản phẩm
And tôi có thể thêm giảm giá (% hoặc số tiền cố định)

Given tôi đã thêm sản phẩm có tồn kho = 0
When tôi submit đơn
Then hệ thống cảnh báo "Sản phẩm X đã hết hàng"

Given đơn hàng hợp lệ
When tôi bấm "Tạo đơn"
Then đơn được lưu với trạng thái "Mới"
And tồn kho sản phẩm bị trừ tương ứng
And tôi được redirect đến chi tiết đơn hàng
```

### US-ORD-002: Xem danh sách đơn hàng
**As** chủ cửa hàng  
**I want to** xem tất cả đơn hàng trong table với filter và search  
**So that** tôi quản lí được tình trạng các đơn  

**Acceptance Criteria:**
```gherkin
Given tôi ở trang danh sách đơn hàng
Then tôi thấy table với cột: Mã đơn, Khách hàng, Tổng tiền, Trạng thái, Ngày tạo
And table có pagination (20 đơn/trang)
And tôi có thể sort theo bất kỳ cột nào

Given tôi muốn tìm đơn cụ thể
When tôi nhập mã đơn hoặc tên khách hàng vào ô search
Then table filter theo keyword real-time

Given tôi muốn filter theo trạng thái
When tôi chọn filter "Đang giao"
Then chỉ hiển thị các đơn có trạng thái "Đang giao"
```

### US-ORD-003: Cập nhật trạng thái đơn hàng
**As** chủ cửa hàng  
**I want to** chuyển trạng thái đơn hàng theo flow  
**So that** tôi theo dõi được tiến độ xử lí  

**Acceptance Criteria:**
```gherkin
Given đơn hàng có trạng thái "Mới"
When tôi bấm "Xác nhận"
Then trạng thái chuyển thành "Đã xác nhận"
And lịch sử ghi nhận thời gian + người thao tác

Given đơn hàng có trạng thái "Đã xác nhận"
When tôi bấm "Giao hàng"
Then trạng thái chuyển thành "Đang giao"

Given đơn hàng đang "Đang giao"
When tôi bấm "Hoàn thành"
Then trạng thái chuyển thành "Hoàn thành"
And doanh thu được tính vào báo cáo

Given đơn hàng chưa "Hoàn thành"
When tôi bấm "Hủy đơn"
Then hệ thống yêu cầu nhập lí do
And trạng thái chuyển thành "Đã hủy"
And tồn kho được hoàn lại
```

### US-ORD-004: Xem chi tiết đơn hàng
**As** chủ cửa hàng  
**I want to** xem toàn bộ thông tin của một đơn hàng  
**So that** tôi nắm rõ chi tiết giao dịch  

### US-ORD-005: In / Export hóa đơn
**As** chủ cửa hàng  
**I want to** in hóa đơn hoặc export PDF cho đơn hàng  
**So that** tôi gửi cho khách hàng hoặc lưu trữ  

---

## Module 4: Product Management

### US-PROD-001: Thêm sản phẩm mới
**As** chủ cửa hàng  
**I want to** thêm sản phẩm với đầy đủ thông tin (tên, mô tả, giá gốc, giá bán, ảnh, danh mục)  
**So that** tôi có danh sách sản phẩm để tạo đơn hàng  

**Acceptance Criteria:**
```gherkin
Given tôi ở form thêm sản phẩm
When tôi nhập đầy đủ thông tin bắt buộc (tên, giá bán)
And upload ảnh sản phẩm (tùy chọn, max 5MB, JPG/PNG)
And chọn danh mục
And nhập số lượng tồn kho ban đầu
Then sản phẩm được tạo thành công
And xuất hiện trong danh sách sản phẩm

Given tôi nhập giá bán < giá gốc
Then hệ thống cảnh báo "Giá bán thấp hơn giá gốc — lỗ!"
```

### US-PROD-002: Quản lí danh sách sản phẩm
**As** chủ cửa hàng  
**I want to** xem, sửa, xóa sản phẩm trong danh sách  
**So that** tôi duy trì catalog sản phẩm chính xác  

### US-PROD-003: Quản lí danh mục sản phẩm
**As** chủ cửa hàng  
**I want to** tạo và quản lí danh mục sản phẩm (categories)  
**So that** tôi phân loại sản phẩm có hệ thống  

### US-PROD-004: Theo dõi tồn kho
**As** chủ cửa hàng  
**I want to** theo dõi số lượng tồn kho và nhận cảnh báo khi sắp hết  
**So that** tôi nhập hàng kịp thời  

**Acceptance Criteria:**
```gherkin
Given sản phẩm có tồn kho ≤ ngưỡng cảnh báo (mặc định: 10)
Then sản phẩm hiển thị badge "Sắp hết hàng" màu vàng

Given sản phẩm có tồn kho = 0
Then sản phẩm hiển thị badge "Hết hàng" màu đỏ
And không cho phép thêm vào đơn hàng (trừ khi override)
```

### US-PROD-005: Import sản phẩm hàng loạt
**As** chủ cửa hàng  
**I want to** import sản phẩm từ file CSV  
**So that** tôi thêm nhiều sản phẩm nhanh chóng  

---

## Module 5: Customer Management

### US-CUST-001: Thêm khách hàng
**As** chủ cửa hàng  
**I want to** thêm khách hàng mới (tên, SĐT, email, địa chỉ)  
**So that** tôi lưu trữ thông tin liên hệ  

### US-CUST-002: Xem danh sách khách hàng
**As** chủ cửa hàng  
**I want to** xem và tìm kiếm khách hàng  
**So that** tôi tìm nhanh khách khi tạo đơn  

**Acceptance Criteria:**
```gherkin
Given tôi ở trang khách hàng
When tôi nhập SĐT "0901" vào ô search
Then danh sách filter hiển thị các khách có SĐT chứa "0901"
And kết quả hiện trong < 500ms
```

### US-CUST-003: Xem lịch sử mua hàng của khách
**As** chủ cửa hàng  
**I want to** xem tất cả đơn hàng của một khách hàng  
**So that** tôi biết khách mua gì, bao nhiêu, khi nào  

### US-CUST-004: Phân loại khách hàng
**As** chủ cửa hàng  
**I want to** phân loại khách hàng thành VIP, Regular, New  
**So that** tôi có chính sách chăm sóc phù hợp  

---

## Module 6: Reports & Analytics

### US-RPT-001: Báo cáo doanh thu
**As** chủ cửa hàng  
**I want to** xem báo cáo doanh thu theo thời gian (ngày/tuần/tháng/năm)  
**So that** tôi đánh giá hiệu quả kinh doanh  

**Acceptance Criteria:**
```gherkin
Given tôi ở trang báo cáo doanh thu
When tôi chọn khoảng thời gian 01/04/2026 - 30/04/2026
Then hệ thống hiển thị:
  - Tổng doanh thu
  - Tổng lợi nhuận (doanh thu - giá vốn)
  - Biểu đồ doanh thu theo ngày
  - So sánh với kỳ trước (%)
```

### US-RPT-002: Báo cáo sản phẩm
**As** chủ cửa hàng  
**I want to** xem báo cáo top sản phẩm bán chạy và tồn kho chậm  
**So that** tôi điều chỉnh chiến lược nhập/bán  

### US-RPT-003: Báo cáo khách hàng
**As** chủ cửa hàng  
**I want to** xem top khách hàng theo doanh thu  
**So that** tôi biết ai là khách VIP cần chăm sóc  

### US-RPT-004: Export báo cáo
**As** chủ cửa hàng  
**I want to** export báo cáo ra PDF hoặc Excel  
**So that** tôi lưu trữ hoặc gửi cho đối tác  

---

## Module 7: Settings

### US-SET-001: Cấu hình thông tin cửa hàng
**As** chủ cửa hàng  
**I want to** cấu hình tên, logo, địa chỉ, SĐT cửa hàng  
**So that** thông tin hiển thị trên hóa đơn và app  

### US-SET-002: Đổi mật khẩu
**As** chủ cửa hàng  
**I want to** đổi mật khẩu tài khoản  
**So that** tôi bảo mật tài khoản  

### US-SET-003: Cấu hình hệ thống
**As** chủ cửa hàng  
**I want to** cấu hình đơn vị tiền tệ, định dạng ngày  
**So that** app hiển thị phù hợp với thị trường của tôi  

---

## Priority Matrix

| Priority | User Stories |
|----------|-------------|
| **P0 — Must Have** | US-AUTH-001, US-AUTH-002, US-ORD-001, US-ORD-002, US-ORD-003, US-PROD-001, US-PROD-002, US-CUST-001, US-CUST-002, US-DASH-001 |
| **P1 — Should Have** | US-AUTH-003, US-ORD-004, US-ORD-005, US-PROD-003, US-PROD-004, US-CUST-003, US-DASH-002, US-DASH-003, US-RPT-001, US-SET-001 |
| **P2 — Nice to Have** | US-PROD-005, US-CUST-004, US-RPT-002, US-RPT-003, US-RPT-004, US-DASH-004, US-SET-002, US-SET-003 |

---

🚦 **GATE STATUS:** Pending user review  
⏭️ **NEXT ACTION:** User approval → Phase 2 [BA] Business Analyst
