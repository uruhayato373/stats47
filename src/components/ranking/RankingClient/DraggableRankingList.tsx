"use client";

import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RankingItem } from "@/types/models/ranking";

interface DraggableItemProps {
  item: RankingItem;
  onEdit: (item: RankingItem) => void;
  onDelete: (item: RankingItem) => void;
  isLoading: boolean;
}

const DraggableItem: React.FC<DraggableItemProps> = ({
  item,
  onEdit,
  onDelete,
  isLoading,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 border rounded-md bg-white dark:bg-gray-700"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-move text-gray-400 hover:text-gray-600"
      >
        ☰
      </div>
      <div className="flex-1">{item.label}</div>
      <button
        onClick={() => onEdit(item)}
        className="text-sm text-blue-600 hover:text-blue-700"
        disabled={isLoading}
      >
        編集
      </button>
      <button
        onClick={() => onDelete(item)}
        className="text-sm text-red-600 hover:text-red-700"
        disabled={isLoading}
      >
        削除
      </button>
    </div>
  );
};

interface DraggableRankingListProps {
  items: RankingItem[];
  onReorder: (reorderedItems: RankingItem[]) => void;
  onEdit: (item: RankingItem) => void;
  onDelete: (item: RankingItem) => void;
  isLoading: boolean;
}

export const DraggableRankingList: React.FC<DraggableRankingListProps> = ({
  items,
  onReorder,
  onEdit,
  onDelete,
  isLoading,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const reorderedItems = arrayMove(items, oldIndex, newIndex).map(
        (item, index) => ({
          ...item,
          displayOrder: index + 1,
        })
      );

      onReorder(reorderedItems);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items
          .filter((item) => item.id !== undefined)
          .map((item) => item.id!)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {items.map((item) => (
            <DraggableItem
              key={item.id}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
              isLoading={isLoading}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
