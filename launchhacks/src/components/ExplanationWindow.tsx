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
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                    {props.title}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>
                    <Markdown>{props.text}</Markdown>
                </p>
            </Modal.Body>
            <Modal.Footer>
                <button onClick={props.onHide} className="btn btn-secondary">
                    Close
                </button>
            </Modal.Footer>
        </Modal>
    );
}

export default ExplanationWindow;
