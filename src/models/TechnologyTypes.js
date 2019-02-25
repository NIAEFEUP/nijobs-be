const TechnologyTypes = Object.freeze({
    REACT : "React",
    ANGULAR: "Angular",
    VUE: "Vue",
    NODEJS: "Node.js",
    JAVA: "Java",
    CPP: "C++",
    C: "C",
    CSHARP: "C#",
    CLOJURE: "Clojure",
    GO: "Go",
    HASKELL: "Haskell",
    SPRING_BOOT: "Spring Boot",
    OTHER: "OTHER",
});

const MIN_TECHNOLOGIES = 1;
const MAX_TECHNOLOGIES = 7;

module.exports = {
    TechnologyTypes,
    MIN_TECHNOLOGIES,
    MAX_TECHNOLOGIES,
};