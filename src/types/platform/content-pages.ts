export type StaticContentPageKey =
  | "about-us"
  | "privacy-policy"
  | "payment-policy"
  | "terms-of-use"
  | "contact-information";

export const STATIC_CONTENT_PAGE_KEYS: readonly StaticContentPageKey[] = [
  "about-us",
  "privacy-policy",
  "payment-policy",
  "terms-of-use",
  "contact-information",
] as const;

export const STATIC_CONTENT_PAGE_METADATA: Record<
  StaticContentPageKey,
  { label: string; defaultTitle: string; description: string }
> = {
  "about-us": {
    label: "Về chúng tôi",
    defaultTitle: "Giới thiệu về IceBot",
    description: "Giới thiệu tầm nhìn, sứ mệnh và giải pháp kiosk robot bán kem tự động.",
  },
  "privacy-policy": {
    label: "Chính sách bảo mật",
    defaultTitle: "Chính sách bảo mật thông tin",
    description: "Quy định về thu thập, sử dụng và bảo vệ thông tin người dùng và đối tác.",
  },
  "payment-policy": {
    label: "Chính sách thanh toán",
    defaultTitle: "Chính sách thanh toán & hoàn tiền",
    description: "Quy định về các phương thức thanh toán, hoàn tiền và xử lý tranh chấp giao dịch.",
  },
  "terms-of-use": {
    label: "Điều khoản sử dụng",
    defaultTitle: "Điều khoản & Điều kiện sử dụng dịch vụ",
    description: "Các điều khoản pháp lý ràng buộc giữa người dùng và nền tảng IceBot.",
  },
  "contact-information": {
    label: "Thông tin liên hệ",
    defaultTitle: "Thông tin liên hệ & Hỗ trợ khách hàng",
    description: "Địa chỉ văn phòng, hotline hỗ trợ kỹ thuật, email liên hệ và mạng xã hội.",
  },
};

export interface ContentPageRevisionResult {
  id: string;
  contentPageId: string;
  revisionNumber: number;
  title: string;
  bodyHtml: string;
  publishedByAccountId?: string | null;
  publishedAt: string;
}

export interface ContentPageResult {
  id: string;
  key: string;
  slug: string;
  draftTitle?: string | null;
  draftBodyHtml?: string | null;
  publishedRevisionId?: string | null;
  revision?: number | null;
  updatedByAccountId?: string | null;
  updatedAt?: string | null;
}

export interface ContentPageDetailResult extends ContentPageResult {
  revisions?: ContentPageRevisionResult[];
}

export interface SaveContentPageDraftRequest {
  title: string;
  bodyHtml: string;
  expectedRevision?: number;
}

export interface PublishContentPageRequest {
  expectedRevision?: number;
}

export interface PublicContentPageResult {
  id?: string;
  slug: string;
  title: string;
  bodyHtml: string;
  publishedAt?: string | null;
  revisionNumber?: number;
}
