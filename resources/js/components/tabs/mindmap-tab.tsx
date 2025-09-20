import { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, { 
    Controls, 
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Handle,
    Position,
    getNodesBounds,
    useReactFlow,
    ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Download, Save } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

// Custom node component
const CustomNode = ({ data }: { data: any }) => {
    const getNodeStyle = () => {
        switch (data.type) {
            case 'main':
                return 'bg-white border-2 border-gray-300';
            case 'primary':
                return 'bg-pink-200';
            case 'secondary':
                return 'bg-purple-200';
            case 'tertiary':
                return 'bg-green-200';
            default:
                return 'bg-gray-100';
        }
    };

    return (
        <div className={`px-4 py-2 rounded-full shadow-md ${getNodeStyle()}`}>
            <Handle type="target" position={Position.Top} className="w-2 h-2" />
            <div className="text-sm font-medium">{data.label}</div>
            <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
        </div>
    );
};

const nodeTypes = {
    custom: CustomNode,
};

interface Mindmap {
    id: number;
    title: string;
    nodes: any[];
    edges: any[];
    note?: {
        id: number;
        title: string;
    };
}

interface MindmapTabProps {
    mindmap: Mindmap;
    className?: string;
}

function MindmapFlow({ mindmap, className = '' }: MindmapTabProps) {
    const { t } = useTranslation();
    const { getNodes } = useReactFlow();
    const reactFlowRef = useRef<HTMLDivElement>(null);
    
    // Debug: Log mindmap data
    console.log('Mindmap data:', mindmap);
    console.log('Nodes:', mindmap.nodes);
    console.log('Edges:', mindmap.edges);
    
    // Debug: Log individual node structure
    if (mindmap.nodes?.length > 0) {
        console.log('First node structure:', mindmap.nodes[0]);
        console.log('First node keys:', Object.keys(mindmap.nodes[0]));
    }
    if (mindmap.edges?.length > 0) {
        console.log('First edge structure:', mindmap.edges[0]);
        console.log('First edge keys:', Object.keys(mindmap.edges[0]));
    }
    
    // Initialize nodes with default positions and custom styling
    const initialNodes = mindmap.nodes?.map((node, index) => ({
        ...node,
        position: node.position || {
            x: 250 * Math.cos(index * (2 * Math.PI) / mindmap.nodes.length),
            y: 250 * Math.sin(index * (2 * Math.PI) / mindmap.nodes.length)
        },
        type: 'custom',
        data: {
            ...node.data,
            type: node.data?.type || 'tertiary',
        }
    })) || [];

    const initialEdges = mindmap.edges?.map((edge, index) => ({
        ...edge,
        style: { stroke: '#10B981', strokeWidth: 2 },
        animated: false,
    })) || [];

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    console.log('Processed nodes:', nodes);
    console.log('Processed edges:', edges);

    const onConnect = useCallback((params: any) => {
        setEdges((eds) => addEdge({
            ...params,
            style: { stroke: '#10B981', strokeWidth: 2 },
            animated: false,
        }, eds));
    }, [setEdges]);

    const handleSave = async () => {
        try {
            await axios.patch(`/mindmaps/${mindmap.id}`, {
                nodes,
                edges,
            });
            toast.success(t('mindmap_saved_successfully'));
        } catch (error) {
            toast.error(t('mindmap_save_failed'));
        }
    };

    const downloadImage = () => {
        const nodesBounds = getNodesBounds(getNodes());
        const imageWidth = 1024;
        const imageHeight = 768;
        
        // Calculate proper viewport with padding
        const padding = 50;
        const viewportWidth = nodesBounds.width + padding * 2;
        const viewportHeight = nodesBounds.height + padding * 2;
        const viewportX = nodesBounds.x - padding;
        const viewportY = nodesBounds.y - padding;
        
        // Create SVG element with proper viewBox
        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgElement.setAttribute('width', String(imageWidth));
        svgElement.setAttribute('height', String(imageHeight));
        svgElement.setAttribute('viewBox', `${viewportX} ${viewportY} ${viewportWidth} ${viewportHeight}`);
        svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        
        // Add white background
        const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        background.setAttribute('x', String(viewportX));
        background.setAttribute('y', String(viewportY));
        background.setAttribute('width', String(viewportWidth));
        background.setAttribute('height', String(viewportHeight));
        background.setAttribute('fill', 'white');
        svgElement.appendChild(background);
        
        // Render edges first (so they appear behind nodes)
        edges.forEach(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            
            if (sourceNode && targetNode) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', String(sourceNode.position.x + 60));
                line.setAttribute('y1', String(sourceNode.position.y + 20));
                line.setAttribute('x2', String(targetNode.position.x + 60));
                line.setAttribute('y2', String(targetNode.position.y + 20));
                line.setAttribute('stroke', '#10B981');
                line.setAttribute('stroke-width', '2');
                svgElement.appendChild(line);
            }
        });
        
        // Render nodes
        nodes.forEach(node => {
            const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            // Create node background
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', String(node.position.x));
            rect.setAttribute('y', String(node.position.y));
            rect.setAttribute('width', '120');
            rect.setAttribute('height', '40');
            rect.setAttribute('rx', '20');
            
            // Set node color based on type
            let fillColor = '#f3f4f6'; // default gray
            switch (node.data?.type) {
                case 'main':
                    fillColor = '#ffffff';
                    rect.setAttribute('stroke', '#d1d5db');
                    rect.setAttribute('stroke-width', '2');
                    break;
                case 'primary':
                    fillColor = '#fce7f3';
                    break;
                case 'secondary':
                    fillColor = '#e9d5ff';
                    break;
                case 'tertiary':
                    fillColor = '#dcfce7';
                    break;
            }
            rect.setAttribute('fill', fillColor);
            
            // Create node text
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', String(node.position.x + 60));
            text.setAttribute('y', String(node.position.y + 25));
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('font-family', 'Arial, sans-serif');
            text.setAttribute('font-size', '12');
            text.setAttribute('font-weight', '500');
            text.setAttribute('fill', '#000000');
            text.textContent = node.data?.label || '';
            
            nodeGroup.appendChild(rect);
            nodeGroup.appendChild(text);
            svgElement.appendChild(nodeGroup);
        });
        
        // Convert SVG to string and create blob
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        // Create canvas and convert to PNG
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
            toast.error(t('canvas_context_failed'));
            return;
        }
        
        canvas.width = imageWidth;
        canvas.height = imageHeight;
        
        // Fill canvas with white background
        context.fillStyle = 'white';
        context.fillRect(0, 0, imageWidth, imageHeight);
        
        const img = new Image();
        img.onload = () => {
            context.drawImage(img, 0, 0, imageWidth, imageHeight);
            
            // Create download link
            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${mindmap.title || 'mindmap'}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    toast.success(t('image_downloaded_successfully'));
                } else {
                    toast.error(t('image_blob_failed'));
                }
            }, 'image/png');
            
            URL.revokeObjectURL(svgUrl);
        };
        
        img.onerror = (error) => {
            console.error('Image load error:', error);
            URL.revokeObjectURL(svgUrl);
            toast.error(t('image_export_failed'));
        };
        
        img.crossOrigin = 'anonymous';
        img.src = svgUrl;
    };

    return (
        <div className={`h-full flex flex-col ${className}`}>

            <div className="flex-1" ref={reactFlowRef} style={{ height: '100%' }}>
                {nodes.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        No mindmap data available
                    </div>
                ) : (
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                        fitView
                    >
                        <Background />
                        <Controls />
                    </ReactFlow>
                )}
            </div>
        </div>
    );
}

export function MindmapTab({ mindmap, className = '' }: MindmapTabProps) {
    const [isVisible, setIsVisible] = useState(false);
    const tabRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            {
                threshold: 0.1, // Trigger when 10% of the tab is visible
                rootMargin: '0px'
            }
        );

        if (tabRef.current) {
            observer.observe(tabRef.current);
        }

        return () => {
            if (tabRef.current) {
                observer.unobserve(tabRef.current);
            }
        };
    }, []);

    return (
        <div ref={tabRef} className="h-full">
            <ReactFlowProvider>
                {isVisible ? (
                    <MindmapFlow mindmap={mindmap} className={className} />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        Loading mindmap...
                    </div>
                )}
            </ReactFlowProvider>
        </div>
    );
}