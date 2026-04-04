"use client";
import { useState, DragEvent, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "motion/react";
import { UploadCloud, X, Loader2, Citrus } from "lucide-react"; // 引入 Citrus 增加品牌感
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const [status, setStatus] = useState("");

  // 极客提醒：处理内存泄漏。URL.createObjectURL 需要在组件卸载时销毁
  useEffect(() => {
    return () => {
      // 这里的逻辑可以根据需要清理预览图缓存
    };
  }, []);

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

  const handleUpload = async () => {
    if (files.length === 0) return;

    try {
      setUploading(true);
      setProgress(0);
      let completedCount = 0;

      const uploadTasks = files.map(async (file) => {
        const {
          data: { url, fileKey },
        } = await axios.post("/api/upload", {
          fileName: file.name,
          contentType: file.type,
        });

        await axios.put(url, file, {
          headers: { "Content-Type": file.type },
          onUploadProgress: (p) => {
            const individualContribution =
              p.loaded / (p.total || 100) / files.length;
            const totalPercent = Math.round(
              (completedCount / files.length + individualContribution) * 100,
            );
            setProgress(Math.min(totalPercent, 99));
          },
        });

        await axios.post("/api/assets", {
          title: file.name.split(".")[0],
          fileKey,
          contentType: file.type,
        });

        completedCount++;
        setProgress(Math.round((completedCount / files.length) * 100));
      });

      setStatus(`同步中 (${completedCount}/${files.length})`);
      await Promise.all(uploadTasks);

      setStatus("入库成功！正在重定向...");
      setTimeout(() => {
        setUploading(false);
        setFiles([]);
        setProgress(0);
      }, 2000);
    } catch (err) {
      console.error(err);
      setStatus("上传过程中出现异常");
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="w-full max-w-2xl rounded-[2.5rem] bg-white p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] ring-1 ring-zinc-200 mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-lime-400 p-2 rounded-xl">
              <Citrus size={20} className="text-lime-950" />
            </div>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
              资源上传
            </h2>
          </div>
          <span className="rounded-full bg-lime-100 px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-lime-700">
            {files.length} 件作品待上传
          </span>
        </div>

        {/* 拖拽区 */}
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
          className={`relative flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed p-12 transition-all duration-300
            ${isDragActive ? "border-lime-500 bg-lime-50/50 scale-[1.02] shadow-inner" : "border-zinc-200 bg-zinc-50"}`}
        >
          <UploadCloud
            size={48}
            strokeWidth={1.5}
            className={
              isDragActive ? "text-lime-600 animate-bounce" : "text-zinc-400"
            }
          />
          <p className="mt-6 text-sm text-zinc-500 text-center font-medium">
            将图片拖入此区域，或{" "}
            <span className="text-zinc-900 font-bold underline underline-offset-4 decoration-lime-400 decoration-2 cursor-pointer hover:text-lime-600 transition-colors">
              点击浏览本地文件
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

        {/* 预览列表 */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 grid grid-cols-4 gap-0.5 sm:gap-1 md:gap-2 lg:gap-3 xl:gap-4"
            >
              {files.map((f, i) => (
                <div
                  key={i}
                  className="group relative aspect-square rounded-2xl bg-zinc-100 overflow-hidden border border-zinc-100 shadow-sm"
                >
                  <Image
                    src={URL.createObjectURL(f)}
                    alt="preview"
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {!uploading && (
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute right-2 top-2 z-10 rounded-full bg-zinc-900/80 p-1.5 text-white opacity-0 transition-all hover:bg-red-500 group-hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 进度条 */}
        {uploading && (
          <div className="mt-10">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] mb-3">
              <span className="text-zinc-400 flex items-center gap-2">
                <Loader2 size={12} className="animate-spin text-lime-500" />{" "}
                {status}
              </span>
              <span className="text-lime-600">{progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
              <motion.div
                className="h-full bg-lime-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          className="mt-6 w-full"
        >
          {uploading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>正在建立数据索引...</span>
            </div>
          ) : (
            "确认同步到画廊"
          )}
        </Button>
      </div>
    </div>
  );
}
