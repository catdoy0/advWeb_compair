import Spinner from "./widgets/Spinner";

interface LoadingScreenProps {
  /** When true, only covers the nearest positioned parent. Default: full screen. */
  scoped?: boolean;
}

export default function LoadingScreen({ scoped = false }: LoadingScreenProps) {
  return (
    <div
      className={`
        ${scoped ? "absolute" : "fixed"} inset-0 z-50
        flex items-center justify-center
        bg-gray-400/50 backdrop-blur-sm
      `}
    >
      <Spinner size={48} />
    </div>
  );
}
