import type {
  ConfigurationReleaseResult,
  ConfigurationReleaseRouteRequest,
} from "@/types/production-operations";

export interface ConfigurationReleaseRouteDraft
  extends ConfigurationReleaseRouteRequest {
  clientKey: string;
}

export function createConfigurationReleaseRouteDrafts(
  release: ConfigurationReleaseResult,
): ConfigurationReleaseRouteDraft[] {
  return release.routes.map((route) => ({
    clientKey: route.id,
    recipeId: route.recipeId,
    routeCode: route.routeCode,
    priority: route.priority,
    requiredCapabilities: route.requiredCapabilities.map((item) => ({ ...item })),
    supportedOptionCodes: [...route.supportedOptionCodes],
    robotBindings: route.robotBindings
      .slice()
      .sort((left, right) => left.bindingOrder - right.bindingOrder)
      .map((binding) => ({
        robotProgramId: binding.robotProgramId,
        bindingOrder: binding.bindingOrder,
        requiredWorkcellCapabilityCode:
          binding.requiredWorkcellCapabilityCode,
      })),
  }));
}

export function toConfigurationReleaseRouteRequests(
  drafts: ConfigurationReleaseRouteDraft[],
): ConfigurationReleaseRouteRequest[] {
  return drafts.map((route) => ({
    recipeId: route.recipeId,
    routeCode: route.routeCode.trim(),
    priority: route.priority,
    requiredCapabilities: route.requiredCapabilities.map((item) => ({
      code: item.code.trim(),
      required: item.required,
    })),
    supportedOptionCodes: [...new Set(route.supportedOptionCodes)],
    robotBindings: route.robotBindings.map((binding, index) => ({
      robotProgramId: binding.robotProgramId,
      bindingOrder: index + 1,
      requiredWorkcellCapabilityCode:
        binding.requiredWorkcellCapabilityCode.trim(),
    })),
  }));
}

export function validateConfigurationReleaseRouteDrafts(
  drafts: ConfigurationReleaseRouteDraft[],
): string | null {
  if (drafts.length === 0) return "Bản nháp phải có ít nhất một tuyến sản xuất.";

  const routeCodes = new Set<string>();
  for (const [routeIndex, route] of drafts.entries()) {
    const position = routeIndex + 1;
    const routeCode = route.routeCode.trim();
    if (!route.recipeId) return `Tuyến ${position} chưa chọn Recipe.`;
    if (!routeCode || routeCode.length > 100) {
      return `Mã tuyến ${position} phải có từ 1 đến 100 ký tự.`;
    }
    const normalizedCode = routeCode.toUpperCase();
    if (routeCodes.has(normalizedCode)) return `Mã tuyến "${routeCode}" đang bị trùng.`;
    routeCodes.add(normalizedCode);
    if (!Number.isInteger(route.priority) || route.priority < 0) {
      return `Độ ưu tiên của tuyến ${position} phải là số nguyên không âm.`;
    }
    if (route.robotBindings.length === 0) {
      return `Tuyến ${position} phải có ít nhất một liên kết thực thi.`;
    }
    const programIds = new Set<string>();
    for (const binding of route.robotBindings) {
      if (!binding.robotProgramId) return `Tuyến ${position} chưa chọn đủ chương trình robot.`;
      if (programIds.has(binding.robotProgramId)) {
        return `Tuyến ${position} đang dùng trùng một chương trình robot.`;
      }
      programIds.add(binding.robotProgramId);
      const capability = binding.requiredWorkcellCapabilityCode.trim();
      if (!capability || capability.length > 100) {
        return `Năng lực trạm của tuyến ${position} phải có từ 1 đến 100 ký tự.`;
      }
    }
  }

  return null;
}
