import React from 'react';
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SocketProvider } from '@/context/SocketContext'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true
})

export const metadata: Metadata = {
  title: 'Task & Report Management System',
  description: 'Hệ thống quản lý công việc và báo cáo nội bộ cho công ty',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <SocketProvider>
          {children}
        </SocketProvider>
      </body>
    </html>
  )
}
