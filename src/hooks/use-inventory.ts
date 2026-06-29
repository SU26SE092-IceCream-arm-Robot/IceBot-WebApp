"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  adjustDispenserEstimate,
  getInventoryErrorMessage,
  listDispenserStates,
  listStockMovements,
  refillDispenserState,
} from "@/lib/services/inventory";
import {
  getKioskManagementErrorMessage,
  getManagementKiosks,
} from "@/lib/services/kiosk-management";
import {
  getManagementStores,
  getStoresErrorMessage,
} from "@/lib/services/stores";
import type {
  KioskResult,
  StoreResult,
} from "@/types/kiosk-management";
import type {
  AdjustDispenserEstimateRequest,
  DispenserStateResult,
  InventoryFilters,
  InventoryMutationKind,
  InventoryPaginationMeta,
  InventoryStatusFilter,
  InventorySummary,
  RefillDispenserRequest,
  StockMovementResult,
} from "@/types/inventory-management";

const DISPENSER_PAGE_SIZE = 12;
const MOVEMENT_PAGE_SIZE = 8;

const INITIAL_FILTERS: InventoryFilters = {
  ingredientSearch: "",
  status: "ALL",
  storeId: "ALL",
  kioskId: "ALL",
};

function emptyPagination(
  page: number,
  pageSize: number,
): InventoryPaginationMeta {
  return {
    page,
    pageSize,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: page > 1,
  };
}

interface InventoryCollectionState<T> {
  data: T[];
  pagination: InventoryPaginationMeta;
  isLoading: boolean;
  errorMessage: string | null;
}

export interface UseInventoryResult {
  dispensers: InventoryCollectionState<DispenserStateResult>;
  visibleDispensers: DispenserStateResult[];
  movements: InventoryCollectionState<StockMovementResult>;
  stores: StoreResult[];
  kiosks: KioskResult[];
  availableKiosks: KioskResult[];
  filters: InventoryFilters;
  summary: InventorySummary;
  lookupWarning: string | null;
  selectedDispenser: DispenserStateResult | null;
  isDetailOpen: boolean;
  mutationDispenser: DispenserStateResult | null;
  mutationKind: InventoryMutationKind | null;
  isMutationOpen: boolean;
  isMutationSubmitting: boolean;
  mutationErrorMessage: string | null;
  mutationSuccessMessage: string | null;
  setIngredientSearch: (value: string) => void;
  setStatusFilter: (value: InventoryStatusFilter) => void;
  setStoreFilter: (value: string | null) => void;
  setKioskFilter: (value: string | null) => void;
  clearFilters: () => void;
  previousDispenserPage: () => void;
  nextDispenserPage: () => void;
  previousMovementPage: () => void;
  nextMovementPage: () => void;
  openDispenserDetail: (dispenser: DispenserStateResult) => void;
  setDetailOpen: (open: boolean) => void;
  openRefillDialog: (dispenser: DispenserStateResult) => void;
  openAdjustDialog: (dispenser: DispenserStateResult) => void;
  setMutationOpen: (open: boolean) => void;
  submitRefill: (request: RefillDispenserRequest) => Promise<boolean>;
  submitAdjustment: (
    request: AdjustDispenserEstimateRequest,
  ) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useInventory(): UseInventoryResult {
  const mutationInFlightRef = useRef(false);
  const [filters, setFilters] = useState<InventoryFilters>(INITIAL_FILTERS);
  const [dispenserPage, setDispenserPage] = useState(1);
  const [movementPage, setMovementPage] = useState(1);
  const [dispensers, setDispensers] = useState<
    InventoryCollectionState<DispenserStateResult>
  >({
    data: [],
    pagination: emptyPagination(1, DISPENSER_PAGE_SIZE),
    isLoading: true,
    errorMessage: null,
  });
  const [movements, setMovements] = useState<
    InventoryCollectionState<StockMovementResult>
  >({
    data: [],
    pagination: emptyPagination(1, MOVEMENT_PAGE_SIZE),
    isLoading: true,
    errorMessage: null,
  });
  const [stores, setStores] = useState<StoreResult[]>([]);
  const [kiosks, setKiosks] = useState<KioskResult[]>([]);
  const [lookupWarning, setLookupWarning] = useState<string | null>(null);
  const [selectedDispenser, setSelectedDispenser] =
    useState<DispenserStateResult | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [mutationDispenser, setMutationDispenser] =
    useState<DispenserStateResult | null>(null);
  const [mutationKind, setMutationKind] =
    useState<InventoryMutationKind | null>(null);
  const [isMutationOpen, setIsMutationOpen] = useState(false);
  const [isMutationSubmitting, setIsMutationSubmitting] = useState(false);
  const [mutationErrorMessage, setMutationErrorMessage] = useState<
    string | null
  >(null);
  const [mutationSuccessMessage, setMutationSuccessMessage] = useState<
    string | null
  >(null);

  const serverScope = useMemo(
    () => ({
      storeId: filters.storeId === "ALL" ? undefined : filters.storeId,
      kioskId: filters.kioskId === "ALL" ? undefined : filters.kioskId,
    }),
    [filters.kioskId, filters.storeId],
  );

  const fetchDispensers = useCallback(
    async (signal?: AbortSignal) => {
      setDispensers((current) => ({
        ...current,
        isLoading: true,
        errorMessage: null,
      }));

      try {
        const result = await listDispenserStates(
          {
            ...serverScope,
            pageNumber: dispenserPage,
            pageSize: DISPENSER_PAGE_SIZE,
          },
          signal,
        );

        if (signal?.aborted) {
          return;
        }

        setDispensers({
          data: result.data ?? [],
          pagination: result.pagination,
          isLoading: false,
          errorMessage: null,
        });
      } catch (error) {
        if (axios.isCancel(error) || signal?.aborted) {
          return;
        }

        setDispensers({
          data: [],
          pagination: emptyPagination(dispenserPage, DISPENSER_PAGE_SIZE),
          isLoading: false,
          errorMessage: getInventoryErrorMessage(
            error,
            "Không thể tải danh sách tồn kho.",
          ),
        });
      }
    },
    [dispenserPage, serverScope],
  );

  const fetchMovements = useCallback(
    async (signal?: AbortSignal) => {
      setMovements((current) => ({
        ...current,
        isLoading: true,
        errorMessage: null,
      }));

      try {
        const result = await listStockMovements(
          {
            ...serverScope,
            pageNumber: movementPage,
            pageSize: MOVEMENT_PAGE_SIZE,
          },
          signal,
        );

        if (signal?.aborted) {
          return;
        }

        setMovements({
          data: result.data ?? [],
          pagination: result.pagination,
          isLoading: false,
          errorMessage: null,
        });
      } catch (error) {
        if (axios.isCancel(error) || signal?.aborted) {
          return;
        }

        setMovements({
          data: [],
          pagination: emptyPagination(movementPage, MOVEMENT_PAGE_SIZE),
          isLoading: false,
          errorMessage: getInventoryErrorMessage(
            error,
            "Không thể tải lịch sử biến động tồn kho.",
          ),
        });
      }
    },
    [movementPage, serverScope],
  );

  const loadLookups = useCallback(async (signal?: AbortSignal) => {
    setLookupWarning(null);

    const [storesResult, kiosksResult] = await Promise.allSettled([
      getManagementStores({}, signal),
      getManagementKiosks({}, signal),
    ]);

    if (signal?.aborted) {
      return;
    }

    const warnings: string[] = [];

    if (storesResult.status === "fulfilled") {
      setStores(storesResult.value);
    } else {
      setStores([]);
      warnings.push(
        getStoresErrorMessage(
          storesResult.reason,
          "Không thể tải bộ lọc cửa hàng.",
        ),
      );
    }

    if (kiosksResult.status === "fulfilled") {
      setKiosks(kiosksResult.value);
    } else {
      setKiosks([]);
      warnings.push(
        getKioskManagementErrorMessage(
          kiosksResult.reason,
          "Không thể tải bộ lọc kiosk.",
        ),
      );
    }

    setLookupWarning(warnings.length > 0 ? warnings.join(" ") : null);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void loadLookups(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadLookups]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void fetchDispensers(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [fetchDispensers]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void fetchMovements(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [fetchMovements]);

  const availableKiosks = useMemo(
    () =>
      kiosks.filter(
        (kiosk) =>
          filters.storeId === "ALL" || kiosk.storeId === filters.storeId,
      ),
    [filters.storeId, kiosks],
  );

  const visibleDispensers = useMemo(() => {
    const keyword = filters.ingredientSearch.trim().toLocaleLowerCase("vi");

    return dispensers.data.filter((dispenser) => {
      const matchesStatus =
        filters.status === "ALL" ||
        dispenser.currentLevelStatus === filters.status;
      const searchableText = [
        dispenser.ingredientName,
        dispenser.ingredientCode,
        dispenser.containerCode,
        dispenser.deviceCode,
        dispenser.kioskName ?? "",
      ]
        .join(" ")
        .toLocaleLowerCase("vi");

      return matchesStatus && (!keyword || searchableText.includes(keyword));
    });
  }, [dispensers.data, filters.ingredientSearch, filters.status]);

  const summary = useMemo<InventorySummary>(
    () => ({
      total: dispensers.pagination.totalCount,
      lowOnPage: dispensers.data.filter(
        (item) => item.currentLevelStatus === "Low",
      ).length,
      fullOnPage: dispensers.data.filter(
        (item) => item.currentLevelStatus === "Full",
      ).length,
      unknownOnPage: dispensers.data.filter(
        (item) => item.currentLevelStatus === "Unknown",
      ).length,
    }),
    [dispensers.data, dispensers.pagination.totalCount],
  );

  const setStoreFilter = useCallback((value: string | null) => {
    setFilters((current) => ({
      ...current,
      storeId: value ?? "ALL",
      kioskId: "ALL",
    }));
    setDispenserPage(1);
    setMovementPage(1);
  }, []);

  const setKioskFilter = useCallback((value: string | null) => {
    setFilters((current) => ({
      ...current,
      kioskId: value ?? "ALL",
    }));
    setDispenserPage(1);
    setMovementPage(1);
  }, []);

  const setIngredientSearch = useCallback((value: string) => {
    setFilters((current) => ({ ...current, ingredientSearch: value }));
  }, []);

  const setStatusFilter = useCallback((value: InventoryStatusFilter) => {
    setFilters((current) => ({ ...current, status: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setDispenserPage(1);
    setMovementPage(1);
  }, []);

  const openDispenserDetail = useCallback(
    (dispenser: DispenserStateResult) => {
      setSelectedDispenser(dispenser);
      setIsDetailOpen(true);
    },
    [],
  );

  const setDetailOpen = useCallback((open: boolean) => {
    setIsDetailOpen(open);
    if (!open) {
      setSelectedDispenser(null);
    }
  }, []);

  const openMutationDialog = useCallback(
    (kind: InventoryMutationKind, dispenser: DispenserStateResult) => {
      setMutationKind(kind);
      setMutationDispenser(dispenser);
      setMutationErrorMessage(null);
      setMutationSuccessMessage(null);
      setIsMutationOpen(true);
    },
    [],
  );

  const setMutationOpen = useCallback(
    (open: boolean) => {
      if (mutationInFlightRef.current) {
        return;
      }

      setIsMutationOpen(open);
      if (!open) {
        setMutationKind(null);
        setMutationDispenser(null);
        setMutationErrorMessage(null);
      }
    },
    [],
  );

  const finishMutation = useCallback(
    async (successMessage: string) => {
      await Promise.all([fetchDispensers(), fetchMovements()]);
      setMutationSuccessMessage(successMessage);
      setIsMutationOpen(false);
      setMutationKind(null);
      setMutationDispenser(null);
      setMutationErrorMessage(null);
    },
    [fetchDispensers, fetchMovements],
  );

  const submitRefill = useCallback(
    async (request: RefillDispenserRequest) => {
      if (!mutationDispenser || mutationInFlightRef.current) {
        return false;
      }

      mutationInFlightRef.current = true;
      setIsMutationSubmitting(true);
      setMutationErrorMessage(null);

      try {
        await refillDispenserState(mutationDispenser.id, request);
        await finishMutation(
          `Đã ghi nhận refill cho ${mutationDispenser.ingredientName}.`,
        );
        return true;
      } catch (error) {
        setMutationErrorMessage(
          getInventoryErrorMessage(
            error,
            "Không thể ghi nhận refill. Vui lòng kiểm tra dữ liệu và thử lại.",
          ),
        );
        return false;
      } finally {
        mutationInFlightRef.current = false;
        setIsMutationSubmitting(false);
      }
    },
    [finishMutation, mutationDispenser],
  );

  const submitAdjustment = useCallback(
    async (request: AdjustDispenserEstimateRequest) => {
      if (!mutationDispenser || mutationInFlightRef.current) {
        return false;
      }

      mutationInFlightRef.current = true;
      setIsMutationSubmitting(true);
      setMutationErrorMessage(null);

      try {
        await adjustDispenserEstimate(mutationDispenser.id, request);
        await finishMutation(
          `Đã cập nhật lượng ước tính cho ${mutationDispenser.ingredientName}.`,
        );
        return true;
      } catch (error) {
        setMutationErrorMessage(
          getInventoryErrorMessage(
            error,
            "Không thể điều chỉnh lượng ước tính. Vui lòng kiểm tra dữ liệu và thử lại.",
          ),
        );
        return false;
      } finally {
        mutationInFlightRef.current = false;
        setIsMutationSubmitting(false);
      }
    },
    [finishMutation, mutationDispenser],
  );

  return {
    dispensers,
    visibleDispensers,
    movements,
    stores,
    kiosks,
    availableKiosks,
    filters,
    summary,
    lookupWarning,
    selectedDispenser,
    isDetailOpen,
    mutationDispenser,
    mutationKind,
    isMutationOpen,
    isMutationSubmitting,
    mutationErrorMessage,
    mutationSuccessMessage,
    setIngredientSearch,
    setStatusFilter,
    setStoreFilter,
    setKioskFilter,
    clearFilters,
    previousDispenserPage: () =>
      setDispenserPage((page) => Math.max(page - 1, 1)),
    nextDispenserPage: () => setDispenserPage((page) => page + 1),
    previousMovementPage: () =>
      setMovementPage((page) => Math.max(page - 1, 1)),
    nextMovementPage: () => setMovementPage((page) => page + 1),
    openDispenserDetail,
    setDetailOpen,
    openRefillDialog: (dispenser) =>
      openMutationDialog("refill", dispenser),
    openAdjustDialog: (dispenser) =>
      openMutationDialog("adjust", dispenser),
    setMutationOpen,
    submitRefill,
    submitAdjustment,
    refresh: async () => {
      await Promise.all([fetchDispensers(), fetchMovements(), loadLookups()]);
    },
  };
}
