import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { contentApi, setlistApi } from '../lib/api';
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
    const [addingContentIds, setAddingContentIds] = useState([]);
    const [addStatus, setAddStatus] = useState(null);
    const touchStartX = useRef(null);
    const performanceModeRef = useRef(null);
    const addingContentIdsRef = useRef(new Set());
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
        const reorderedItems = Array.from(setlist.items);
        const [reorderedItem] = reorderedItems.splice(source.index, 1);
        reorderedItems.splice(destination.index, 0, reorderedItem);
        const items = reorderedItems.map((item, index) => ({
            ...item,
            position: index,
        }));
        setSetlist({
            ...setlist,
            items,
        });
        try {
            const itemsToSend = items.map((item, index) => ({
                itemId: item.id,
                position: index,
            }));
            const updatedSetlist = await setlistApi.reorderSetlistItems(groupId, setlistId, itemsToSend);
            setSetlist(updatedSetlist);
        }
        catch (err) {
            alert('Failed to reorder items');
            await loadSetlist();
        }
    };
    const handleAddContent = async (content) => {
        if (!groupId || !setlistId || !setlist) {
            return;
        }
        if (addingContentIdsRef.current.has(content.id) ||
            setlist.items.some((item) => item.contentId === content.id)) {
            return;
        }
        addingContentIdsRef.current.add(content.id);
        setAddingContentIds(Array.from(addingContentIdsRef.current));
        setAddStatus({
            tone: 'info',
            text: `Adding "${content.title}" in the background...`,
        });
        try {
            const item = await setlistApi.addItemToSetlist(groupId, setlistId, content.id);
            setSetlist((currentSetlist) => {
                if (!currentSetlist) {
                    return currentSetlist;
                }
                if (currentSetlist.items.some((currentItem) => currentItem.contentId === item.contentId)) {
                    return currentSetlist;
                }
                return {
                    ...currentSetlist,
                    items: [...currentSetlist.items, item].sort((leftItem, rightItem) => leftItem.position - rightItem.position),
                };
            });
            setAddStatus({
                tone: 'success',
                text: `"${content.title}" was added. You can keep adding more songs.`,
            });
        }
        catch (error) {
            const apiError = error;
            if (apiError.status === 409) {
                setAddStatus({
                    tone: 'info',
                    text: `"${content.title}" is already in this setlist.`,
                });
                await loadSetlist();
            }
            else {
                setAddStatus({
                    tone: 'error',
                    text: apiError.message || 'Failed to add content',
                });
            }
        }
        finally {
            addingContentIdsRef.current.delete(content.id);
            setAddingContentIds(Array.from(addingContentIdsRef.current));
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
        return (_jsx("div", { className: "app-shell flex min-h-screen items-center justify-center px-4", children: _jsxs("div", { className: "card max-w-sm text-center", children: [_jsx("p", { className: "section-kicker", children: "Loading" }), _jsx("p", { className: "mt-3 text-xl font-semibold tracking-tight", children: "Preparing your setlist viewer..." })] }) }));
    }
    const addedContentIds = new Set(setlist?.items.map((item) => item.contentId) ?? []);
    const addedContentCount = availableContent.filter((content) => addedContentIds.has(content.id)).length;
    return (_jsxs("div", { className: "app-shell", children: [_jsx("header", { className: "app-header", children: _jsxs("div", { className: "container-app", children: [_jsxs("button", { onClick: () => navigate(`/groups/${groupId}/setlists`), className: "app-link mb-5 inline-flex items-center gap-2", children: [_jsx("span", { "aria-hidden": "true", children: "\u2190" }), _jsx("span", { children: "Back to Setlists" })] }), _jsxs("div", { className: "flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between", children: [_jsxs("div", { className: "max-w-3xl", children: [_jsx("p", { className: "section-kicker", children: "Setlist Viewer" }), _jsx("h1", { className: "mt-3 text-4xl font-bold tracking-tight md:text-5xl", children: setlist?.name })] }), _jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsxs("span", { className: "stat-pill", children: [setlist?.items.length || 0, " songs"] }), _jsx("button", { type: "button", onClick: enterPerformanceMode, className: "btn-secondary", disabled: !activeItem, children: "Performance Mode" }), _jsx("button", { onClick: () => {
                                                setAddStatus(null);
                                                setShowAddModal(true);
                                            }, className: "btn-primary", children: "Add Song" })] })] })] }) }), _jsx("main", { className: "container-app", children: setlist && setlist.items.length === 0 ? (_jsxs("div", { className: "card py-16 text-center", children: [_jsx("p", { className: "text-2xl font-semibold tracking-tight", children: "No songs in this setlist yet" }), _jsx("p", { className: "mt-3 text-sm leading-6 text-black/60", children: "Add songs from your shared library to start building the running order." }), _jsx("div", { className: "mt-6 flex justify-center", children: _jsx("button", { onClick: () => {
                                    setAddStatus(null);
                                    setShowAddModal(true);
                                }, className: "btn-primary", children: "Add Your First Song" }) })] })) : (_jsxs("div", { className: "setlist-layout", children: [_jsxs("section", { className: "card setlist-viewer", children: [_jsxs("div", { className: "setlist-viewer-header", children: [_jsxs("div", { children: [_jsx("p", { className: "setlist-viewer-label", children: "Now Viewing" }), _jsx("h3", { className: "text-2xl font-bold tracking-tight", children: activeItem?.content.title || 'Select a song' }), _jsx("p", { className: "mt-2 text-sm text-black/60", children: activeIndex >= 0
                                                        ? `${activeIndex + 1} of ${setlist?.items.length}`
                                                        : 'No active song' })] }), _jsxs("div", { className: "setlist-viewer-actions", children: [_jsx("button", { type: "button", onClick: handlePrevious, disabled: !canGoPrevious, className: "btn-secondary", children: "Previous" }), _jsx("button", { type: "button", onClick: handleNext, disabled: !canGoNext, className: "btn-primary", children: "Next" })] })] }), _jsx("div", { className: "setlist-viewer-body", onTouchStart: handleViewerTouchStart, onTouchEnd: handleViewerTouchEnd, children: renderActiveContent() }), activeItem && (_jsx("div", { className: "setlist-viewer-footer", children: _jsx("p", { className: "text-sm text-black/60", children: "Swipe on touch screens, use the buttons here, or open Performance Mode for fullscreen navigation." }) }))] }), _jsxs("section", { className: "card", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "section-kicker", children: "Order" }), _jsx("h2", { className: "mt-3 text-2xl font-bold tracking-tight", children: "Running Order" })] }), _jsx("span", { className: "stat-pill", children: setlist?.items.length || 0 })] }), _jsx(DragDropContext, { onDragEnd: handleDragEnd, children: _jsx(Droppable, { droppableId: "setlist", children: (provided, snapshot) => (_jsxs("div", { ...provided.droppableProps, ref: provided.innerRef, className: `mt-5 space-y-3 rounded-[28px] transition ${snapshot.isDraggingOver ? 'bg-[rgba(255,106,0,0.08)] p-3' : ''}`, children: [setlist?.items.map((item, index) => {
                                                    const isActive = item.id === activeItemId;
                                                    return (_jsx(Draggable, { draggableId: item.id, index: index, children: (provided, snapshot) => (_jsx("div", { ref: provided.innerRef, ...provided.draggableProps, ...provided.dragHandleProps, className: `setlist-item-card ${snapshot.isDragging ? 'setlist-item-card-dragging' : ''} ${isActive ? 'setlist-item-card-active' : ''}`, onClick: () => setActiveItemId(item.id), children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsx("span", { className: "rounded-full border border-orange-300/60 bg-orange-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-black/70", children: String(index + 1).padStart(2, '0') }), _jsx("span", { className: "rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-black/70", children: item.content.contentType })] }), _jsx("p", { className: "mt-4 text-lg font-bold tracking-tight text-black", children: item.content.title })] }), _jsx("button", { type: "button", onClick: (e) => {
                                                                            e.stopPropagation();
                                                                            void handleRemoveItem(item.id);
                                                                        }, className: "btn-danger", children: "Remove" })] }) })) }, item.id));
                                                }), provided.placeholder] })) }) })] })] })) }), isPerformanceMode && activeItem && (_jsxs("div", { ref: performanceModeRef, className: "performance-mode-overlay", onTouchStart: handleViewerTouchStart, onTouchEnd: handleViewerTouchEnd, children: [_jsxs("div", { className: "performance-mode-topbar", children: [_jsxs("div", { children: [_jsx("p", { className: "performance-mode-label", children: "Performance Mode" }), _jsx("h2", { children: activeItem.content.title }), _jsxs("p", { children: [activeIndex + 1, " of ", setlist?.items.length] })] }), _jsx("button", { type: "button", onClick: () => void exitPerformanceMode(), className: "performance-mode-close", children: "Close" })] }), _jsx("div", { className: "performance-mode-body", children: renderActiveContent() }), _jsx("div", { className: "performance-mode-hint", children: "Swipe between songs on iPad. Use keyboard left and right arrows on laptop." })] })), showAddModal && (_jsx("div", { className: "modal-overlay", children: _jsxs("div", { className: "card modal-card max-h-[32rem] max-w-2xl overflow-y-auto", children: [_jsx("p", { className: "section-kicker", children: "Add Content" }), _jsx("h2", { className: "mt-3 text-3xl font-bold tracking-tight", children: "Add songs to this setlist" }), _jsx("p", { className: "mt-2 text-sm leading-6 text-black/60", children: "Stay on this page and keep tapping songs. New additions are saved in the background." }), addStatus && (_jsx("div", { className: `mt-5 status-banner ${addStatus.tone === 'success'
                                ? 'status-banner-strong'
                                : 'status-banner-muted'}`, children: addStatus.text })), availableContent.length === 0 ? (_jsxs("div", { className: "mt-6 rounded-[24px] border border-dashed border-orange-300/70 bg-[rgba(255,106,0,0.06)] px-5 py-10 text-center", children: [_jsx("p", { className: "text-xl font-semibold tracking-tight", children: "No songs in the band library yet" }), _jsx("p", { className: "mt-2 text-sm leading-6 text-black/60", children: "Add more content to the band library first, then come back here to build the setlist." })] })) : (_jsxs("div", { className: "mt-6 space-y-3", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-black/10 bg-white/70 px-4 py-3 text-sm text-black/60", children: [_jsxs("span", { children: [addedContentCount, " of ", availableContent.length, " songs already in this setlist"] }), _jsx("span", { children: addingContentIds.length > 0 ? 'Saving changes...' : 'Ready to add more' })] }), availableContent.map((content) => {
                                    const isAlreadyAdded = addedContentIds.has(content.id);
                                    const isAdding = addingContentIds.includes(content.id);
                                    return (_jsx("div", { className: `rounded-[24px] border p-4 transition ${isAlreadyAdded
                                            ? 'border-teal-200 bg-teal-50/70'
                                            : 'border-black/10 bg-white/80'}`, children: _jsxs("div", { className: "flex flex-col gap-3 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-lg font-semibold tracking-tight", children: content.title }), _jsxs("p", { className: "mt-1 text-sm text-black/60", children: [content.contentType, content.description ? ` · ${content.description}` : ''] })] }), _jsx("button", { type: "button", onClick: () => void handleAddContent(content), className: isAlreadyAdded ? 'btn-secondary' : 'btn-primary', disabled: isAlreadyAdded || isAdding, children: isAdding ? 'Adding...' : isAlreadyAdded ? 'Already Added' : 'Add' })] }) }, content.id));
                                })] })), _jsx("button", { onClick: () => {
                                setShowAddModal(false);
                                setAddStatus(null);
                            }, className: "btn-secondary mt-6 w-full", children: "Close" })] }) }))] }));
}
//# sourceMappingURL=SetlistPage.js.map