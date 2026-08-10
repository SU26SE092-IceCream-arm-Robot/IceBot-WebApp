"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { updateSessionAccount, writeAuthSession } from "@/lib/auth-session";
import {
  changeCurrentAccountPassword,
  getCurrentAccountProfile,
  getProfileErrorMessage,
  listCurrentAccountSessions,
  listCurrentAccountNotificationDevices,
  revokeAllCurrentAccountSessions,
  revokeCurrentAccountSession,
  unregisterCurrentAccountNotificationDevice,
  updateCurrentAccountProfile,
} from "@/lib/services/profile";
import type {
  ChangeCurrentAccountPasswordRequest,
  CurrentAccountNotificationDevice,
  CurrentAccountProfile,
  CurrentAccountSession,
  UpdateCurrentAccountProfileRequest,
} from "@/types/profile";

export function useProfile() {
  const { session, logout } = useAuth();
  const [profile, setProfile] = useState<CurrentAccountProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notificationDevices, setNotificationDevices] = useState<
    CurrentAccountNotificationDevice[]
  >([]);
  const [isNotificationDevicesLoading, setIsNotificationDevicesLoading] = useState(true);
  const [notificationDevicesErrorMessage, setNotificationDevicesErrorMessage] = useState<string | null>(null);
  const [unregisteringInstallationId, setUnregisteringInstallationId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<CurrentAccountSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);
  const [sessionsErrorMessage, setSessionsErrorMessage] = useState<string | null>(null);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [isRevokingAllSessions, setIsRevokingAllSessions] = useState(false);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      setProfile(await getCurrentAccountProfile());
    } catch (error) {
      setErrorMessage(getProfileErrorMessage(error, "Không thể tải thông tin cá nhân."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadNotificationDevices = useCallback(async () => {
    setIsNotificationDevicesLoading(true);
    setNotificationDevicesErrorMessage(null);
    try {
      setNotificationDevices(await listCurrentAccountNotificationDevices());
    } catch (error) {
      setNotificationDevicesErrorMessage(
        getProfileErrorMessage(error, "Không thể tải thiết bị nhận thông báo."),
      );
    } finally {
      setIsNotificationDevicesLoading(false);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    setIsSessionsLoading(true);
    setSessionsErrorMessage(null);
    try {
      const result = await listCurrentAccountSessions();
      setCurrentSessionId(result.currentSessionId ?? null);
      setSessions(result.sessions);
    } catch (error) {
      setSessionsErrorMessage(getProfileErrorMessage(error, "Không thể tải các phiên đăng nhập."));
    } finally {
      setIsSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadProfile();
      void loadNotificationDevices();
      void loadSessions();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadNotificationDevices, loadProfile, loadSessions]);

  const saveProfile = useCallback(
    async (request: UpdateCurrentAccountProfileRequest) => {
      setIsSaving(true);
      setErrorMessage(null);
      try {
        const updatedProfile = await updateCurrentAccountProfile(request);
        setProfile(updatedProfile);
        if (session) {
          writeAuthSession(updateSessionAccount(session, updatedProfile));
        }
        return updatedProfile;
      } catch (error) {
        const message = getProfileErrorMessage(
          error,
          "Không thể cập nhật thông tin cá nhân.",
        );
        setErrorMessage(message);
        throw new Error(message);
      } finally {
        setIsSaving(false);
      }
    },
    [session],
  );

  const changePassword = useCallback(
    async (request: ChangeCurrentAccountPasswordRequest) => {
      setIsChangingPassword(true);
      setErrorMessage(null);
      try {
        await changeCurrentAccountPassword(request);
        await logout();
      } catch (error) {
        const message = getProfileErrorMessage(error, "Không thể đổi mật khẩu.");
        setErrorMessage(message);
        throw new Error(message);
      } finally {
        setIsChangingPassword(false);
      }
    },
    [logout],
  );

  const unregisterNotificationDevice = useCallback(async (installationId: string) => {
    setUnregisteringInstallationId(installationId);
    setNotificationDevicesErrorMessage(null);
    try {
      await unregisterCurrentAccountNotificationDevice(installationId);
      setNotificationDevices((current) =>
        current.map((device) =>
          device.installationId === installationId
            ? { ...device, isActive: false }
            : device,
        ),
      );
    } catch (error) {
      const message = getProfileErrorMessage(
        error,
        "Không thể ngừng nhận thông báo trên thiết bị này.",
      );
      setNotificationDevicesErrorMessage(message);
      throw new Error(message);
    } finally {
      setUnregisteringInstallationId(null);
    }
  }, []);

  const revokeAllSessions = useCallback(async () => {
    setIsRevokingAllSessions(true);
    setSessionsErrorMessage(null);
    try {
      const revokedCount = await revokeAllCurrentAccountSessions();
      setSessions([]);
      setCurrentSessionId(null);
      await logout();
      return revokedCount;
    } catch (error) {
      const message = getProfileErrorMessage(error, "Không thể đăng xuất khỏi các phiên.");
      setSessionsErrorMessage(message);
      throw new Error(message);
    } finally {
      setIsRevokingAllSessions(false);
    }
  }, [logout]);

  const revokeSession = useCallback(
    async (sessionToRevoke: CurrentAccountSession) => {
      setRevokingSessionId(sessionToRevoke.sessionId);
      setSessionsErrorMessage(null);
      const isCurrentSession =
        sessionToRevoke.isCurrentSession ||
        sessionToRevoke.sessionId === currentSessionId;

      try {
        await revokeCurrentAccountSession(sessionToRevoke.sessionId);
        setSessions((current) =>
          current.filter(
            (item) => item.sessionId !== sessionToRevoke.sessionId,
          ),
        );
        if (isCurrentSession) {
          setCurrentSessionId(null);
          await logout();
        }
        return isCurrentSession;
      } catch (error) {
        const message = getProfileErrorMessage(
          error,
          "Không thể đăng xuất khỏi thiết bị này.",
        );
        setSessionsErrorMessage(message);
        throw new Error(message);
      } finally {
        setRevokingSessionId(null);
      }
    },
    [currentSessionId, logout],
  );

  return {
    profile,
    isLoading,
    isSaving,
    isChangingPassword,
    errorMessage,
    notificationDevices,
    isNotificationDevicesLoading,
    notificationDevicesErrorMessage,
    unregisteringInstallationId,
    sessions,
    currentSessionId,
    isSessionsLoading,
    sessionsErrorMessage,
    revokingSessionId,
    isRevokingAllSessions,
    loadProfile,
    loadNotificationDevices,
    saveProfile,
    changePassword,
    unregisterNotificationDevice,
    loadSessions,
    revokeSession,
    revokeAllSessions,
  };
}
