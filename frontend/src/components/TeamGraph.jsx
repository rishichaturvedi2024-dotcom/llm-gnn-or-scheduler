import ForceGraph2D from "react-force-graph-2d";

export default function TeamGraph({ data, onNodeClick }) {
  return (
    <div className="h-[540px] rounded-3xl bg-white p-4 shadow-card">
      <ForceGraph2D
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
    </div>
  );
}
