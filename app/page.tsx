"use client";
import { useState, DragEvent } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, X, Loader2 } from "lucide-react";
import Image from "next/image";

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const [status, setStatus] = useState("");

  // 处理文件添加
  const handleFilesAdded = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const incoming = Array.from(newFiles).filter((f) =>
      f.type.startsWith("image/"),
    );
    setFiles((prev) => [...prev, ...incoming]);
    setStatus("");
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 并发上传逻辑
  const handleUpload = async () => {
    if (files.length === 0) return;

    try {
      setUploading(true);
      setProgress(0);
      let completedCount = 0;

      const uploadTasks = files.map(async (file) => {
        // 1. 获取预签名 URL
        const {
          data: { url, fileKey },
        } = await axios.post("/api/upload", {
          fileName: file.name,
          contentType: file.type,
        });

        // 2. 直传 R2 并更新进度
        await axios.put(url, file, {
          headers: { "Content-Type": file.type },
          onUploadProgress: (p) => {
            const individualContribution =
              p.loaded / (p.total || 100) / files.length;
            const totalPercent = Math.round(
              (completedCount / files.length + individualContribution) * 100,
            );
            setProgress(Math.min(totalPercent, 99)); // 留 1% 给数据库写入
          },
        });

        // 3. 写入数据库
        await axios.post("/api/assets", {
          title: file.name.split(".")[0],
          fileKey,
          contentType: file.type,
        });

        completedCount++;
        setProgress(Math.round((completedCount / files.length) * 100));
      });

      setStatus(`正在同步 ${files.length} 个资源...`);
      await Promise.all(uploadTasks);

      setStatus("全部资源已入库！");
      setTimeout(() => {
        setUploading(false);
        setFiles([]);
        setProgress(0);
      }, 2000);
    } catch (err) {
      console.error(err);
      setStatus("部分上传失败");
      setUploading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-zinc-200">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
            资源上传中心
          </h2>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
            {files.length} Files Selected
          </span>
        </div>

        {/* 拖拽交互区 */}
        <div
          onDragOver={(e: DragEvent) => {
            e.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={(e: DragEvent) => {
            e.preventDefault();
            setIsDragActive(false);
            handleFilesAdded(e.dataTransfer.files);
          }}
          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-all 
            ${isDragActive ? "border-blue-500 bg-blue-50/50 scale-[1.01]" : "border-zinc-200 bg-zinc-50"}`}
        >
          <UploadCloud
            size={40}
            className={isDragActive ? "text-blue-500" : "text-zinc-300"}
          />
          <p className="mt-4 text-sm text-zinc-500 text-center">
            拖拽多张图片到这里，或者{" "}
            <span className="text-blue-600 font-bold cursor-pointer">
              点击浏览
            </span>
          </p>
          <input
            type="file"
            multiple
            onChange={(e) => handleFilesAdded(e.target.files)}
            className="absolute inset-0 cursor-pointer opacity-0"
            disabled={uploading}
          />
        </div>

        {/* 预览列表 - 改为 Image 组件 */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-6 grid grid-cols-4 gap-3"
            >
              {files.map((f, i) => (
                <div
                  key={i}
                  className="group relative aspect-square rounded-xl bg-zinc-100 overflow-hidden border border-zinc-200"
                >
                  <Image
                    src={URL.createObjectURL(f)}
                    alt="preview"
                    fill
                    unoptimized // 本地预览图不需要优化
                    className="object-cover"
                  />
                  {!uploading && (
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute right-1 top-1 z-10 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 进度条逻辑 */}
        {uploading && (
          <div className="mt-8">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
              <span className="text-zinc-400 flex items-center gap-2">
                <Loader2 size={12} className="animate-spin" /> {status}
              </span>
              <span className="text-blue-600">{progress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
              <motion.div
                className="h-full bg-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          className="mt-8 w-full rounded-2xl bg-zinc-900 py-4 text-sm font-bold text-white transition-all hover:bg-black active:scale-[0.98] disabled:bg-zinc-200"
        >
          {uploading ? "上传同步中..." : "确认同步到画廊"}
        </button>
      </div>
    </main>
  );
}
