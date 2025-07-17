interface FloatingInputProps {
    visible: boolean;
    mode: string;
    parentId: string;
    onStopped: () => void;
}

function FloatingInput({
    visible,
    mode,
    parentId,
    onStopped,
}: FloatingInputProps) {
    if (!visible) return null;
    return <div></div>;
}
export default FloatingInput;
