import Spinner from "./widgets/Spinner";

/**
 * loading screen spinner
 */
export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-99 flex items-center justify-center bg-gray-400/50 backdrop-blur-sm">
      <Spinner size={48} />
    </div>
  );
}
