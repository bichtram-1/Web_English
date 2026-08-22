export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] w-full p-8">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
      <span className="text-slate-500 font-medium text-sm tracking-wide">Đang tải dữ liệu...</span>
    </div>
  );
}
