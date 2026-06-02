interface DrawButtonProps {
  isDrawing: boolean;
  hasPolygon: boolean;
  onStartDraw: () => void;
  onCancelDraw: () => void;
  onClearPolygon: () => void;
}

const DrawButton: React.FC<DrawButtonProps> = ({
  isDrawing,
  hasPolygon,
  onStartDraw,
  onCancelDraw,
  onClearPolygon,
}) => {
  return (
    <div className="absolute top-4 left-14 z-[1000] flex gap-2">
      {/* Draw Button */}
      {!isDrawing && (
        <button
          onClick={onStartDraw}
          className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" />
            <path d="M12 12l9-4.5" />
            <path d="M12 12v9" />
            <path d="M12 12L3 7.5" />
          </svg>
          Draw Farm Boundary
        </button>
      )}

      {/* Cancel Button (during drawing) */}
      {isDrawing && (
        <button
          onClick={onCancelDraw}
          className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-red-600 transition-colors flex items-center gap-2 font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          Cancel Drawing
        </button>
      )}

      {/* Clear Button (when polygon exists) */}
      {hasPolygon && !isDrawing && (
        <button
          onClick={onClearPolygon}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors flex items-center gap-2 font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-2 14H7L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
          Clear
        </button>
      )}

      {/* Drawing Instructions */}
      {isDrawing && (
        <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-green-200">
          <p className="text-sm text-gray-700">
            <span className="font-medium text-green-600">Click</span> on map to
            add points.{" "}
            <span className="font-medium text-green-600">Double-click</span> to
            finish.
          </p>
        </div>
      )}
    </div>
  );
};

export default DrawButton;