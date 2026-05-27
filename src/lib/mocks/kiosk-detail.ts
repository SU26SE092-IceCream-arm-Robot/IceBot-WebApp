import { MOCK_KIOSKS } from "@/lib/mocks/kiosks";
import type { Kiosk, KioskStatus } from "@/types";
import type {
  KioskDetail,
  KioskEvent,
  KioskOperationMode,
  KioskTemperaturePoint,
} from "@/types/kiosk-detail";

const TEMPERATURE_OFFSETS = [-0.6, -0.3, 0.2, -0.2, 0.1, 0] as const;

function shiftTimestamp(timestamp: string, minutes: number): string {
  const date = new Date(timestamp);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

function buildTemperatureHistory(kiosk: Kiosk): KioskTemperaturePoint[] {
  return TEMPERATURE_OFFSETS.map((offset, index) => ({
    timestamp: shiftTimestamp(kiosk.hardwareState.lastHeartbeat, (index - TEMPERATURE_OFFSETS.length + 1) * 10),
    temperature: Number((kiosk.hardwareState.freezerTemperature + offset).toFixed(1)),
  }));
}

function getOperationMode(status: KioskStatus): KioskOperationMode {
  if (status === "MAINTENANCE") {
    return "MAINTENANCE";
  }

  if (status === "OFFLINE" || status === "ERROR") {
    return "LOCKED";
  }

  return "READY";
}

function buildEvents(kiosk: Kiosk): KioskEvent[] {
  const events: KioskEvent[] = [];

  if (kiosk.hardwareState.errorCode) {
    events.push({
      id: `${kiosk.kioskId}-error`,
      timestamp: kiosk.hardwareState.lastHeartbeat,
      severity: "ERROR",
      title: "Cảnh báo phần cứng",
      description: "Robot arm phát hiện lỗi cần kỹ thuật viên kiểm tra.",
      code: kiosk.hardwareState.errorCode,
    });
  }

  if (kiosk.status === "OFFLINE") {
    events.push({
      id: `${kiosk.kioskId}-offline`,
      timestamp: kiosk.hardwareState.lastHeartbeat,
      severity: "ERROR",
      title: "Mất kết nối",
      description: "Không nhận được heartbeat mới từ kiosk.",
      code: "HEARTBEAT_TIMEOUT",
    });
  }

  if (
    kiosk.hardwareState.cupsRemaining < 15 ||
    kiosk.hardwareState.vanillaSyrupLevel < 15 ||
    kiosk.hardwareState.chocolateSyrupLevel < 15 ||
    kiosk.hardwareState.toppingLevel < 15
  ) {
    events.push({
      id: `${kiosk.kioskId}-inventory`,
      timestamp: shiftTimestamp(kiosk.hardwareState.lastHeartbeat, -4),
      severity: "WARNING",
      title: "Nguyên liệu mức thấp",
      description: "Một hoặc nhiều thành phần đã xuống dưới ngưỡng vận hành.",
      code: "LOW_SUPPLY",
    });
  }

  if (kiosk.currentOrderId) {
    events.push({
      id: `${kiosk.kioskId}-order`,
      timestamp: shiftTimestamp(kiosk.hardwareState.lastHeartbeat, -1),
      severity: "INFO",
      title: "Đang xử lý đơn hàng",
      description: `Robot đang thực hiện đơn ${kiosk.currentOrderId}.`,
    });
  }

  events.push({
    id: `${kiosk.kioskId}-heartbeat`,
    timestamp: kiosk.hardwareState.lastHeartbeat,
    severity: "INFO",
    title: "Telemetry đồng bộ",
    description: "Kiosk đã gửi trạng thái phần cứng mới nhất.",
  });

  return events.slice(0, 4);
}

export const MOCK_KIOSK_DETAILS: KioskDetail[] = MOCK_KIOSKS.map((kiosk, index) => ({
  ...kiosk,
  deviceSerial: `ICB-${String(index + 1).padStart(4, "0")}-VN`,
  firmwareVersion: index % 2 === 0 ? "2.4.1" : "2.4.0",
  operationMode: getOperationMode(kiosk.status),
  temperatureHistory: buildTemperatureHistory(kiosk),
  recentEvents: buildEvents(kiosk),
}));
