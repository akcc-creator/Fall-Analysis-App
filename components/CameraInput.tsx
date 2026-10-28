import React, { useRef, useState, useEffect } from "react";
import Icon from "./Icon";
export default function CameraInput({
  onAnalyze,
  disabled,
}: {
  onAnalyze: (images: string[]) => void;
  disabled: boolean;
}) {
  const input = useRef<HTMLInputElement>(null),
    video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null);
  const [images, setImages] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [camera, setCamera] = useState(false),
    [error, setError] = useState(""),
    [drag, setDrag] = useState(false);
  const MAX = 8;
  function stop() {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setCamera(false);
  }
  useEffect(
    () => () => {
      stream.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );
  useEffect(() => {
    if (camera && video.current) video.current.srcObject = stream.current;
  }, [camera]);
  async function open() {
    if (images.length >= MAX) return;
    try {
      setError("");
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      setCamera(true);
    } catch {
      setError("未能開啟相機，請檢查權限，或改用上傳相片。");
    }
  }
  function compress(source: HTMLVideoElement | HTMLImageElement) {
    const c = document.createElement("canvas");
    let w =
        source instanceof HTMLVideoElement
          ? source.videoWidth
          : source.naturalWidth,
      h =
        source instanceof HTMLVideoElement
          ? source.videoHeight
          : source.naturalHeight;
    if (!w || !h) throw Error("相片未準備好，請再試一次。");
    const scale = Math.min(1, 1280 / Math.max(w, h));
    c.width = Math.round(w * scale);
    c.height = Math.round(h * scale);
    c.getContext("2d")!.drawImage(source, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.75).split(",")[1];
  }
  async function files(list: File[]) {
    if (busy) return;
    const valid = list.filter((f) => f.type.startsWith("image/"));
    if (!valid.length) {
      setError("請選擇 JPG、PNG 或其他可讀取的圖片。");
      return;
    }
    const chosen = valid.slice(0, MAX - images.length);
    setBusy(true);
    setError(
      valid.length > chosen.length
        ? `每次最多 ${MAX} 張，已加入可容納的相片。`
        : "",
    );
    try {
      const processed = await Promise.all(
        chosen.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const img = new Image(),
                url = URL.createObjectURL(file);
              img.onload = () => {
                try {
                  resolve(compress(img));
                } catch (e) {
                  reject(e);
                } finally {
                  URL.revokeObjectURL(url);
                }
              };
              img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(Error("部分相片無法讀取，請轉成 JPG 或 PNG 後重試。"));
              };
              img.src = url;
            }),
        ),
      );
      setImages((prev) => [...prev, ...processed]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "相片讀取失敗。");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  function submit() {
    if (JSON.stringify({ images }).length > 4200000) {
      setError("相片總容量過大，請減少相片數量後再試。");
      return;
    }
    onAnalyze(images);
  }
  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => files(Array.from(e.target.files || []))}
        hidden
        aria-label="上傳報告或環境相片"
      />
      <div
        className={`dropzone ${drag ? "dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          files(Array.from(e.dataTransfer.files));
        }}
      >
        <div className="document-art">
          <Icon name="file" size={42} />
          <span>
            <Icon name="check" size={16} />
          </span>
        </div>
        <h3>{images.length ? "繼續加入相片" : "將報告或環境相片放到這裏"}</h3>
        <p>拖放圖片，或選擇以下方式加入</p>
        <div className="upload-actions">
          <button
            className="primary"
            disabled={busy || disabled || images.length >= MAX}
            onClick={() => input.current?.click()}
          >
            <Icon name="upload" /> 選擇相片
          </button>
          <button
            className="secondary"
            disabled={busy || disabled || images.length >= MAX}
            onClick={open}
          >
            <Icon name="camera" /> 開啟相機
          </button>
        </div>
        <small>支援多張圖片 · 每次最多 {MAX} 張</small>
      </div>
      {busy && <p role="status">正在處理相片…</p>}
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      {images.length > 0 && (
        <div className="selected">
          <div className="selected-heading">
            <strong>已加入 {images.length} 張相片</strong>
            <span>請核對內容及次序</span>
          </div>
          <div className="thumbnails">
            {images.map((img, i) => (
              <div className="thumbnail" key={i}>
                <img
                  src={`data:image/jpeg;base64,${img}`}
                  alt={`待分析相片 ${i + 1}`}
                />
                <span>{String(i + 1).padStart(2, "0")}</span>
                <button
                  aria-label={`移除第 ${i + 1} 張相片`}
                  onClick={() =>
                    setImages((prev) => prev.filter((_, idx) => i !== idx))
                  }
                >
                  <Icon name="close" size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="analyze-bar">
        <span>
          <Icon name="spark" size={18} />{" "}
          {images.length ? "準備好即可開始分析" : "加入相片後，即可開始分析"}
        </span>
        <button
          className="primary"
          disabled={!images.length || busy || disabled}
          onClick={submit}
        >
          開始分析 <Icon name="arrow" size={19} />
        </button>
      </div>
      {camera && (
        <div
          className="camera-modal"
          role="dialog"
          aria-modal="true"
          aria-label="拍攝相片"
        >
          <video ref={video} autoPlay playsInline muted />
          <div className="camera-controls">
            <button className="secondary" onClick={stop}>
              取消
            </button>
            <button
              className="shutter"
              aria-label="拍攝"
              onClick={() => {
                try {
                  if (video.current)
                    setImages((prev) => [...prev, compress(video.current!)]);
                  stop();
                } catch (e) {
                  setError("相機未準備好，請稍後再拍攝。");
                }
              }}
            />
            <span>對準整頁或環境</span>
          </div>
        </div>
      )}
    </>
  );
}
