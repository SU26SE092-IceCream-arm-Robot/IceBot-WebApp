"use client";

import { FileArchive, LoaderCircle, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAXIMUM_BUNDLE_BYTES = 50 * 1024 * 1024;

interface RobotAuthoringBundleUploadProps {
  disabled: boolean;
  isUploading: boolean;
  canUpload: boolean;
  onUpload: (file: File) => Promise<boolean>;
}

function validateBundle(file: File) {
  if (!file.name.toLowerCase().endsWith(".zip"))
    return "Chỉ chấp nhận bundle định dạng .zip.";
  if (file.size > MAXIMUM_BUNDLE_BYTES)
    return "Bundle không được vượt quá 50 MB.";
  if (file.size === 0)
    return "Bundle đang trống. Hãy chọn lại file xuất từ Fairino.";
  return null;
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function findScrollContainer(element: HTMLElement | null) {
  let current = element?.parentElement ?? null;
  while (current) {
    const computedStyle = window.getComputedStyle(current);
    const overflowY =
      current.style.overflowY ||
      computedStyle.overflowY ||
      current.style.overflow ||
      computedStyle.overflow;
    if (overflowY === "auto" || overflowY === "scroll")
      return current;
    current = current.parentElement;
  }
  return null;
}

export function RobotAuthoringBundleUpload({
  disabled,
  isUploading,
  canUpload,
  onUpload,
}: RobotAuthoringBundleUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const chooseFileButtonRef = useRef<HTMLButtonElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const chooseFile = (file: File | null) => {
    if (!file) return;
    const error = validateBundle(file);
    setValidationError(error);
    setSelectedFile(error ? null : file);
  };

  const submit = async () => {
    if (!selectedFile || disabled || isUploading) return;
    const scrollContainer = findScrollContainer(inputRef.current);
    const scrollTop = scrollContainer?.scrollTop ?? window.scrollY;
    const succeeded = await onUpload(selectedFile);
    if (succeeded) {
      setSelectedFile(null);
      setValidationError(null);
      if (inputRef.current) inputRef.current.value = "";

      // Selecting the new import expands a large workspace while the focused
      // upload button is removed. Keep both focus and the dashboard viewport
      // anchored to the upload area after React commits the replacement UI.
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          chooseFileButtonRef.current?.focus({ preventScroll: true });
          if (scrollContainer) scrollContainer.scrollTop = scrollTop;
          else window.scrollTo({ top: scrollTop, behavior: "auto" });
        });
      });
    }
  };

  if (!canUpload) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
        Bạn có thể xem các gói đã nhập, nhưng không có quyền tải bundle mới
        trong tổ chức này.
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
      <div
        className={cn(
          "flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed p-5 text-center transition-colors",
          isDragging && !disabled && "border-primary bg-primary/5",
          disabled && "cursor-not-allowed opacity-60",
        )}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null))
            setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (!disabled) chooseFile(event.dataTransfer.files.item(0));
        }}
      >
        <input
          ref={inputRef}
          id="robot-authoring-bundle"
          className="sr-only"
          type="file"
          accept=".zip,application/zip"
          disabled={disabled}
          aria-label="Chọn bundle Fairino định dạng ZIP"
          onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
        />
        {selectedFile ? (
          <>
            <FileArchive className="size-8 text-primary" aria-hidden="true" />
            <p className="mt-3 max-w-full truncate text-sm font-semibold">
              {selectedFile.name}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatFileSize(selectedFile.size)}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button
                size="sm"
                disabled={disabled || isUploading}
                onClick={() => void submit()}
              >
                {isUploading ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <UploadCloud className="size-4" />
                )}
                {isUploading ? "Đang nhập chương trình" : "Nhập chương trình"}
              </Button>
              <Button
                size="icon-sm"
                variant="outline"
                disabled={isUploading}
                aria-label="Bỏ file đã chọn"
                title="Bỏ file đã chọn"
                onClick={() => setSelectedFile(null)}
              >
                <X className="size-4" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <UploadCloud
              className="size-8 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm font-semibold">Kéo bundle vào đây</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Một file .zip, tối đa 50 MB
            </p>
            <Button
              ref={chooseFileButtonRef}
              className="mt-4"
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              Chọn file .zip
            </Button>
          </>
        )}
        {validationError ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {validationError}
          </p>
        ) : null}
      </div>

      <div className="rounded-lg border bg-muted/20 p-4">
        <p className="text-sm font-semibold">Bundle Fairino cần có</p>
        <pre className="mt-3 overflow-x-auto rounded-md border bg-background p-2 text-xs text-foreground">{`export-manifest.json          # danh sách file và thứ tự chạy\nartifacts/*.lua               # Lua được xem là black box\ncontracts/*.icebot.json       # metadata khai báo; effects có thể rỗng`}</pre>
        <p className="mt-3 text-sm leading-5 text-muted-foreground">
          Thư mục <code>contracts</code> là envelope metadata của định dạng
          bundle hiện tại, không phải chứng nhận rằng Lua khớp Recipe, thiết bị
          hoặc model máy.
        </p>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          Chỉ cần chọn file và nhấn Nhập chương trình. Nếu cấu trúc ZIP không đọc
          được, hệ thống sẽ chỉ rõ lỗi cần sửa. Thao tác này chưa triển khai xuống robot.
        </p>
      </div>
    </div>
  );
}
