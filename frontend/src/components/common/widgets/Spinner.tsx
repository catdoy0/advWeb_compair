interface SpinnerProps {
  size?: number;
  className?: string;
}

export default function Spinner({ size = 40, className = "" }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-4 border-gray-200 border-t-[#17499d] ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
