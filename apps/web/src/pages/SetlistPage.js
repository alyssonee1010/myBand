import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
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
    const [activeItemId, setActiveItemId] = useState(null);
    const [activeFileUrl, setActiveFileUrl] = useState(null);
    const [isActiveFileLoading, setIsActiveFileLoading] = useState(false);
    const [isPerformanceMode, setIsPerformanceMode] = useState(false);
    const touchStartX = useRef(null);
    const performanceModeRef = useRef(null);
    useEffect(() => {
        if (groupId && setlistId) {
            void loadSetlist();
            void loadAvailableContent();
        }
    }, [groupId, setlistId]);
    useEffect(() => {
        if (!setlist?.items.length) {
            setActiveItemId(null);
            return;
        }
        const activeItemStillExists = setlist.items.some((item) => item.id === activeItemId);
        if (!activeItemStillExists) {
            setActiveItemId(setlist.items[0].id);
        }
    }, [setlist, activeItemId]);
    const activeIndex = setlist && activeItemId
        ? setlist.items.findIndex((item) => item.id === activeItemId)
        : -1;
    const activeItem = activeIndex >= 0 && setlist ? setlist.items[activeIndex] : null;
    const canGoPrevious = activeIndex > 0;
    const canGoNext = !!setlist && activeIndex >= 0 && activeIndex < setlist.items.length - 1;
    useEffect(() => {
        if (!groupId || !activeItem?.content.fileUrl) {
            setActiveFileUrl((currentFileUrl) => {
                if (currentFileUrl) {
                    URL.revokeObjectURL(currentFileUrl);
                }
                return null;
            });
            setIsActiveFileLoading(false);
            return;
        }
        let isCancelled = false;
        const loadActiveFile = async () => {
            setIsActiveFileLoading(true);
            try {
                const blob = await contentApi.getContentFile(groupId, activeItem.content.id);
                if (isCancelled)
                    return;
                const nextFileUrl = URL.createObjectURL(blob);
                setActiveFileUrl((currentFileUrl) => {
                    if (currentFileUrl) {
                        URL.revokeObjectURL(currentFileUrl);
                    }
                    return nextFileUrl;
                });
            }
            catch (err) {
                if (!isCancelled) {
                    setActiveFileUrl((currentFileUrl) => {
                        if (currentFileUrl) {
                            URL.revokeObjectURL(currentFileUrl);
                        }
                        return null;
                    });
                }
            }
            finally {
                if (!isCancelled) {
                    setIsActiveFileLoading(false);
                }
            }
        };
        void loadActiveFile();
        return () => {
            isCancelled = true;
        };
    }, [groupId, activeItem?.content.id, activeItem?.content.fileUrl]);
    useEffect(() => {
        return () => {
            if (activeFileUrl) {
                URL.revokeObjectURL(activeFileUrl);
            }
        };
    }, [activeFileUrl]);
    useEffect(() => {
        if (!isPerformanceMode)
            return;
        const handleKeyDown = (event) => {
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                handlePrevious();
            }
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                handleNext();
            }
            if (event.key === 'Escape') {
                event.preventDefault();
                void exitPerformanceMode();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPerformanceMode, activeIndex, setlist]);
    useEffect(() => {
        if (!isPerformanceMode || !performanceModeRef.current)
            return;
        const element = performanceModeRef.current;
        const handleFullscreenChange = () => {
            if (document.fullscreenElement !== element) {
                setIsPerformanceMode(false);
            }
        };
        const requestFullscreen = async () => {
            try {
                if (document.fullscreenElement !== element) {
                    await element.requestFullscreen();
                }
            }
            catch (err) {
                console.error('Fullscreen request failed', err);
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        void requestFullscreen();
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [isPerformanceMode]);
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
    const goToItemAtIndex = (index) => {
        if (!setlist || index < 0 || index >= setlist.items.length)
            return;
        setActiveItemId(setlist.items[index].id);
    };
    const handlePrevious = () => {
        if (canGoPrevious) {
            goToItemAtIndex(activeIndex - 1);
        }
    };
    const handleNext = () => {
        if (canGoNext) {
            goToItemAtIndex(activeIndex + 1);
        }
    };
    const handleViewerTouchStart = (e) => {
        touchStartX.current = e.changedTouches[0]?.clientX ?? null;
    };
    const handleViewerTouchEnd = (e) => {
        if (touchStartX.current === null)
            return;
        const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
        const deltaX = endX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(deltaX) < 50)
            return;
        if (deltaX < 0) {
            handleNext();
            return;
        }
        handlePrevious();
    };
    const enterPerformanceMode = () => {
        setIsPerformanceMode(true);
    };
    const exitPerformanceMode = async () => {
        setIsPerformanceMode(false);
        if (document.fullscreenElement) {
            try {
                await document.exitFullscreen();
            }
            catch (err) {
                console.error('Fullscreen exit failed', err);
            }
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
    const renderActiveContent = () => {
        if (!activeItem) {
            return (_jsx("div", { className: "setlist-viewer-empty", children: _jsx("p", { children: "Select a song from the list to start viewing it." }) }));
        }
        const { content } = activeItem;
        if (content.fileUrl && isActiveFileLoading) {
            return (_jsx("div", { className: "setlist-viewer-empty", children: _jsx("p", { children: "Loading song..." }) }));
        }
        if (content.contentType === 'image' && activeFileUrl) {
            return (_jsx("div", { className: "setlist-viewer-media", children: _jsx("img", { src: activeFileUrl, alt: content.title, className: "setlist-viewer-image" }) }));
        }
        if (content.contentType === 'pdf' && activeFileUrl) {
            return (_jsx("div", { className: "setlist-viewer-media", children: _jsx("object", { data: activeFileUrl, type: "application/pdf", className: "setlist-viewer-frame", children: _jsx("iframe", { src: activeFileUrl, title: content.title, className: "setlist-viewer-frame" }, activeFileUrl) }) }));
        }
        if ((content.contentType === 'lyrics' || content.contentType === 'chords') && content.textContent) {
            return (_jsx("div", { className: "setlist-viewer-text", children: _jsx("pre", { children: content.textContent }) }));
        }
        return (_jsx("div", { className: "setlist-viewer-empty", children: _jsx("p", { children: "Preview unavailable for this file." }) }));
    };
    if (loading) {
        return _jsx("div", { className: "min-h-screen flex items-center justify-center", children: "Loading..." });
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("header", { className: "bg-white shadow", children: _jsxs("div", { className: "container-app", children: [_jsx("button", { onClick: () => navigate(-1), className: "text-blue-600 hover:underline mb-4", children: "\u2190 Back" }), _jsx("h1", { className: "text-3xl font-bold", children: setlist?.name })] }) }), _jsxs("main", { className: "container-app", children: [_jsxs("div", { className: "flex justify-between items-center mb-8 gap-3 flex-wrap", children: [_jsxs("h2", { className: "text-2xl font-bold", children: ["Songs (", setlist?.items.length || 0, ")"] }), _jsxs("div", { className: "flex gap-3 flex-wrap", children: [_jsx("button", { type: "button", onClick: enterPerformanceMode, className: "btn-secondary", disabled: !activeItem, children: "Performance Mode" }), _jsx("button", { onClick: () => setShowAddModal(true), className: "btn-primary", children: "+ Add Song" })] })] }), setlist && setlist.items.length === 0 ? (_jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-gray-500 mb-4", children: "No songs in this setlist yet." }) })) : (_jsxs("div", { className: "setlist-layout", children: [_jsxs("section", { className: "card setlist-viewer", children: [_jsxs("div", { className: "setlist-viewer-header", children: [_jsxs("div", { children: [_jsx("p", { className: "setlist-viewer-label", children: "Now Viewing" }), _jsx("h3", { className: "text-2xl font-bold", children: activeItem?.content.title || 'Select a song' }), _jsx("p", { className: "text-sm text-gray-500", children: activeIndex >= 0 ? `${activeIndex + 1} of ${setlist?.items.length}` : 'No active song' })] }), _jsxs("div", { className: "setlist-viewer-actions", children: [_jsx("button", { type: "button", onClick: handlePrevious, disabled: !canGoPrevious, className: "btn-secondary disabled:opacity-50 disabled:cursor-not-allowed", children: "\u2190 Previous" }), _jsx("button", { type: "button", onClick: handleNext, disabled: !canGoNext, className: "btn-primary disabled:opacity-50 disabled:cursor-not-allowed", children: "Next \u2192" })] })] }), _jsx("div", { className: "setlist-viewer-body", onTouchStart: handleViewerTouchStart, onTouchEnd: handleViewerTouchEnd, children: renderActiveContent() }), activeItem && (_jsx("div", { className: "setlist-viewer-footer", children: _jsx("p", { className: "text-sm text-gray-500", children: "Swipe on touch screens, use the buttons here, or open Performance Mode for fullscreen navigation." }) }))] }), _jsx("section", { children: _jsx(DragDropContext, { onDragEnd: handleDragEnd, children: _jsx(Droppable, { droppableId: "setlist", children: (provided, snapshot) => (_jsxs("div", { ...provided.droppableProps, ref: provided.innerRef, className: `space-y-3 ${snapshot.isDraggingOver ? 'bg-blue-50 p-4 rounded' : ''}`, children: [setlist?.items.map((item, index) => {
                                                    const isActive = item.id === activeItemId;
                                                    return (_jsx(Draggable, { draggableId: item.id, index: index, children: (provided, snapshot) => (_jsx("div", { ref: provided.innerRef, ...provided.draggableProps, ...provided.dragHandleProps, className: `card cursor-move transition ${snapshot.isDragging ? 'shadow-lg bg-blue-50' : ''} ${isActive ? 'ring-2 ring-blue-500' : ''}`, onClick: () => setActiveItemId(item.id), children: _jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsxs("p", { className: "font-bold", children: [index + 1, ". ", item.content.title] }), _jsx("p", { className: "text-sm text-gray-500", children: item.content.contentType })] }), _jsx("button", { type: "button", onClick: (e) => {
                                                                            e.stopPropagation();
                                                                            void handleRemoveItem(item.id);
                                                                        }, className: "btn-danger text-sm", children: "Remove" })] }) })) }, item.id));
                                                }), provided.placeholder] })) }) }) })] }))] }), isPerformanceMode && activeItem && (_jsxs("div", { ref: performanceModeRef, className: "performance-mode-overlay", onTouchStart: handleViewerTouchStart, onTouchEnd: handleViewerTouchEnd, children: [_jsxs("div", { className: "performance-mode-topbar", children: [_jsxs("div", { children: [_jsx("p", { className: "performance-mode-label", children: "Performance Mode" }), _jsx("h2", { children: activeItem.content.title }), _jsxs("p", { children: [activeIndex + 1, " of ", setlist?.items.length] })] }), _jsx("button", { type: "button", onClick: () => void exitPerformanceMode(), className: "performance-mode-close", children: "Close" })] }), _jsx("div", { className: "performance-mode-body", children: renderActiveContent() }), _jsx("div", { className: "performance-mode-hint", children: "Swipe between songs on iPad. Use keyboard left/right arrows on laptop." })] })), showAddModal && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "card w-full max-w-2xl max-h-96 overflow-y-auto", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "Add Content" }), _jsx("div", { className: "space-y-2", children: availableContent
                                .filter((content) => !setlist?.items.some((item) => item.contentId === content.id))
                                .map((content) => (_jsx("div", { className: "p-3 border rounded hover:bg-gray-50", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("p", { className: "font-bold", children: content.title }), _jsx("p", { className: "text-sm text-gray-500", children: content.contentType })] }), _jsx("button", { onClick: () => handleAddContent(content.id), className: "btn-primary text-sm", children: "Add" })] }) }, content.id))) }), _jsx("button", { onClick: () => setShowAddModal(false), className: "mt-4 btn-secondary w-full", children: "Close" })] }) }))] }));
}
//# sourceMappingURL=SetlistPage.js.map