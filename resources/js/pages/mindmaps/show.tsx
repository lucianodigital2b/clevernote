import { useState, useCallback } from 'react';
import ReactFlow, { 
    Controls, 
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Handle,
    Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

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

interface Props {
    mindmap: {
        id: number;
        title: string;
        nodes: any[];
        edges: any[];
        note: {
            id: number;
            title: string;
        };
    };
}

export default function Show({ mindmap }: Props) {
    // Initialize nodes with default positions and custom styling
    const initialNodes = mindmap.nodes.map((node, index) => ({
        ...node,
        position: node.position || {
            x: 250 * Math.cos(index * (2 * Math.PI) / mindmap.nodes.length),
            y: 250 * Math.sin(index * (2 * Math.PI) / mindmap.nodes.length)
        },
        type: 'custom',
        data: {
            ...node.data,
            type: node.data?.type || 'tertiary', // Default to tertiary style
        }
    }));

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(mindmap.edges.map(edge => ({
        ...edge,
        style: { stroke: '#10B981', strokeWidth: 2 }, // Green edges like in the image
        animated: false,
    })));

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
            toast.success('Mindmap saved successfully');
        } catch (error) {
            toast.error('Failed to save mindmap');
        }
    };

    return (
        <AppLayout>
            <Head title={mindmap.title} />
            
            <div className="h-full flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        {mindmap.note && (
                            <Button
                                variant="ghost"
                                onClick={() => window.location.href = `/notes/${mindmap.note.id}`}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Note
                            </Button>
                        )}
                        <h1 className="text-2xl font-semibold">{mindmap.title}</h1>
                    </div>
                    <Button onClick={handleSave}>Save Changes</Button>
                </div>
                
                <div className="flex-1 h-[800px]">
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
                </div>
            </div>
        </AppLayout>
    );
}