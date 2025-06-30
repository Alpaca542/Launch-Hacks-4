import { useState, useCallback } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import "./BoardNameModal.css";

interface BoardNameModalProps {
    show: boolean;
    onHide: () => void;
    onConfirm: (boardName: string) => void;
    isCreating?: boolean;
}

function BoardNameModal({
    show,
    onHide,
    onConfirm,
    isCreating = false,
}: BoardNameModalProps) {
    const [boardName, setBoardName] = useState<string>("");
    const [isValid, setIsValid] = useState<boolean>(true);

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setBoardName(value);
            setIsValid(value.trim().length > 0 && value.trim().length <= 50);
        },
        []
    );

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            const trimmedName = boardName.trim();

            if (trimmedName.length > 0 && trimmedName.length <= 50) {
                onConfirm(trimmedName);
                setBoardName("");
                setIsValid(true);
            }
        },
        [boardName, onConfirm]
    );

    const handleHide = useCallback(() => {
        setBoardName("");
        setIsValid(true);
        onHide();
    }, [onHide]);

    const handleKeyPress = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter") {
                handleSubmit(e as any);
            }
        },
        [handleSubmit]
    );

    return (
        <Modal
            show={show}
            onHide={handleHide}
            centered
            backdrop="static"
            keyboard={false}
            className="board-name-modal"
            style={{ zIndex: 2001 }}
        >
            <Modal.Header closeButton>
                <Modal.Title>Create New Board</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Board Name</Form.Label>
                        <Form.Control
                            type="text"
                            value={boardName}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyPress}
                            placeholder="Enter board name..."
                            isInvalid={!isValid}
                            maxLength={50}
                            autoFocus
                        />
                        <Form.Control.Feedback
                            type="invalid"
                            className="text-muted"
                        >
                            Board name must be between 1 and 50 characters long.
                        </Form.Control.Feedback>
                        <Form.Text
                            className={
                                boardName.length === 50
                                    ? "text-danger"
                                    : "text-muted"
                            }
                        >
                            {boardName.length}/50 characters
                        </Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={handleHide}
                        disabled={isCreating}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={
                            !isValid ||
                            boardName.trim().length === 0 ||
                            isCreating
                        }
                    >
                        {isCreating ? "Creating..." : "Create Board"}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

export default BoardNameModal;
