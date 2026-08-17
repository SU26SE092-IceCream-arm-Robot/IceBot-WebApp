import { ServiceRegistrationDraft } from '@/types/service-registration';

/**
 * Service mock for service registration.
 * This is a provisional implementation. Replace with actual API call
 * once the Backend contract is finalized.
 */
export async function submitServiceRegistration(
  _data: ServiceRegistrationDraft
): Promise<{ success: boolean; message?: string }> {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // In a real implementation, we would map the Draft to a DTO here
  // and send it via an HTTP client.

  // Simulate a successful registration
  return {
    success: true,
  };
}
