import type {
  ProductResult,
  ProductVariantResult,
} from "@/types/menu-management";

export function getMenuItemReadinessBlockers({
  menuCurrency,
  product,
  recipeId,
  selectedOptionIds,
  variant,
}: {
  menuCurrency: string;
  product?: ProductResult;
  recipeId?: string | null;
  selectedOptionIds: string[];
  variant?: ProductVariantResult;
}): string[] {
  if (!product || !variant) return [];

  const blockers: string[] = [];
  if (variant.fulfillmentType === "MachineProduced" && !recipeId) {
    blockers.push("Món sản xuất bằng máy chưa có công thức hợp lệ.");
  }

  const selectedIds = new Set(selectedOptionIds);
  for (const group of product.optionGroups.filter((item) => item.isActive)) {
    const selected = group.options.filter((option) =>
      selectedIds.has(option.id),
    );
    const availableSelected = selected.filter((option) => option.isAvailable);

    if (availableSelected.length < group.minSelections) {
      blockers.push(
        `Nhóm ${group.name} cần ít nhất ${group.minSelections} lựa chọn khả dụng.`,
      );
    }
    if (availableSelected.length > group.maxSelections) {
      blockers.push(
        `Nhóm ${group.name} chỉ cho phép tối đa ${group.maxSelections} lựa chọn.`,
      );
    }
    if (selected.some((option) => !option.isAvailable)) {
      blockers.push(`Nhóm ${group.name} có lựa chọn đã ngừng bán.`);
    }
    if (
      selected.some(
        (option) => option.currency.toUpperCase() !== menuCurrency.toUpperCase(),
      )
    ) {
      blockers.push(`Nhóm ${group.name} có tùy chọn khác tiền tệ thực đơn.`);
    }
    if (
      variant.fulfillmentType === "Packaged" &&
      selected.some((option) => option.executionImpact === "ProductionAffecting")
    ) {
      blockers.push(
        `Món đóng gói không thể dùng tùy chọn ảnh hưởng sản xuất trong nhóm ${group.name}.`,
      );
    }
  }

  return blockers;
}
