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

export function RobotAuthoringBundleUpload({
  disabled,
  isUploading,
  canUpload,
  onUpload,
}: RobotAuthoringBundleUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
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
    const succeeded = await onUpload(selectedFile);
    if (succeeded) {
      setSelectedFile(null);
      setValidationError(null);
      if (inputRef.current) inputRef.current.value = "";
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
                {isUploading ? "Đang tải lên" : "Nhập bundle"}
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
        <p className="text-sm font-semibold">Bundle cần có</p>
        <pre className="mt-3 overflow-x-auto rounded-md border bg-background p-2 text-xs text-foreground">{`export-manifest.json\nartifacts/*.lua\ncontracts/*.icebot.json`}</pre>
        <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">
              ZIP không hợp lệ:
            </span>{" "}
            file không đọc được, bị mã hóa hoặc vượt giới hạn.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Manifest/sidecar không hợp lệ:
            </span>{" "}
            schema, target hoặc trường bắt buộc sai.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Tham chiếu file sai:
            </span>{" "}
            manifest không tìm thấy Lua hoặc sidecar tương ứng trong ZIP.
          </li>
        </ol>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          Nhập bundle chỉ đăng ký dữ liệu trên hệ thống. Thao tác này chưa triển
          khai chương trình xuống robot.
        </p>
      </div>
    </div>
  );
}
