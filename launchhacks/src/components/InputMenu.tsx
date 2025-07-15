interface InputMenuProps {
    onModeSelected: (inputMode: string) => void;
    displayed: boolean;
}
function InputMenu({ onModeSelected }: InputMenuProps) {
    return (
        <div className="input-menu">
            <button
                onClick={() => {
                    onModeSelected("explain");
                }}
            >
                Explain
            </button>
            <button
                onClick={() => {
                    onModeSelected("answer");
                }}
            >
                Answer
            </button>
            <button
                onClick={() => {
                    onModeSelected("suggest");
                }}
            >
                Suggest
            </button>
        </div>
    );
}
export default InputMenu;
