interface AreaDisplayProps {
  area: number; // in hectares
}

const AreaDisplay: React.FC<AreaDisplayProps> = ({ area }) => {
  const areaAcres = area * 2.47105;

  return (
    <div className="absolute bottom-6 left-4 z-[1000] bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200">
      <p className="text-xs text-gray-500 uppercase font-medium mb-1">
        Field Area
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold text-green-700">
          {area.toFixed(2)}
        </span>
        <span className="text-sm text-gray-600">hectares</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-medium text-gray-700">
          {areaAcres.toFixed(2)}
        </span>
        <span className="text-xs text-gray-500">acres</span>
      </div>
    </div>
  );
};

export default AreaDisplay;