"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

import {
  createAccount,
  disableAccount,
  getAccountById,
  getAccountsErrorMessage,
  getInvitationErrorMessage,
  listManagementAccounts,
  regenerateInvitation,
} from "@/lib/services/accounts";
import {
  getManagementRoles,
  getRolesErrorMessage,
  getRoleScopeOptions,
} from "@/lib/services/roles";
import type {
  AccountInvitationResult,
  CreateInternalAccountRequest,
  InternalAccountResult,
  ManagementAccountStatusFilter,
  ManagementAccountsQuery,
  ManagementRoleResult,
  PaginationMeta,
  RoleScopeOptionsResult,
} from "@/types/accounts";

const DEFAULT_PAGE_SIZE = 10;

const INITIAL_QUERY: ManagementAccountsQuery = {
  searchTerm: "",
  status: "ALL",
  pageNumber: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

const EMPTY_PAGINATION: PaginationMeta = {
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalCount: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

export interface UseAccountsResult {
  accounts: InternalAccountResult[];
  query: ManagementAccountsQuery;
  pagination: PaginationMeta;
  isLoading: boolean;
  errorMessage: string | null;
  selectedAccount: InternalAccountResult | null;
  accountPendingDisable: InternalAccountResult | null;
  isDetailOpen: boolean;
  isDetailLoading: boolean;
  detailErrorMessage: string | null;
  isDisableOpen: boolean;
  isDisabling: boolean;
  disableErrorMessage: string | null;
  isCreateOpen: boolean;
  isCreating: boolean;
  createErrorMessage: string | null;
  managementRoles: ManagementRoleResult[];
  createRoleCode: string;
  isRoleCatalogLoading: boolean;
  roleCatalogErrorMessage: string | null;
  roleScopeOptions: RoleScopeOptionsResult | null;
  isRoleScopeLoading: boolean;
  roleScopeErrorMessage: string | null;
  accountPendingInvitation: InternalAccountResult | null;
  isRegenerateOpen: boolean;
  isRegenerating: boolean;
  regenerateErrorMessage: string | null;
  regenerateSendEmail: boolean;
  invitationResult: AccountInvitationResult | null;
  invitationAccount: InternalAccountResult | null;
  invitationResultMode: "created" | "regenerated" | null;
  isInvitationResultOpen: boolean;
  successMessage: string | null;
  setSearchTerm: (value: string) => void;
  setStatus: (value: ManagementAccountStatusFilter) => void;
  clearFilters: () => void;
  previousPage: () => void;
  nextPage: () => void;
  refresh: () => Promise<void>;
  openAccountDetail: (accountId: string) => Promise<void>;
  setDetailOpen: (open: boolean) => void;
  requestDisableAccount: (account: InternalAccountResult) => void;
  setDisableOpen: (open: boolean) => void;
  confirmDisableAccount: () => Promise<void>;
  setCreateOpen: (open: boolean) => void;
  selectCreateRole: (roleCode: string) => void;
  submitCreateAccount: (request: CreateInternalAccountRequest) => Promise<boolean>;
  requestRegenerateInvitation: (account: InternalAccountResult) => void;
  setRegenerateOpen: (open: boolean) => void;
  setRegenerateSendEmail: (sendEmail: boolean) => void;
  confirmRegenerateInvitation: () => Promise<void>;
  setInvitationResultOpen: (open: boolean) => void;
  clearSuccessMessage: () => void;
}

export function useAccounts(): UseAccountsResult {
  const [query, setQuery] = useState<ManagementAccountsQuery>(INITIAL_QUERY);
  const [accounts, setAccounts] = useState<InternalAccountResult[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(EMPTY_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<InternalAccountResult | null>(null);
  const [accountPendingDisable, setAccountPendingDisable] =
    useState<InternalAccountResult | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailErrorMessage, setDetailErrorMessage] = useState<string | null>(null);
  const [isDisableOpen, setIsDisableOpen] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [disableErrorMessage, setDisableErrorMessage] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createErrorMessage, setCreateErrorMessage] = useState<string | null>(null);
  const [managementRoles, setManagementRoles] = useState<ManagementRoleResult[]>([]);
  const [createRoleCode, setCreateRoleCode] = useState("");
  const [isRoleCatalogLoading, setIsRoleCatalogLoading] = useState(false);
  const [roleCatalogErrorMessage, setRoleCatalogErrorMessage] = useState<string | null>(null);
  const [roleScopeOptions, setRoleScopeOptions] = useState<RoleScopeOptionsResult | null>(null);
  const [isRoleScopeLoading, setIsRoleScopeLoading] = useState(false);
  const [roleScopeErrorMessage, setRoleScopeErrorMessage] = useState<string | null>(null);
  const roleScopeCacheRef = useRef(new Map<string, RoleScopeOptionsResult>());
  const roleCatalogRequestIdRef = useRef(0);
  const roleScopeRequestIdRef = useRef(0);
  const [accountPendingInvitation, setAccountPendingInvitation] =
    useState<InternalAccountResult | null>(null);
  const [isRegenerateOpen, setIsRegenerateOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateErrorMessage, setRegenerateErrorMessage] = useState<string | null>(null);
  const [regenerateSendEmail, setRegenerateSendEmail] = useState(true);
  const [invitationResult, setInvitationResult] = useState<AccountInvitationResult | null>(null);
  const [invitationAccount, setInvitationAccount] = useState<InternalAccountResult | null>(null);
  const [invitationResultMode, setInvitationResultMode] =
    useState<"created" | "regenerated" | null>(null);
  const [isInvitationResultOpen, setIsInvitationResultOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchAccounts = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await listManagementAccounts(query, signal);
        if (signal?.aborted) {
          return;
        }

        setAccounts(result.data ?? []);
        setPagination(result.pagination);
      } catch (error) {
        if (axios.isCancel(error) || signal?.aborted) {
          return;
        }

        setAccounts([]);
        setPagination(EMPTY_PAGINATION);
        setErrorMessage(getAccountsErrorMessage(error));
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [query]
  );

  useEffect(() => {
    const abortController = new AbortController();
    const delay = query.searchTerm ? 250 : 0;
    const timeoutId = window.setTimeout(() => {
      void fetchAccounts(abortController.signal);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [fetchAccounts, query.searchTerm]);

  const setSearchTerm = useCallback((value: string) => {
    setQuery((previous) => ({
      ...previous,
      searchTerm: value,
      pageNumber: 1,
    }));
  }, []);

  const setStatus = useCallback((value: ManagementAccountStatusFilter) => {
    setQuery((previous) => ({
      ...previous,
      status: value,
      pageNumber: 1,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setQuery(INITIAL_QUERY);
  }, []);

  const previousPage = useCallback(() => {
    setQuery((previous) => ({
      ...previous,
      pageNumber: Math.max(previous.pageNumber - 1, 1),
    }));
  }, []);

  const nextPage = useCallback(() => {
    setQuery((previous) => ({
      ...previous,
      pageNumber: previous.pageNumber + 1,
    }));
  }, []);

  const openAccountDetail = useCallback(async (accountId: string) => {
    setIsDetailOpen(true);
    setIsDetailLoading(true);
    setDetailErrorMessage(null);
    setSelectedAccount(null);

    try {
      const account = await getAccountById(accountId);
      setSelectedAccount(account);
    } catch (error) {
      setDetailErrorMessage(
        getAccountsErrorMessage(error, "Không thể tải chi tiết tài khoản.")
      );
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  const setDetailOpen = useCallback((open: boolean) => {
    setIsDetailOpen(open);
    if (!open) {
      setSelectedAccount(null);
      setDetailErrorMessage(null);
    }
  }, []);

  const requestDisableAccount = useCallback((account: InternalAccountResult) => {
    setAccountPendingDisable(account);
    setDisableErrorMessage(null);
    setIsDisableOpen(true);
  }, []);

  const setDisableOpen = useCallback(
    (open: boolean) => {
      if (isDisabling) {
        return;
      }

      setIsDisableOpen(open);
      if (!open) {
        setAccountPendingDisable(null);
        setDisableErrorMessage(null);
      }
    },
    [isDisabling]
  );

  const confirmDisableAccount = useCallback(async () => {
    if (!accountPendingDisable || isDisabling) {
      return;
    }

    setIsDisabling(true);
    setDisableErrorMessage(null);
    setSuccessMessage(null);

    try {
      const disabledAccount = await disableAccount(accountPendingDisable.id);
      setAccounts((current) =>
        current.map((account) =>
          account.id === disabledAccount.id ? disabledAccount : account
        )
      );
      setSelectedAccount((current) =>
        current?.id === disabledAccount.id ? disabledAccount : current
      );
      setSuccessMessage(
        `Đã vô hiệu hóa tài khoản ${disabledAccount.fullName?.trim() || disabledAccount.userName}.`
      );
      setIsDisableOpen(false);
      setAccountPendingDisable(null);
    } catch (error) {
      setDisableErrorMessage(
        getAccountsErrorMessage(error, "Không thể vô hiệu hóa tài khoản.")
      );
    } finally {
      setIsDisabling(false);
    }
  }, [accountPendingDisable, isDisabling]);

  const loadRoleScopeOptions = useCallback(async (roleCode: string) => {
    const requestId = ++roleScopeRequestIdRef.current;
    setCreateRoleCode(roleCode);
    setRoleScopeOptions(null);
    setRoleScopeErrorMessage(null);

    const cachedOptions = roleScopeCacheRef.current.get(roleCode);
    if (cachedOptions) {
      setRoleScopeOptions(cachedOptions);
      setIsRoleScopeLoading(false);
      return;
    }

    setIsRoleScopeLoading(true);
    try {
      const options = await getRoleScopeOptions(roleCode);
      if (requestId !== roleScopeRequestIdRef.current) {
        return;
      }

      roleScopeCacheRef.current.set(roleCode, options);
      setRoleScopeOptions(options);
    } catch (error) {
      if (requestId !== roleScopeRequestIdRef.current) {
        return;
      }

      setRoleScopeErrorMessage(
        getRolesErrorMessage(error, "Không thể tải phạm vi cho vai trò đã chọn.")
      );
    } finally {
      if (requestId === roleScopeRequestIdRef.current) {
        setIsRoleScopeLoading(false);
      }
    }
  }, []);

  const loadRoleCatalog = useCallback(async () => {
    const requestId = ++roleCatalogRequestIdRef.current;
    ++roleScopeRequestIdRef.current;
    setManagementRoles([]);
    setCreateRoleCode("");
    setRoleScopeOptions(null);
    setRoleCatalogErrorMessage(null);
    setRoleScopeErrorMessage(null);
    setIsRoleCatalogLoading(true);
    setIsRoleScopeLoading(false);

    try {
      const roles = await getManagementRoles();
      if (requestId !== roleCatalogRequestIdRef.current) {
        return;
      }

      const assignableRoles = roles.filter((role) => role.isAssignable);
      setManagementRoles(assignableRoles);

      const firstRole = assignableRoles[0];
      if (!firstRole) {
        setRoleCatalogErrorMessage("Backend không trả vai trò nào có thể gán.");
        return;
      }

      await loadRoleScopeOptions(firstRole.code);
    } catch (error) {
      if (requestId !== roleCatalogRequestIdRef.current) {
        return;
      }

      setRoleCatalogErrorMessage(
        getRolesErrorMessage(error, "Không thể tải danh sách vai trò.")
      );
    } finally {
      if (requestId === roleCatalogRequestIdRef.current) {
        setIsRoleCatalogLoading(false);
      }
    }
  }, [loadRoleScopeOptions]);

  const setCreateOpen = useCallback(
    (open: boolean) => {
      if (!open && isCreating) {
        return;
      }

      setIsCreateOpen(open);
      setCreateErrorMessage(null);

      if (open) {
        void loadRoleCatalog();
        return;
      }

      ++roleCatalogRequestIdRef.current;
      ++roleScopeRequestIdRef.current;
      setManagementRoles([]);
      setCreateRoleCode("");
      setRoleScopeOptions(null);
      setRoleCatalogErrorMessage(null);
      setRoleScopeErrorMessage(null);
      setIsRoleCatalogLoading(false);
      setIsRoleScopeLoading(false);
    },
    [isCreating, loadRoleCatalog]
  );

  const selectCreateRole = useCallback(
    (roleCode: string) => {
      if (!managementRoles.some((role) => role.code === roleCode)) {
        return;
      }

      void loadRoleScopeOptions(roleCode);
    },
    [loadRoleScopeOptions, managementRoles]
  );

  const submitCreateAccount = useCallback(
    async (request: CreateInternalAccountRequest): Promise<boolean> => {
      if (isCreating) {
        return false;
      }

      setIsCreating(true);
      setCreateErrorMessage(null);
      setSuccessMessage(null);

      try {
        const createdAccount = await createAccount(request);
        const createdInvitation = createdAccount.invitation
          ? {
              accountId: createdAccount.id,
              ...createdAccount.invitation,
            }
          : null;

        setAccounts((current) => [
          createdAccount,
          ...current.filter((account) => account.id !== createdAccount.id),
        ].slice(0, query.pageSize));
        setPagination((current) => ({
          ...current,
          totalCount: current.totalCount + 1,
          totalPages: Math.max(
            Math.ceil((current.totalCount + 1) / current.pageSize),
            1
          ),
        }));
        setIsCreateOpen(false);
        setInvitationAccount(createdAccount);
        setInvitationResult(createdInvitation);
        setInvitationResultMode("created");
        setIsInvitationResultOpen(Boolean(createdInvitation));
        setSuccessMessage(
          `Đã tạo tài khoản ${createdAccount.fullName?.trim() || createdAccount.userName}.`
        );
        return true;
      } catch (error) {
        setCreateErrorMessage(
          getAccountsErrorMessage(error, "Không thể tạo tài khoản.")
        );
        return false;
      } finally {
        setIsCreating(false);
      }
    },
    [isCreating, query.pageSize]
  );

  const requestRegenerateInvitation = useCallback((account: InternalAccountResult) => {
    setAccountPendingInvitation(account);
    setRegenerateSendEmail(true);
    setRegenerateErrorMessage(null);
    setIsRegenerateOpen(true);
  }, []);

  const setRegenerateOpen = useCallback(
    (open: boolean) => {
      if (!open && isRegenerating) {
        return;
      }

      setIsRegenerateOpen(open);
      if (!open) {
        setAccountPendingInvitation(null);
        setRegenerateErrorMessage(null);
      }
    },
    [isRegenerating]
  );

  const confirmRegenerateInvitation = useCallback(async () => {
    if (!accountPendingInvitation || isRegenerating) {
      return;
    }

    setIsRegenerating(true);
    setRegenerateErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await regenerateInvitation(
        accountPendingInvitation.id,
        regenerateSendEmail
      );
      setInvitationAccount(accountPendingInvitation);
      setInvitationResult(result);
      setInvitationResultMode("regenerated");
      setIsRegenerateOpen(false);
      setAccountPendingInvitation(null);
      setIsInvitationResultOpen(true);
      setSuccessMessage(
        `Đã tạo lại lời mời cho ${accountPendingInvitation.fullName?.trim() || accountPendingInvitation.userName}.`
      );
    } catch (error) {
      setRegenerateErrorMessage(
        getInvitationErrorMessage(error, "Không thể tạo lại lời mời.")
      );
    } finally {
      setIsRegenerating(false);
    }
  }, [accountPendingInvitation, isRegenerating, regenerateSendEmail]);

  const setInvitationResultOpen = useCallback((open: boolean) => {
    setIsInvitationResultOpen(open);
    if (!open) {
      setInvitationResult(null);
      setInvitationAccount(null);
      setInvitationResultMode(null);
    }
  }, []);

  return {
    accounts,
    query,
    pagination,
    isLoading,
    errorMessage,
    selectedAccount,
    accountPendingDisable,
    isDetailOpen,
    isDetailLoading,
    detailErrorMessage,
    isDisableOpen,
    isDisabling,
    disableErrorMessage,
    isCreateOpen,
    isCreating,
    createErrorMessage,
    managementRoles,
    createRoleCode,
    isRoleCatalogLoading,
    roleCatalogErrorMessage,
    roleScopeOptions,
    isRoleScopeLoading,
    roleScopeErrorMessage,
    accountPendingInvitation,
    isRegenerateOpen,
    isRegenerating,
    regenerateErrorMessage,
    regenerateSendEmail,
    invitationResult,
    invitationAccount,
    invitationResultMode,
    isInvitationResultOpen,
    successMessage,
    setSearchTerm,
    setStatus,
    clearFilters,
    previousPage,
    nextPage,
    refresh: () => fetchAccounts(),
    openAccountDetail,
    setDetailOpen,
    requestDisableAccount,
    setDisableOpen,
    confirmDisableAccount,
    setCreateOpen,
    selectCreateRole,
    submitCreateAccount,
    requestRegenerateInvitation,
    setRegenerateOpen,
    setRegenerateSendEmail,
    confirmRegenerateInvitation,
    setInvitationResultOpen,
    clearSuccessMessage: () => setSuccessMessage(null),
  };
}
