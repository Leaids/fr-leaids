// src/components/agents/FlowEditor.tsx

import React, { useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background
} from 'reactflow';
import 'reactflow/dist/style.css';

interface FlowEditorProps {
  value: any;
  onChange: (value: any) => void;
}

export const FlowEditor: React.FC<FlowEditorProps> = ({ value, onChange }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Conversion du script en nodes et edges
  const initializeFlow = (script: any) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Node initial
    newNodes.push({
      id: 'start',
      type: 'input',
      data: { label: 'Début' },
      position: { x: 250, y: 0 }
    });

    // Conversion des nodes du script
    script.nodes.forEach((node: any, index: number) => {
      newNodes.push({
        id: node.id,
        type: 'custom',
        data: { 
          label: node.message,
          responses: node.responses 
        },
        position: { x: 250, y: (index + 1) * 100 }
      });

      // Création des connexions
      if (index === 0) {
        newEdges.push({
          id: `e-start-${node.id}`,
          source: 'start',
          target: node.id
        });
      }

      node.responses.forEach((response: any) => {
        if (response.nextNode !== 'END') {
          newEdges.push({
            id: `e-${node.id}-${response.nextNode}`,
            source: node.id,
            target: response.nextNode,
            label: response.pattern
          });
        }
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  // Mise à jour du script quand le flow change
  const updateScript = () => {
    const script = {
      initialGreeting: value.initialGreeting,
      nodes: nodes
        .filter(node => node.type !== 'input')
        .map(node => ({
          id: node.id,
          message: node.data.label,
          responses: node.data.responses
        }))
    };
    onChange(script);
  };

  return (
    <div className="h-[600px] bg-white rounded-lg shadow">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => {
          setNodes((nds) => {
            const newNodes = applyNodeChanges(changes, nds);
            updateScript();
            return newNodes;
          });
        }}
        onEdgesChange={(changes) => {
          setEdges((eds) => {
            const newEdges = applyEdgeChanges(changes, eds);
            updateScript();
            return newEdges;
          });
        }}
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};
