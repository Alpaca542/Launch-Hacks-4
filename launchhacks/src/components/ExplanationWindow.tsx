import Markdown from "react-markdown";
import Modal from "react-bootstrap/Modal";
import "bootstrap/dist/css/bootstrap.min.css";
import "./ExplanationWindow.css";

interface ExplanationWindowProps {
    show: boolean;
    title: string;
    text: string;
    onHide: () => void;
}

function ExplanationWindow(props: ExplanationWindowProps) {
    return (
        <Modal
            {...props}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
            className="explanation-modal"
        >
            <Modal.Header closeButton className="explanation-header">
                <Modal.Title
                    id="contained-modal-title-vcenter"
                    className="explanation-title"
                >
                    {props.title}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="explanation-body">
                <div className="explanation-content">
                    <div className="explanation-markdown">
                        <Markdown>{props.text}</Markdown>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer className="explanation-footer">
                <button
                    onClick={props.onHide}
                    className="explanation-close-btn"
                >
                    Close
                </button>
            </Modal.Footer>
        </Modal>
    );
}

export default ExplanationWindow;
