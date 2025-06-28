import conceptToken from "../components/ConceptToken";
import wordToken from "../components/WordToken";

export const convertTextIntoHtmlConceptTokens = (text: string) => {
    return text
        .split("_")
        .map((element, index) =>
            index % 2 === 1 ? conceptToken({ value: element }) : null
        )
        .filter(Boolean);
};

export const convertTextIntoHtmlWordTokens = (text: string) => {
    return text.split(" ").map((element) => {
        return wordToken({ value: element });
    });
};
