// ============================================================================
// CryptoWalletGraph.tsx
// INTERACTIVE CRYPTOCURRENCY WALLET CONNECTION GRAPH
// ============================================================================
// Features:
// - Interactive force-directed graph visualization
// - Node clustering by entity type
// - Edge thickness based on transaction volume
// - Click to explore connected wallets
// - Zoom and pan controls
// - Risk-based color coding
// ============================================================================

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Download,
  RefreshCw,
  Info,
  Network,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WalletGraph, GraphNode, GraphEdge } from '@/services/cryptoWalletInvestigationService';

interface CryptoWalletGraphProps {
  graph: WalletGraph;
  onNodeClick?: (address: string) => void;
  className?: string;
}

interface Position {
  x: number;
  y: number;
}

interface NodeWithPosition extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function CryptoWalletGraph({ graph, onNodeClick, className }: CryptoWalletGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<NodeWithPosition[]>([]);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<NodeWithPosition | null>(null);
  const animationRef = useRef<number>();

  // Initialize node positions
  useEffect(() => {
    if (!graph.nodes.length) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 200;

    // Initialize nodes with circular layout
    const initialNodes: NodeWithPosition[] = graph.nodes.map((node, index) => {
      const angle = (index / graph.nodes.length) * Math.PI * 2;
      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        vx: 0,
        vy: 0,
      };
    });

    setNodes(initialNodes);
  }, [graph.nodes]);

  // Force-directed layout simulation
  const simulateForces = useCallback(() => {
    if (!nodes.length) return;

    setNodes(prevNodes => {
      const newNodes = [...prevNodes];
      const alpha = 0.3;
      const repulsion = 5000;
      const attraction = 0.01;
      const centerForce = 0.01;

      // Apply forces
      for (let i = 0; i < newNodes.length; i++) {
        const nodeA = newNodes[i];
        let fx = 0, fy = 0;

        // Repulsion between all nodes
        for (let j = 0; j < newNodes.length; j++) {
          if (i === j) continue;
          const nodeB = newNodes[j];
          const dx = nodeA.x - nodeB.x;
          const dy = nodeA.y - nodeB.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = repulsion / (distance * distance);
          fx += (dx / distance) * force;
          fy += (dy / distance) * force;
        }

        // Attraction along edges
        graph.edges.forEach(edge => {
          if (edge.source === nodeA.id) {
            const target = newNodes.find(n => n.id === edge.target);
            if (target) {
              const dx = target.x - nodeA.x;
              const dy = target.y - nodeA.y;
              const distance = Math.sqrt(dx * dx + dy * dy) || 1;
              fx += dx * attraction;
              fy += dy * attraction;
            }
          }
          if (edge.target === nodeA.id) {
            const source = newNodes.find(n => n.id === edge.source);
            if (source) {
              const dx = source.x - nodeA.x;
              const dy = source.y - nodeA.y;
              const distance = Math.sqrt(dx * dx + dy * dy) || 1;
              fx += dx * attraction;
              fy += dy * attraction;
            }
          }
        });

        // Center gravity
        const canvas = canvasRef.current;
        if (canvas) {
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          fx += (centerX - nodeA.x) * centerForce;
          fy += (centerY - nodeA.y) * centerForce;
        }

        // Update velocity and position
        nodeA.vx = (nodeA.vx + fx) * alpha;
        nodeA.vy = (nodeA.vy + fy) * alpha;
        nodeA.x += nodeA.vx;
        nodeA.y += nodeA.vy;
      }

      return newNodes;
    });
  }, [nodes, graph.edges]);

  // Animation loop
  useEffect(() => {
    let frameCount = 0;
    const maxFrames = 300; // Run simulation for 300 frames

    const animate = () => {
      if (frameCount < maxFrames) {
        simulateForces();
        drawGraph();
        frameCount++;
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [simulateForces]);

  // Draw graph on canvas
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Apply transformations
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // Draw edges
    graph.edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      if (!source || !target) return;

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      
      // Edge width based on transaction count
      const width = Math.min(1 + edge.transactions / 10, 5);
      ctx.lineWidth = width;
      ctx.strokeStyle = '#666';
      ctx.globalAlpha = 0.4;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Draw nodes
    nodes.forEach(node => {
      const radius = 8 + Math.min(node.transactionCount / 100, 10);

      // Node color based on risk level
      const colorMap = {
        critical: '#ef4444',
        high: '#f97316',
        medium: '#eab308',
        low: '#3b82f6',
        safe: '#10b981',
      };
      const color = colorMap[node.riskLevel];

      // Draw node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = selectedNode?.id === node.id ? '#fff' : '#333';
      ctx.lineWidth = selectedNode?.id === node.id ? 3 : 1;
      ctx.stroke();

      // Draw node type indicator
      if (node.type === 'exchange') {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (node.type === 'mixer') {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    ctx.restore();
  }, [nodes, graph.edges, scale, offset, selectedNode]);

  // Redraw on changes
  useEffect(() => {
    drawGraph();
  }, [drawGraph]);

  // Handle canvas interactions
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / scale;
    const y = (e.clientY - rect.top - offset.y) / scale;

    // Check if clicked on a node
    const clickedNode = nodes.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      const radius = 8 + Math.min(node.transactionCount / 100, 10);
      return Math.sqrt(dx * dx + dy * dy) <= radius;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
      if (onNodeClick) {
        onNodeClick(clickedNode.address);
      }
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.2));
  };

  const handleReset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'crypto-wallet-graph.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Wallet Connection Graph
            </CardTitle>
            <CardDescription>
              Interactive visualization of wallet connections and transactions
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleReset}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="border rounded-lg bg-slate-950 cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />

          {/* Legend */}
          <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-sm p-4 rounded-lg border border-slate-700">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Legend
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Critical Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span>High Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>Medium Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Low Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Safe</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-purple-500" />
                <span>Exchange</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-red-500 border-dashed" />
                <span>Mixer</span>
              </div>
            </div>
          </div>

          {/* Selected node info */}
          {selectedNode && (
            <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm p-4 rounded-lg border border-slate-700 max-w-sm">
              <h4 className="text-sm font-semibold mb-2">Selected Wallet</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Address:</span>
                  <span className="font-mono">{selectedNode.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Type:</span>
                  <Badge variant="outline" className="text-xs">
                    {selectedNode.type}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Transactions:</span>
                  <span>{selectedNode.transactionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Balance:</span>
                  <span>{parseFloat(selectedNode.balance).toFixed(8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Risk:</span>
                  <Badge
                    variant={selectedNode.riskLevel === 'critical' || selectedNode.riskLevel === 'high' ? 'destructive' : 'default'}
                    className="text-xs"
                  >
                    {selectedNode.riskLevel}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Graph stats */}
          <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm p-4 rounded-lg border border-slate-700">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Nodes:</span>
                <span className="font-semibold">{graph.nodes.length}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Connections:</span>
                <span className="font-semibold">{graph.edges.length}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Zoom:</span>
                <span className="font-semibold">{(scale * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-400 text-center">
          Click on nodes to view details • Drag to pan • Use zoom controls
        </div>
      </CardContent>
    </Card>
  );
}
