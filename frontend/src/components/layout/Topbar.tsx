'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import Link from 'next/link';
import { Bell, Info, LogOut, User as UserIcon, Shield, ChevronDown, Users } from 'lucide-react';

export default function Topbar() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-[54px] border-b border-[#d9e2f2] flex items-center justify-between px-6 sticky top-0 bg-white z-20">
      {/* Information Banner */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#eef5ff] text-[#3156a8] text-[12px] font-medium max-w-[800px] truncate">
        <Info className="w-3.5 h-3.5 shrink-0 text-[#1646d8]" />
        <span>Thu thập, phân tích và so sánh thông tin sản phẩm/tính năng của các ngân hàng đối thủ</span>
      </div>

      {/* User Section & Notification */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          title="Thông báo"
          className="w-8 h-8 rounded-full border border-[#d9e2f2] flex items-center justify-center text-[#475467] hover:bg-[#f7f9fc] transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 pl-2 border-l border-[#d9e2f2] hover:opacity-90 transition-opacity cursor-pointer text-left"
          >
            <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-[#1646d8] to-[#0f2357] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {user?.avatarInitials || 'NH'}
            </div>
            <div className="text-left text-xs leading-tight hidden sm:block">
              <strong className="block text-[#0f2357] font-semibold">
                {user?.name || 'Nguyễn Hoàng'}
              </strong>
              <small className="text-[#667085]">
                {user?.department || 'Khối Chiến lược'}
              </small>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#667085] ml-0.5" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#d9e2f2] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* User header inside dropdown */}
              <div className="px-4 py-3 border-b border-[#eef2f8]">
                <div className="text-xs font-bold text-[#0f2357]">{user?.name}</div>
                <div className="text-[11px] text-[#667085] truncate">{user?.email}</div>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#eef5ff] text-[#1646d8] text-[10px] font-semibold">
                  <Shield className="w-3 h-3" />
                  <span>{user?.roleName || 'Chuyên viên'}</span>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <div className="px-4 py-2 text-[11px] text-[#98a2b3] font-semibold uppercase tracking-wider">
                  Tài khoản
                </div>

                {/* Only visible for Admin accounts */}
                {(user?.role === 'admin' || user?.username === 'admin') && (
                  <Link
                    href="/users"
                    onClick={() => setDropdownOpen(false)}
                    className="w-full px-4 py-2 text-left text-xs text-[#344054] hover:bg-[#f7f9fc] hover:text-[#1646d8] flex items-center gap-2.5 transition-colors font-medium no-underline"
                  >
                    <Users className="w-4 h-4 text-[#1646d8]" />
                    <span>Quản lý tài khoản</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-[#ef3f4b] hover:bg-[#fff0f1] flex items-center gap-2.5 transition-colors cursor-pointer font-medium"
                >
                  <LogOut className="w-4 h-4 text-[#ef3f4b]" />
                  <span>Đăng xuất khỏi hệ thống</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
