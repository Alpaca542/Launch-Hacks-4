import Markdown from "react-markdown";
import Modal from "react-bootstrap/Modal";

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
        >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                    title{props.title}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>
                    <Markdown>{props.text}</Markdown>
                </p>
            </Modal.Body>
            <Modal.Footer>
                <Modal.Footer>
                    <button
                        onClick={props.onHide}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: "#6c757d",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "500",
                        }}
                        onMouseOver={(e) =>
                            (e.currentTarget.style.backgroundColor = "#5a6268")
                        }
                        onMouseOut={(e) =>
                            (e.currentTarget.style.backgroundColor = "#6c757d")
                        }
                    >
                        Close
                    </button>
                </Modal.Footer>
            </Modal.Footer>
        </Modal>
    );
}

export default ExplanationWindow;
