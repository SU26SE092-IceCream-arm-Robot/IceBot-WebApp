import {
  READINESS_CHECK_DEFINITIONS,
  getReadinessUnknownDetail,
} from "@/lib/readiness/readiness-labels";
import type { KioskResult, StoreResult } from "@/types/kiosk-management";
import type { MenuResult, ProductResult } from "@/types/menu-management";
import type { PaymentMethodResult } from "@/types/payments";
import type {
  ReadinessCheck,
  ReadinessCheckId,
  ReadinessEvidence,
  ReadinessOverallStatus,
  ReadinessSource,
  ReadinessStatus,
  SetupReadinessRawData,
  SetupReadinessResult,
} from "@/types/setup-readiness";
import type { OrganizationResult } from "@/types/tenant-management";

const CHECK_ORDER: ReadinessCheckId[] = [
  "ORG_ACTIVE",
  "STORE_ACTIVE",
  "KIOSK_EXISTS",
  "PRODUCT_EXISTS",
  "VARIANT_EXISTS",
  "MENU_EXISTS",
  "MENU_ITEM_EXISTS",
  "PAYMENT_ACTIVE",
];

const SOURCE_BY_CHECK: Record<ReadinessCheckId, ReadinessSource> = {
  ORG_ACTIVE: "organization",
  STORE_ACTIVE: "store",
  KIOSK_EXISTS: "kiosks",
  PRODUCT_EXISTS: "products",
  VARIANT_EXISTS: "products",
  MENU_EXISTS: "menus",
  MENU_ITEM_EXISTS: "menus",
  PAYMENT_ACTIVE: "paymentMethods",
};

function buildCheck(
  id: ReadinessCheckId,
  status: ReadinessStatus,
  evidence?: ReadinessEvidence,
): ReadinessCheck {
  const definition = READINESS_CHECK_DEFINITIONS[id];

  return {
    id,
    group: definition.group,
    title: definition.title,
    description: definition.description,
    status,
    isCritical: definition.isCritical,
    evidence,
    action: definition.action,
  };
}

function unknownCheck(raw: SetupReadinessRawData, id: ReadinessCheckId) {
  const source = SOURCE_BY_CHECK[id];
  const failure = raw.failures?.find((item) => item.source === source);

  return buildCheck(id, "unknown", {
    detail: failure?.message ?? getReadinessUnknownDetail(failure?.statusCode),
    statusLabel: failure?.statusCode ? `HTTP ${failure.statusCode}` : undefined,
  });
}

function hasFailure(raw: SetupReadinessRawData, id: ReadinessCheckId) {
  const source = SOURCE_BY_CHECK[id];
  return raw.failures?.some((item) => item.source === source) ?? false;
}

function isActiveStatus(status: string | undefined | null) {
  return status === "Active";
}

function evaluateOrganization(
  organization: OrganizationResult | null | undefined,
) {
  if (!organization) {
    return buildCheck("ORG_ACTIVE", "missing", {
      detail: "Chưa chọn hoặc chưa tìm thấy tổ chức.",
    });
  }

  return buildCheck(
    "ORG_ACTIVE",
    isActiveStatus(organization.status) ? "complete" : "warning",
    {
      entityName: organization.name,
      statusLabel: organization.status,
    },
  );
}

function evaluateStore(
  store: StoreResult | null | undefined,
  organizationId: string,
) {
  if (!store) {
    return buildCheck("STORE_ACTIVE", "missing", {
      detail: "Chưa chọn hoặc chưa tìm thấy cửa hàng.",
    });
  }

  if (store.organizationId !== organizationId) {
    return buildCheck("STORE_ACTIVE", "missing", {
      entityName: store.name,
      detail: "Cửa hàng không thuộc tổ chức đã chọn.",
    });
  }

  return buildCheck(
    "STORE_ACTIVE",
    isActiveStatus(store.status) ? "complete" : "warning",
    {
      entityName: store.name,
      statusLabel: store.status,
    },
  );
}

function kiosksForStore(kiosks: KioskResult[] | undefined, storeId: string) {
  return (kiosks ?? []).filter((kiosk) => kiosk.storeId === storeId);
}

function productAppliesToStore(
  product: ProductResult,
  organizationId: string,
  storeId: string,
  storeKiosks: KioskResult[],
) {
  if (product.organizationId === organizationId && !product.storeId && !product.kioskId) {
    return true;
  }

  if (product.storeId === storeId) {
    return true;
  }

  const kioskIds = new Set(storeKiosks.map((kiosk) => kiosk.id));
  return Boolean(product.kioskId && kioskIds.has(product.kioskId));
}

function menuAppliesToStore(
  menu: MenuResult,
  organizationId: string,
  storeId: string,
  storeKiosks: KioskResult[],
) {
  if (menu.organizationId === organizationId && !menu.storeId && !menu.kioskId) {
    return true;
  }

  if (menu.storeId === storeId) {
    return true;
  }

  const kioskIds = new Set(storeKiosks.map((kiosk) => kiosk.id));
  return Boolean(menu.kioskId && kioskIds.has(menu.kioskId));
}

function relevantProducts(raw: SetupReadinessRawData) {
  const storeKiosks = kiosksForStore(raw.kiosks, raw.storeId);
  return (raw.products ?? []).filter((product) =>
    productAppliesToStore(product, raw.organizationId, raw.storeId, storeKiosks),
  );
}

function relevantMenus(raw: SetupReadinessRawData) {
  const storeKiosks = kiosksForStore(raw.kiosks, raw.storeId);
  return (raw.menus ?? []).filter((menu) =>
    menuAppliesToStore(menu, raw.organizationId, raw.storeId, storeKiosks),
  );
}

function evaluateKiosks(raw: SetupReadinessRawData) {
  const kiosks = kiosksForStore(raw.kiosks, raw.storeId);
  return buildCheck("KIOSK_EXISTS", kiosks.length > 0 ? "complete" : "missing", {
    count: kiosks.length,
  });
}

function evaluateProducts(raw: SetupReadinessRawData) {
  const products = relevantProducts(raw);
  return buildCheck("PRODUCT_EXISTS", products.length > 0 ? "complete" : "missing", {
    count: products.length,
  });
}

function evaluateVariants(raw: SetupReadinessRawData) {
  const products = relevantProducts(raw);
  const variantCount = products.reduce(
    (total, product) => total + product.variants.length,
    0,
  );

  return buildCheck("VARIANT_EXISTS", variantCount > 0 ? "complete" : "missing", {
    count: variantCount,
  });
}

function evaluateMenus(raw: SetupReadinessRawData) {
  const menus = relevantMenus(raw);
  if (menus.length === 0) {
    return buildCheck("MENU_EXISTS", "missing", { count: 0 });
  }

  const activeCount = menus.filter((menu) => menu.status === "Active").length;
  return buildCheck("MENU_EXISTS", activeCount > 0 ? "complete" : "warning", {
    count: menus.length,
    statusLabel: activeCount > 0 ? `${activeCount} Active` : "Chưa có menu Active",
  });
}

function evaluateMenuItems(raw: SetupReadinessRawData) {
  const menus = relevantMenus(raw);
  const menuItemCount = menus.reduce((total, menu) => total + menu.items.length, 0);
  if (menuItemCount === 0) {
    return buildCheck("MENU_ITEM_EXISTS", "missing", { count: 0 });
  }

  const activeItemCount = menus.reduce(
    (total, menu) =>
      total + menu.items.filter((item) => item.status === "Active").length,
    0,
  );

  return buildCheck(
    "MENU_ITEM_EXISTS",
    activeItemCount > 0 ? "complete" : "warning",
    {
      count: menuItemCount,
      statusLabel:
        activeItemCount > 0 ? `${activeItemCount} Active` : "Chưa có món Active",
    },
  );
}

function evaluatePayment(methods: PaymentMethodResult[] | undefined) {
  const activeCount = (methods ?? []).filter((method) => method.isActive).length;
  return buildCheck("PAYMENT_ACTIVE", activeCount > 0 ? "complete" : "missing", {
    count: activeCount,
  });
}

function summarize(checks: ReadinessCheck[]) {
  const completedCount = checks.filter((check) => check.status === "complete").length;
  const warningCount = checks.filter((check) => check.status === "warning").length;
  const missingCount = checks.filter((check) => check.status === "missing").length;
  const unknownCount = checks.filter((check) => check.status === "unknown").length;
  const criticalChecks = checks.filter((check) => check.isCritical);

  let overallStatus: ReadinessOverallStatus = "complete";
  if (criticalChecks.some((check) => check.status === "unknown")) {
    overallStatus = "unknown";
  } else if (criticalChecks.some((check) => check.status === "missing")) {
    overallStatus = "missing_configuration";
  } else if (warningCount > 0) {
    overallStatus = "needs_attention";
  }

  return {
    overallStatus,
    completedCount,
    totalApplicableCount: checks.length,
    warningCount,
    missingCount,
    unknownCount,
  };
}

function prioritizeNextActions(checks: ReadinessCheck[]) {
  const priority: ReadinessStatus[] = ["missing", "unknown", "warning"];
  return priority
    .flatMap((status) => checks.filter((check) => check.status === status))
    .slice(0, 3);
}

export function evaluateReadiness(raw: SetupReadinessRawData): SetupReadinessResult {
  const evaluators: Record<ReadinessCheckId, () => ReadinessCheck> = {
    ORG_ACTIVE: () => evaluateOrganization(raw.organization),
    STORE_ACTIVE: () => evaluateStore(raw.store, raw.organizationId),
    KIOSK_EXISTS: () => evaluateKiosks(raw),
    PRODUCT_EXISTS: () => evaluateProducts(raw),
    VARIANT_EXISTS: () => evaluateVariants(raw),
    MENU_EXISTS: () => evaluateMenus(raw),
    MENU_ITEM_EXISTS: () => evaluateMenuItems(raw),
    PAYMENT_ACTIVE: () => evaluatePayment(raw.paymentMethods),
  };

  const checks = CHECK_ORDER.map((id) =>
    hasFailure(raw, id) ? unknownCheck(raw, id) : evaluators[id](),
  );
  const summary = summarize(checks);

  return {
    organizationId: raw.organizationId,
    storeId: raw.storeId,
    checks,
    summary,
    nextActions: prioritizeNextActions(checks),
    evaluatedAt: raw.evaluatedAt ?? new Date().toISOString(),
  };
}
