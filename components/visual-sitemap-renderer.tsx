'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Tree from 'react-d3-tree';
import { Card } from '@/components/ui/card';

// Define the node data structure
interface TreeNode {
  name: string;
  attributes?: Record<string, string>;
  children?: TreeNode[];
}

interface VisualSitemapRendererProps {
  sitemapText: string;
  title?: string;
}

export function VisualSitemapRenderer({ sitemapText, title }: VisualSitemapRendererProps) {
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.8);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const treeRef = React.useRef<any>(null);

  // Parse the tab-indented text into a hierarchical structure
  useEffect(() => {
    if (!sitemapText) return;

    const parseTabIndentedText = (text: string): TreeNode => {
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      // Create root node from the first line
      const rootName = lines[0].trim();
      const root: TreeNode = { name: rootName, children: [] };
      
      // Stack to keep track of the current path in the tree
      const stack: { node: TreeNode; level: number }[] = [{ node: root, level: 0 }];
      
      // Process each line starting from the second line
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const content = line.trimStart();
        
        // Calculate the indentation level (number of tabs)
        const level = (line.length - content.length) / 1;
        
        // Create a new node
        const newNode: TreeNode = { name: content, children: [] };
        
        // Find the parent node for this level
        while (stack.length > 1 && stack[stack.length - 1].level >= level) {
          stack.pop();
        }
        
        // Add the new node to its parent
        const parent = stack[stack.length - 1].node;
        if (!parent.children) parent.children = [];
        parent.children.push(newNode);
        
        // Add the new node to the stack
        stack.push({ node: newNode, level });
      }
      
      return root;
    };

    try {
      const parsedData = parseTabIndentedText(sitemapText);
      setTreeData(parsedData);
    } catch (error) {
      console.error('Error parsing sitemap text:', error);
    }
  }, [sitemapText]);

  // Update dimensions when the container size changes
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
        // Center the tree horizontally
        setTranslate({ x: width / 2, y: 80 });
      }
    };

    // Initial update
    updateDimensions();

    // Add resize listener
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Custom node renderer with enhanced styling
  const renderCustomNode = ({ nodeDatum, hierarchyPointNode }: { nodeDatum: any; hierarchyPointNode?: any }) => {
    // Determine if this is a root node, section node, or leaf node
    const isRootNode = !hierarchyPointNode?.parent;
    const isLeafNode = !nodeDatum.children || nodeDatum.children.length === 0;
    const isSectionNode = !isRootNode && !isLeafNode;
    
    // Set different styles based on node type
    let nodeSize = isRootNode ? 24 : isLeafNode ? 8 : 16;
    let nodeFill = isRootNode ? '#3b82f6' : isSectionNode ? '#6366f1' : '#10b981';
    let textColor = '#1e293b';
    let fontSize = isRootNode ? 14 : 12;
    let fontWeight = isRootNode || isSectionNode ? 'bold' : 'normal';
    
    // Calculate text position
    const textX = nodeSize + 5;
    const textY = isRootNode ? -20 : -15;
    
    // Set max width based on node type
    const maxWidth = isRootNode ? 300 : 200;
    const height = 45; // Increased height to accommodate two lines
    
    return (
      <g>
        {/* Node circle */}
        <circle 
          r={nodeSize} 
          fill={nodeFill}
          className="node-circle"
          style={{ transition: 'all 0.3s ease' }}
        />
        
        {/* Node label with fixed width and two-line wrapping */}
        <foreignObject
          x={textX}
          y={textY}
          width={maxWidth}
          height={height}
          style={{ overflow: 'visible' }}
        >
          <div
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: `${fontSize}px`,
              fontWeight: fontWeight,
              color: textColor,
              width: `${maxWidth}px`,
              whiteSpace: 'normal', // Allow text to wrap
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              pointerEvents: 'none',
              userSelect: 'none',
              transition: 'all 0.3s ease',
              padding: '2px 0',
              lineHeight: '1.2',
              display: '-webkit-box',
              WebkitLineClamp: 2, // Limit to 2 lines
              WebkitBoxOrient: 'vertical',
              maxHeight: '2.6em' // 2 lines × 1.2 line-height
            }}
          >
            {nodeDatum.name}
          </div>
        </foreignObject>
      </g>
    );
  };

  // Handle tree container events
  const handleTreeContainerClick = useCallback((evt: React.MouseEvent) => {
    // Only handle clicks directly on the container, not on nodes
    if ((evt.target as HTMLElement).tagName === 'svg') {
      // Do something on container click if needed
    }
  }, []);

  if (!treeData) {
    return <div>No sitemap data available</div>;
  }

  return (
    <Card className="w-full overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">{title || 'Visual Sitemap'}</h3>
      </div>
      
      <div 
        ref={containerRef} 
        className="w-full h-[600px] overflow-auto bg-gradient-to-b from-slate-50 to-white"
        onClick={handleTreeContainerClick}
      >
        <Tree
          ref={treeRef}
          data={treeData}
          orientation="vertical"
          pathFunc="step"
          translate={translate}
          renderCustomNodeElement={renderCustomNode}
          separation={{ siblings: 1.2, nonSiblings: 1.5 }}
          zoom={zoom}
          enableLegacyTransitions
          transitionDuration={800}
          nodeSize={{ x: 220, y: 100 }} // Reduced horizontal node size and kept vertical spacing
          pathClassFunc={() => 'site-tree-link'}
          onUpdate={(state) => {
            // Update state when tree is manipulated by user
            if (state.zoom !== zoom) {
              setZoom(state.zoom);
            }
            if (state.translate.x !== translate.x || state.translate.y !== translate.y) {
              setTranslate(state.translate);
            }
          }}
        />
      </div>
      <style jsx global>{`
        .site-tree-link {
          stroke: #cbd5e1;
          stroke-width: 2px;
          fill: none;
          transition: all 0.3s ease;
        }
        .site-tree-link:hover {
          stroke: #94a3b8;
          stroke-width: 2.5px;
        }
        .rd3t-node {
          cursor: pointer;
        }
        .rd3t-node:hover circle {
          filter: brightness(1.1);
        }
        .rd3t-link {
          stroke: #cbd5e1;
          stroke-width: 2px;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
          transition: all 0.3s ease;
        }
        .node-circle {
          filter: drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.1));
        }
      `}</style>
    </Card>
  );
} 