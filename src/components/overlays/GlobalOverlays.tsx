import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InfiniteLoopWarning from "../misc/InfiniteLoopWarning";

interface GlobalOverlaysProps {
  infiniteLoopState: {
    isWarningOpen: boolean;
    reason: "iterations" | "timeout";
    iterationCount?: number;
  };
  onCloseInfiniteLoopWarning: () => void;
}

export default function GlobalOverlays({
  infiniteLoopState,
  onCloseInfiniteLoopWarning,
}: GlobalOverlaysProps) {
  return (
    <>
      <InfiniteLoopWarning
        isOpen={infiniteLoopState.isWarningOpen}
        reason={infiniteLoopState.reason}
        iterationCount={infiniteLoopState.iterationCount}
        onClose={onCloseInfiniteLoopWarning}
      />
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </>
  );
}

