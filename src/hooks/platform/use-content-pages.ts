"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";

import {
  getManagementContentPage,
  listManagementContentPages,
  publishContentPage,
  saveContentPageDraft,
} from "@/lib/services/platform/content-pages";
import {
  STATIC_CONTENT_PAGE_KEYS,
  STATIC_CONTENT_PAGE_METADATA,
  type ContentPageDetailResult,
  type ContentPageResult,
  type PublishContentPageRequest,
  type SaveContentPageDraftRequest,
  type StaticContentPageKey,
} from "@/types/platform/content-pages";

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isCancel(error)) return "";
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; businessError?: string }
      | undefined;
    return data?.message || data?.businessError || error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

/**
 * Hook to manage static content pages list in System Admin platform view.
 */
export function useContentPages() {
  const [items, setItems] = useState<ContentPageResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listManagementContentPages(signal);
      if (signal?.aborted) return false;

      // Merge backend items with predefined static keys if backend is not seeded yet
      const resultMap = new Map<string, ContentPageResult>(
        result.map((page) => [page.key, page]),
      );

      const mergedList: ContentPageResult[] = STATIC_CONTENT_PAGE_KEYS.map(
        (key) => {
          const existing = resultMap.get(key);
          if (existing) return existing;
          const meta = STATIC_CONTENT_PAGE_METADATA[key];
          return {
            id: `temp-${key}`,
            key,
            slug: key,
            draftTitle: meta.defaultTitle,
            draftBodyHtml: "",
            publishedRevisionId: null,
            revision: 0,
            updatedAt: null,
          };
        },
      );

      setItems(mergedList);
      return true;
    } catch (loadError) {
      if (axios.isCancel(loadError) || signal?.aborted) return false;
      const message = getErrorMessage(
        loadError,
        "Không thể tải danh sách trang nội dung.",
      );
      setError(message);

      // Fallback to static predefined pages list
      const fallbackList: ContentPageResult[] = STATIC_CONTENT_PAGE_KEYS.map(
        (key) => {
          const meta = STATIC_CONTENT_PAGE_METADATA[key];
          return {
            id: `temp-${key}`,
            key,
            slug: key,
            draftTitle: meta.defaultTitle,
            draftBodyHtml: "",
            publishedRevisionId: null,
            revision: 0,
            updatedAt: null,
          };
        },
      );
      setItems(fallbackList);
      return false;
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return {
    items,
    isLoading,
    error,
    refresh: () => void load(),
  };
}

/**
 * Hook to manage a single content page editor in System Admin.
 */
export function useContentPageDetail(key: string) {
  const [page, setPage] = useState<ContentPageDetailResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getManagementContentPage(key, signal);
      if (signal?.aborted) return false;
      setPage(result);
      return true;
    } catch (loadError) {
      if (axios.isCancel(loadError) || signal?.aborted) return false;
      const message = getErrorMessage(
        loadError,
        "Không thể tải chi tiết trang nội dung.",
      );
      setError(message);

      // Fallback with static page metadata if not initialized on backend
      const staticKey = key as StaticContentPageKey;
      const meta = STATIC_CONTENT_PAGE_METADATA[staticKey];
      if (meta) {
        setPage({
          id: `temp-${key}`,
          key,
          slug: key,
          draftTitle: meta.defaultTitle,
          draftBodyHtml: "",
          publishedRevisionId: null,
          revision: 0,
          revisions: [],
        });
      }
      return false;
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [key]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const saveDraft = useCallback(
    async (request: { title: string; bodyHtml: string; expectedRevision?: number }) => {
      setIsSaving(true);
      try {
        const payload: SaveContentPageDraftRequest = {
          title: request.title,
          bodyHtml: request.bodyHtml,
          expectedRevision:
            request.expectedRevision !== undefined
              ? request.expectedRevision
              : (page?.revision ?? 0),
        };
        const result = await saveContentPageDraft(key, payload);
        setPage((prev) => (prev ? { ...prev, ...result } : result));
        return result;
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 409) {
          void load();
        }
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [key, page?.revision, load],
  );

  const publish = useCallback(
    async (request?: { expectedRevision?: number }) => {
      setIsPublishing(true);
      try {
        const payload: PublishContentPageRequest = {
          expectedRevision:
            request?.expectedRevision !== undefined
              ? request.expectedRevision
              : (page?.revision ?? 0),
        };
        const result = await publishContentPage(key, payload);
        await load();
        return result;
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 409) {
          void load();
        }
        throw err;
      } finally {
        setIsPublishing(false);
      }
    },
    [key, page?.revision, load],
  );

  return {
    page,
    isLoading,
    isSaving,
    isPublishing,
    error,
    refresh: () => void load(),
    saveDraft,
    publish,
  };
}
