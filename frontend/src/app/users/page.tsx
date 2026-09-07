'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { AppUser } from '@/types';
import {
  Users,
  UserPlus,
  Search,
  KeyRound,
  Copy,
  Check,
  Edit2,
  Trash2,
  Shield,
  Building,
  CheckCircle2,
  XCircle,
  X,
  Sparkles,
  RefreshCw,
  Send,
} from 'lucide-react';

const DEPARTMENT_PRESETS = [
  'Khối Chiến lược',
  'Khối KH Doanh nghiệp SME',
  'Khối Chuyển đổi số & CNTT',
  'Khối Ngân hàng Số',
  'Khối KH Doanh nghiệp lớn',
  'Khối Quản trị Rủi ro',
  'Khối Vận hành',
  'Khối Khách hàng Cá nhân',
];

const ROLE_PRESETS = [
  { role: 'admin', role_name: 'Quản trị viên hệ thống' },
  { role: 'strategist', role_name: 'Chuyên viên Chiến lược cấp cao' },
  { role: 'analyst', role_name: 'Chuyên viên Nghiên cứu Sản phẩm' },
];

export default function UsersManagementPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    department: 'Khối Chiến lược',
    role: 'strategist' as 'admin' | 'strategist' | 'analyst',
    role_name: 'Chuyên viên Chiến lược cấp cao',
  });
  const [autoCopyOnSave, setAutoCopyOnSave] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch Users
  const { data: usersData, isLoading } = useQuery<{ data: AppUser[] }>({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      return res.json();
    },
  });
  const users: AppUser[] = usersData?.data || [];

  // 2. Mutations
  const createMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi tạo người dùng');
      return data.data;
    },
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      setIsModalOpen(false);
      if (autoCopyOnSave) {
        copyHandoverMessage(newUser, formData.password);
        showToast(`Đã tạo tài khoản "${newUser.name}" và sao chép tin nhắn gửi!`);
      } else {
        showToast(`Đã tạo tài khoản "${newUser.name}" thành công!`);
      }
    },
    onError: (err: any) => {
      alert(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<AppUser> }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi cập nhật');
      return data.data;
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      setIsModalOpen(false);
      if (formData.password && autoCopyOnSave) {
        copyHandoverMessage(updatedUser, formData.password);
        showToast(`Đã cập nhật mật khẩu mới và sao chép tin nhắn gửi!`);
      } else {
        showToast(`Đã cập nhật tài khoản "${updatedUser.name}"!`);
      }
    },
    onError: (err: any) => {
      alert(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi xóa');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      showToast('Đã xóa tài khoản khỏi hệ thống.');
    },
    onError: (err: any) => {
      alert(err.message);
    },
  });

  // Copy handover message template to clipboard
  const copyHandoverMessage = (u: AppUser, customPass?: string) => {
    const pass = customPass || u.password || 'mb@2025';
    const message = `🏢 THÔNG TIN TRUY CẬP HỆ THỐNG MB BIZ INTELLIGENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Họ và tên: ${u.name}
🏢 Đơn vị: ${u.department || 'Khối Chiến lược'}
🌐 Link đăng nhập: https://toolnghiencuu.vercel.app/login
🔑 Tên đăng nhập: ${u.username}
🔒 Mật khẩu: ${pass}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 Lưu ý: Vui lòng bảo mật thông tin tài khoản và không chia sẻ ra bên ngoài MB.`;

    navigator.clipboard.writeText(message);
    setCopiedId(u.id);
    setTimeout(() => setCopiedId(null), 2500);
    showToast(`Đã sao chép tin nhắn gửi cho ${u.name}!`);
  };

  // Generate random password
  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let pass = 'MB@';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: pass }));
  };

  // Open modal for new user
  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      username: '',
      password: '',
      email: '',
      department: 'Khối Chiến lược',
      role: 'strategist',
      role_name: 'Chuyên viên Chiến lược cấp cao',
    });
    generateRandomPassword();
    setIsModalOpen(true);
  };

  // Open modal for editing user
  const handleOpenEditModal = (u: AppUser) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      username: u.username,
      password: u.password || '',
      email: u.email || '',
      department: u.department || 'Khối Chiến lược',
      role: u.role,
      role_name: u.role_name || 'Chuyên viên',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim()) {
      alert('Vui lòng nhập Họ tên và Tên đăng nhập!');
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      alert('Vui lòng nhập hoặc tạo mật khẩu!');
      return;
    }

    if (editingUser) {
      const payload: Partial<AppUser> = {
        name: formData.name,
        department: formData.department,
        role: formData.role,
        role_name: formData.role_name,
        email: formData.email,
      };
      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }
      updateMutation.mutate({ id: editingUser.id, payload });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchQuery =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchDept = selectedDept === 'ALL' || u.department === selectedDept;
    return matchQuery && matchDept;
  });

  const departmentsList = Array.from(new Set(users.map((u) => u.department || 'Khác')));

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0f2357] text-white px-5 py-3 rounded-xl shadow-2xl border border-white/20 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-[#18a566] shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-bold text-[#0f2357] leading-tight">
              Quản lý Tài khoản & Phân quyền
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#eef5ff] text-[#1646d8] text-[11px] font-bold">
              {users.length} tài khoản
            </span>
          </div>
          <p className="text-[#667085] text-xs mt-1">
            Chủ động tạo tài khoản, đổi mật khẩu và sao chép thông tin gửi trực tiếp cho từng nhân sự nội bộ MB Bank.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#1646d8] to-[#0f34a8] hover:from-[#133ec2] hover:to-[#0c2b8c] text-white text-xs font-bold shadow-md shadow-[#1646d8]/20 flex items-center gap-2 transition-all cursor-pointer shrink-0 active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Tạo tài khoản mới</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-[#d9e2f2] shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#eef5ff] text-[#1646d8] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[#667085] font-medium">Tổng số tài khoản</div>
            <div className="text-xl font-bold text-[#0f2357]">{users.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#d9e2f2] shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#e9f8f0] text-[#18a566] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[#667085] font-medium">Đang hoạt động</div>
            <div className="text-xl font-bold text-[#0f2357]">
              {users.filter((u) => u.is_active).length}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#d9e2f2] shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#fff7df] text-[#f59e0b] flex items-center justify-center shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[#667085] font-medium">Khối / Phòng ban</div>
            <div className="text-xl font-bold text-[#0f2357]">{departmentsList.length}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-[#d9e2f2] shadow-sm mb-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#98a2b3] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, tài khoản, email..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#f8fafc] border border-[#d0d5dd] rounded-lg text-xs text-[#0f2357] placeholder-[#98a2b3] focus:outline-none focus:border-[#1646d8] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-[#667085] font-medium shrink-0">Phòng ban:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 bg-[#f8fafc] border border-[#d0d5dd] rounded-lg text-xs text-[#0f2357] focus:outline-none focus:border-[#1646d8]"
          >
            <option value="ALL">Tất cả phòng ban</option>
            {departmentsList.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-[#d9e2f2] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#d9e2f2] text-[#475467] font-bold">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Nhân sự</th>
                <th className="py-3 px-4">Tên đăng nhập</th>
                <th className="py-3 px-4">Mật khẩu</th>
                <th className="py-3 px-4">Khối / Phòng ban</th>
                <th className="py-3 px-4">Chức danh & Vai trò</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef2f8]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#667085]">
                    Đang tải danh sách tài khoản...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#667085]">
                    Không tìm thấy tài khoản nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => (
                  <tr key={u.id} className="hover:bg-[#fbfcfe] transition-colors">
                    <td className="py-3 px-4 text-center text-[#98a2b3] font-medium">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1646d8] to-[#0f2357] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {u.avatar_initials || 'MB'}
                        </div>
                        <div>
                          <div className="font-bold text-[#0f2357]">{u.name}</div>
                          <div className="text-[11px] text-[#667085]">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono px-2 py-0.5 rounded bg-[#f2f5fa] border border-[#e1ecff] text-[#1646d8] font-bold">
                        {u.username}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[#475467]">
                        {u.password ? u.password : '••••••'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[#344054] font-medium">{u.department}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#eef5ff] text-[#1646d8]">
                        <Shield className="w-3 h-3" />
                        <span>{u.role_name || u.role}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e9f8f0] text-[#18a566]">
                        <Check className="w-3 h-3" /> Hoạt động
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1-click Copy Message button */}
                        <button
                          type="button"
                          onClick={() => copyHandoverMessage(u)}
                          title="Sao chép tin nhắn gửi bàn giao tài khoản"
                          className="px-2.5 py-1.5 rounded-lg bg-[#eef5ff] hover:bg-[#dfeaff] text-[#1646d8] text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-[#c9ddff]"
                        >
                          {copiedId === u.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#18a566]" />
                              <span className="text-[#18a566]">Đã chép!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Sao chép gửi</span>
                            </>
                          )}
                        </button>

                        {/* Edit button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(u)}
                          title="Chỉnh sửa & Đổi mật khẩu"
                          className="p-1.5 rounded-lg text-[#475467] hover:bg-[#f2f5fa] hover:text-[#1646d8] transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete button (cannot delete own admin account) */}
                        {u.username !== currentUser?.username && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Bạn có chắc chắn muốn xóa tài khoản "${u.name}" (${u.username})?`)) {
                                deleteMutation.mutate(u.id);
                              }
                            }}
                            title="Xóa tài khoản"
                            className="p-1.5 rounded-lg text-[#98a2b3] hover:bg-[#fff0f1] hover:text-[#ef3f4b] transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-2xl border border-[#d9e2f2] overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#f8fafc] border-b border-[#eef2f8] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#eef5ff] text-[#1646d8] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0f2357]">
                    {editingUser ? `Chỉnh sửa: ${editingUser.name}` : 'Tạo tài khoản mới'}
                  </h3>
                  <div className="text-[11px] text-[#667085]">
                    Cấp tài khoản truy cập hệ thống BIZ Intelligence
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-lg text-[#98a2b3] hover:bg-[#eef2f8] hover:text-[#344054] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">
                  Họ và tên <span className="text-[#ef3f4b]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      name,
                      // Auto suggest username if creating new
                      username: !editingUser && !prev.username ? name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '') : prev.username,
                    }));
                  }}
                  placeholder="Ví dụ: Nguyễn Văn Hoàng"
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-[#d0d5dd] rounded-xl text-xs text-[#0f2357] font-medium focus:outline-none focus:border-[#1646d8] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    Tên đăng nhập <span className="text-[#ef3f4b]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUser}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    placeholder="hoangnv"
                    className="w-full px-3 py-2 bg-[#f8fafc] border border-[#d0d5dd] rounded-xl text-xs text-[#0f2357] font-mono focus:outline-none focus:border-[#1646d8] focus:bg-white disabled:opacity-60"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#344054]">
                      {editingUser ? 'Mật khẩu mới (Nếu đổi)' : 'Mật khẩu'} <span className="text-[#ef3f4b]">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[10px] text-[#1646d8] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Sparkles className="w-2.5 h-2.5" /> Tạo ngẫu nhiên
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? 'Để trống nếu giữ nguyên' : 'Nhập mật khẩu'}
                    className="w-full px-3 py-2 bg-[#f8fafc] border border-[#d0d5dd] rounded-xl text-xs text-[#0f2357] font-mono font-bold focus:outline-none focus:border-[#1646d8] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">
                  Email MB
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="hoangnv@mbbank.com.vn"
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-[#d0d5dd] rounded-xl text-xs text-[#0f2357] focus:outline-none focus:border-[#1646d8] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    Khối / Phòng ban
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f8fafc] border border-[#d0d5dd] rounded-xl text-xs text-[#0f2357] focus:outline-none focus:border-[#1646d8]"
                  >
                    {DEPARTMENT_PRESETS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    Vai trò & Phân quyền
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const role = e.target.value as 'admin' | 'strategist' | 'analyst';
                      const preset = ROLE_PRESETS.find((r) => r.role === role);
                      setFormData({
                        ...formData,
                        role,
                        role_name: preset?.role_name || 'Chuyên viên',
                      });
                    }}
                    className="w-full px-3 py-2 bg-[#f8fafc] border border-[#d0d5dd] rounded-xl text-xs text-[#0f2357] focus:outline-none focus:border-[#1646d8]"
                  >
                    {ROLE_PRESETS.map((r) => (
                      <option key={r.role} value={r.role}>
                        {r.role_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#344054]">
                  <input
                    type="checkbox"
                    checked={autoCopyOnSave}
                    onChange={(e) => setAutoCopyOnSave(e.target.checked)}
                    className="w-4 h-4 rounded text-[#1646d8] focus:ring-[#1646d8]"
                  />
                  <span>Tự động sao chép tin nhắn bàn giao sau khi lưu</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#eef2f8] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#d0d5dd] text-xs font-semibold text-[#475467] hover:bg-[#f8fafc] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-[#1646d8] hover:bg-[#133ec2] text-white text-xs font-bold shadow-md shadow-[#1646d8]/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{editingUser ? 'Cập nhật & Lưu' : 'Tạo & Sao chép gửi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
