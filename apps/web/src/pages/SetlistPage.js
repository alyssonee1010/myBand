import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { setlistApi, contentApi } from '../lib/api';
import '../styles/setlist.css';
export default function SetlistPage() {
    const navigate = useNavigate();
    const { groupId, setlistId } = useParams();
    const [setlist, setSetlist] = useState(null);
    const [availableContent, setAvailableContent] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (groupId && setlistId) {
            loadSetlist();
            loadAvailableContent();
        }
    }, [groupId, setlistId]);
    const loadSetlist = async () => {
        try {
            const data = await setlistApi.getSetlist(groupId, setlistId);
            setSetlist(data);
        }
        catch (err) {
            alert('Failed to load setlist');
            navigate(-1);
        }
        finally {
            setLoading(false);
        }
    };
    const loadAvailableContent = async () => {
        try {
            const data = await contentApi.getGroupContent(groupId);
            setAvailableContent(data.contents);
        }
        catch (err) {
            console.error('Failed to load content');
        }
    };
    const handleDragEnd = async (result) => {
        const { source, destination } = result;
        if (!destination)
            return;
        if (source.index === destination.index)
            return;
        if (!setlist)
            return;
        const items = Array.from(setlist.items);
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);
        setSetlist({
            ...setlist,
            items,
        });
        try {
            const itemsToSend = items.map((item, index) => ({
                itemId: item.id,
                position: index,
            }));
            await setlistApi.reorderSetlistItems(groupId, setlistId, itemsToSend);
        }
        catch (err) {
            alert('Failed to reorder items');
            await loadSetlist();
        }
    };
    const handleAddContent = async (contentId) => {
        try {
            await setlistApi.addItemToSetlist(groupId, setlistId, contentId);
            await loadSetlist();
            setShowAddModal(false);
        }
        catch (err) {
            alert('Failed to add content');
        }
    };
    const handleRemoveItem = async (itemId) => {
        if (!confirm('Remove from setlist?'))
            return;
        try {
            await setlistApi.removeItemFromSetlist(groupId, setlistId, itemId);
            await loadSetlist();
        }
        catch (err) {
            alert('Failed to remove item');
        }
    };
    if (loading) {
        return _jsx("div", { className: "min-h-screen flex items-center justify-center", children: "Loading..." });
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("header", { className: "bg-white shadow", children: _jsxs("div", { className: "container-app", children: [_jsx("button", { onClick: () => navigate(-1), className: "text-blue-600 hover:underline mb-4", children: "\u2190 Back" }), _jsx("h1", { className: "text-3xl font-bold", children: setlist?.name })] }) }), _jsxs("main", { className: "container-app", children: [_jsxs("div", { className: "flex justify-between items-center mb-8", children: [_jsxs("h2", { className: "text-2xl font-bold", children: ["Songs (", setlist?.items.length || 0, ")"] }), _jsx("button", { onClick: () => setShowAddModal(true), className: "btn-primary", children: "+ Add Song" })] }), setlist && setlist.items.length === 0 ? (_jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-gray-500 mb-4", children: "No songs in this setlist yet." }) })) : (_jsx(DragDropContext, { onDragEnd: handleDragEnd, children: _jsx(Droppable, { droppableId: "setlist", children: (provided, snapshot) => (_jsxs("div", { ...provided.droppableProps, ref: provided.innerRef, className: `space-y-3 ${snapshot.isDraggingOver ? 'bg-blue-50 p-4 rounded' : ''}`, children: [setlist?.items.map((item, index) => (_jsx(Draggable, { draggableId: item.id, index: index, children: (provided, snapshot) => (_jsx("div", { ref: provided.innerRef, ...provided.draggableProps, ...provided.dragHandleProps, className: `card cursor-move ${snapshot.isDragging ? 'shadow-lg bg-blue-50' : ''}`, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("p", { className: "font-bold", children: [index + 1, ". ", item.content.title] }), _jsx("p", { className: "text-sm text-gray-500", children: item.content.contentType })] }), _jsx("button", { onClick: () => handleRemoveItem(item.id), className: "btn-danger text-sm", children: "Remove" })] }) })) }, item.id))), provided.placeholder] })) }) }))] }), showAddModal && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "card w-full max-w-2xl max-h-96 overflow-y-auto", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "Add Content" }), _jsx("div", { className: "space-y-2", children: availableContent
                                .filter((c) => !setlist?.items.some((item) => item.contentId === c.id))
                                .map((content) => (_jsx("div", { className: "p-3 border rounded hover:bg-gray-50", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("p", { className: "font-bold", children: content.title }), _jsx("p", { className: "text-sm text-gray-500", children: content.contentType })] }), _jsx("button", { onClick: () => handleAddContent(content.id), className: "btn-primary text-sm", children: "Add" })] }) }, content.id))) }), _jsx("button", { onClick: () => setShowAddModal(false), className: "mt-4 btn-secondary w-full", children: "Close" })] }) }))] }));
}
//# sourceMappingURL=SetlistPage.js.map