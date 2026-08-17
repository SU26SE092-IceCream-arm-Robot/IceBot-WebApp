import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RegisterServicePage from '@/app/(public)/page';
import * as serviceRegistrationService from '@/lib/service-registration/service-registration-service';

// Mock the service
vi.mock('@/lib/service-registration/service-registration-service', () => ({
  submitServiceRegistration: vi.fn(),
}));

describe('RegisterServicePage', () => {
  it('renders the landing page sections correctly', () => {
    render(<RegisterServicePage />);

    // Header
    expect(screen.getAllByText('ICEBOT').length).toBeGreaterThan(0);
    
    // Hero Section
    expect(screen.getByText(/Vận hành điểm bán kem tự động thông minh cùng/i)).toBeInTheDocument();
    
    // Value Section
    expect(screen.getByText('Một nền tảng cho toàn bộ hệ thống vận hành')).toBeInTheDocument();
    
    // Form Section
    expect(screen.getByRole('heading', { name: 'Đăng ký triển khai IceBot' })).toBeInTheDocument();
  });

  it('validates required fields on submit', async () => {
    render(<RegisterServicePage />);
    
    const submitBtn = screen.getByRole('button', { name: 'Gửi yêu cầu đăng ký' });
    fireEvent.submit(submitBtn.closest('form') as HTMLFormElement);

    // Should show validation errors for required fields
    expect(await screen.findByText('Vui lòng nhập họ và tên.')).toBeInTheDocument();
    expect(await screen.findByText('Vui lòng nhập email hợp lệ.')).toBeInTheDocument();
    expect(await screen.findByText('Vui lòng nhập số điện thoại hợp lệ.')).toBeInTheDocument();
    expect(await screen.findByText('Vui lòng nhập tên doanh nghiệp / tổ chức.')).toBeInTheDocument();
    expect(await screen.findByText('Vui lòng nhập tỉnh / thành phố.')).toBeInTheDocument();
    expect(await screen.findByText('Bạn cần đồng ý để IceBot liên hệ.')).toBeInTheDocument();
    
    // Service should not be called
    expect(serviceRegistrationService.submitServiceRegistration).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    render(<RegisterServicePage />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    const submitBtn = screen.getByRole('button', { name: 'Gửi yêu cầu đăng ký' });
    fireEvent.submit(submitBtn.closest('form') as HTMLFormElement);

    expect(await screen.findByText('Vui lòng nhập email hợp lệ.')).toBeInTheDocument();
  });

  it('submits form successfully when valid data is provided', async () => {
    vi.mocked(serviceRegistrationService.submitServiceRegistration).mockResolvedValueOnce({ success: true });

    render(<RegisterServicePage />);
    
    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Họ và tên/i), { target: { value: 'Nguyen Van A' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Số điện thoại/i), { target: { value: '0901234567' } });
    fireEvent.change(screen.getByLabelText(/Tên doanh nghiệp/i), { target: { value: 'Công ty Test' } });
    fireEvent.change(screen.getByLabelText(/Tỉnh \/ Thành phố/i), { target: { value: 'Hà Nội' } });
    
    // Check consent checkbox
    const consentCheckbox = screen.getByRole('checkbox', { name: /Tôi đồng ý để IceBot liên hệ lại/i });
    fireEvent.click(consentCheckbox);

    // Submit form
    const submitBtn = screen.getByRole('button', { name: 'Gửi yêu cầu đăng ký' });
    fireEvent.submit(submitBtn.closest('form') as HTMLFormElement);

    // Assert that service is called
    await waitFor(() => {
      expect(serviceRegistrationService.submitServiceRegistration).toHaveBeenCalledWith(expect.objectContaining({
        fullName: 'Nguyen Van A',
        email: 'test@example.com',
        phoneNumber: '0901234567',
        businessName: 'Công ty Test',
        city: 'Hà Nội',
        consent: true,
      }));
    });

    // Check success state
    expect(await screen.findByText('Thông tin đăng ký đã sẵn sàng')).toBeInTheDocument();
    expect(await screen.findByText('Kết nối tiếp nhận đăng ký sẽ được tích hợp sau khi Backend contract được hoàn thiện.')).toBeInTheDocument();
    
    // Confirm form is gone
    expect(screen.queryByRole('button', { name: 'Gửi yêu cầu đăng ký' })).not.toBeInTheDocument();
  });
});
