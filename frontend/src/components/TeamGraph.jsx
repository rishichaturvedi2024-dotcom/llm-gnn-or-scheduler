import { useRef, useState, useEffect } from "react";
import ForceGraph2D from "react-force-graph-2d";

export default function TeamGraph({ data, onNodeClick }) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setDimensions({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-[600px] w-full overflow-hidden rounded-3xl bg-white shadow-card">
      {dimensions.width > 0 && dimensions.height > 0 && (
        <ForceGraph2D
          width={dimensions.width}
          height={dimensions.height}
          graphData={data}
          nodeLabel={(node) => node.id}
          nodeVal={(node) => node.num_cases / 10}
          nodeColor={(node) =>
            node.role === "surgeon" ? "#378ADD" : node.role === "anaesthetist" ? "#1D9E75" : "#D85A30"
          }
          linkColor={() => "#B4B2A9"}
          linkWidth={(link) => link.weight * 2}
          onNodeClick={onNodeClick}
        />
      )}
    </div>
  );
}
