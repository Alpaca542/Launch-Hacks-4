import StaticEditableNode from "../components/StaticEditableNode";
import DraggableEditableNode from "../components/DraggableEditableNode";
import InputNode from "../components/InputNode";

export const nodeTypes = (
    showInputNode: (show: boolean, value: string) => void
) => ({
    staticEditable: StaticEditableNode,
    draggableEditable: (props: any) => (
        <DraggableEditableNode {...props} showInputNode={showInputNode} />
    ),
    inputNode: InputNode,
});
