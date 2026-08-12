import type {
  ProductCategoryResult,
  ProductResult,
  ProductVariantResult,
} from "@/types/catalog/menu-management";

const DEFAULT_PRODUCT_TYPES = ["General", "IceCream", "Packaged", "Mixed"];

export function getProductTypeLabel(value: string | null | undefined): string {
  switch (value?.trim().toLowerCase()) {
    case "general":
      return "Tổng quát";
    case "icecream":
      return "Kem";
    case "packaged":
      return "Đóng gói sẵn";
    case "mixed":
      return "Hỗn hợp";
    default:
      return value?.trim() || "Không xác định";
  }
}

export function getProductTypeOptions(
  categories: ProductCategoryResult[],
  currentValue?: string | null,
): string[] {
  return Array.from(
    new Set(
      [
        ...DEFAULT_PRODUCT_TYPES,
        ...categories.map((category) => category.productType.trim()).filter(Boolean),
        currentValue?.trim() || "",
      ].filter(Boolean),
    ),
  ).sort((left, right) =>
    getProductTypeLabel(left).localeCompare(getProductTypeLabel(right), "vi"),
  );
}

export interface ProductReadinessIssue {
  code:
    | "NO_VARIANT"
    | "NO_AVAILABLE_VARIANT"
    | "MISSING_SELLABLE_RECIPE"
    | "EMPTY_REQUIRED_OPTION_GROUP";
  message: string;
}

export function getVariantReadinessIssues(
  variant: ProductVariantResult,
): ProductReadinessIssue[] {
  if (
    variant.fulfillmentType === "MachineProduced" &&
    (variant.sellableRecipeCount ?? 0) === 0
  ) {
    return [
      {
        code: "MISSING_SELLABLE_RECIPE",
        message: `${variant.displayName?.trim() || variant.name} chưa có công thức đã phát hành.`,
      },
    ];
  }

  return [];
}

export function getProductReadinessIssues(
  product: ProductResult,
): ProductReadinessIssue[] {
  const issues: ProductReadinessIssue[] = [];

  if (product.variants.length === 0) {
    issues.push({ code: "NO_VARIANT", message: "Chưa có phiên bản sản phẩm." });
  } else if (!product.variants.some((variant) => variant.isAvailable)) {
    issues.push({
      code: "NO_AVAILABLE_VARIANT",
      message: "Không có phiên bản nào đang khả dụng.",
    });
  }

  for (const variant of product.variants.filter((item) => item.isAvailable)) {
    issues.push(...getVariantReadinessIssues(variant));
  }

  for (const group of product.optionGroups.filter(
    (item) => item.isActive && item.isRequired,
  )) {
    const availableOptions = group.options.filter((option) => option.isAvailable).length;
    if (availableOptions < group.minSelections) {
      issues.push({
        code: "EMPTY_REQUIRED_OPTION_GROUP",
        message: `Nhóm tùy chọn ${group.name} không đủ lựa chọn khả dụng.`,
      });
    }
  }

  return issues;
}
